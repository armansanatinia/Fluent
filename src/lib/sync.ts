// Sync between devices through the app's Cloudflare worker.
// Push: everything in the outbox. Pull: everything the server has seen since
// our cursor. Conflicts resolve by last edit wins, except day logs, which merge.

import * as idb from './db';
import type { SyncedStore } from './db';
import type { DayLog } from './model';
import { store } from './store';

interface Wire {
  store: SyncedStore;
  id: string;
  updated: number;
  deleted?: boolean;
  data: unknown;
}

const CURSOR_KEY = 'fluent.cursor';
const CHUNK = 150;

function base(): string {
  return (store.device.syncUrl || '').replace(/\/$/, '');
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (store.device.syncToken) h.authorization = `Bearer ${store.device.syncToken}`;
  return h;
}

function cursor(): number {
  try {
    const all = JSON.parse(localStorage.getItem(CURSOR_KEY) || '{}') as Record<string, number>;
    return all[base() || 'self'] ?? 0;
  } catch { return 0; }
}

function setCursor(n: number) {
  try {
    const all = JSON.parse(localStorage.getItem(CURSOR_KEY) || '{}') as Record<string, number>;
    all[base() || 'self'] = n;
    localStorage.setItem(CURSOR_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function resetCursor() {
  setCursor(0);
}

export interface Health {
  ok: boolean;
  sync: boolean;
  ai: boolean;
  locked: boolean;
  authed: boolean;
}

/** Is there a server, and what can it do? */
export async function health(): Promise<Health | null> {
  try {
    const res = await fetch(`${base()}/api/health`, { headers: headers() });
    if (!res.ok) return null;
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}

function mergeDay(a: DayLog, b: DayLog): DayLog {
  const max = (x: Record<string, number>, y: Record<string, number>) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = Math.max(out[k] ?? 0, v);
    return out;
  };
  const custom = [...(a.custom ?? [])];
  for (const c of b.custom ?? []) if (!custom.some(x => x.id === c.id)) custom.push(c);
  return {
    id: a.id,
    checks: { ...a.checks, ...b.checks },
    made: max(a.made, b.made),
    reviews: Math.max(a.reviews, b.reviews),
    newCards: Math.max(a.newCards, b.newCards),
    ms: Math.max(a.ms, b.ms),
    custom,
    updated: Math.max(a.updated, b.updated),
  };
}

let running: Promise<{ pushed: number; pulled: number }> | null = null;

export function syncNow(): Promise<{ pushed: number; pulled: number }> {
  if (!running) running = doSync().finally(() => { running = null; });
  return running;
}

async function doSync(): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0;
  let pulled = 0;

  // 1. Push.
  const box = await idb.outbox();
  for (let i = 0; i < box.length; i += CHUNK) {
    const slice = box.slice(i, i + CHUNK);
    const recs: Wire[] = [];
    const sent: { key: string; updated: number }[] = [];
    for (const e of slice) {
      const r = await idb.getOne<{ id: string; updated: number; deleted?: boolean }>(e.store, e.id);
      if (!r) { sent.push({ key: e.key, updated: -1 }); continue; }
      recs.push({ store: e.store, id: e.id, updated: r.updated, deleted: !!r.deleted, data: r });
      sent.push({ key: e.key, updated: r.updated });
    }
    if (recs.length) {
      const res = await fetch(`${base()}/api/push`, { method: 'POST', headers: headers(), body: JSON.stringify({ records: recs }) });
      if (res.status === 401) throw new Error('The sync password was not accepted.');
      if (!res.ok) throw new Error(`Sync failed (${res.status}).`);
      pushed += recs.length;
    }
    // Only clear entries that didn't change while we were sending them.
    const done: string[] = [];
    for (const s of sent) {
      const [st, ...rest] = s.key.split('/');
      const now = await idb.getOne<{ updated: number }>(st as SyncedStore, rest.join('/'));
      if (s.updated === -1 || !now || now.updated === s.updated) done.push(s.key);
    }
    await idb.clearOutbox(done);
  }

  // 2. Pull.
  let since = cursor();
  for (let guard = 0; guard < 1000; guard++) {
    const res = await fetch(`${base()}/api/pull?since=${since}&limit=200`, { headers: headers() });
    if (res.status === 401) throw new Error('The sync password was not accepted.');
    if (!res.ok) throw new Error(`Sync failed (${res.status}).`);
    const page = (await res.json()) as { records: Wire[]; cursor: number; more: boolean };
    const byStore = new Map<string, { st: SyncedStore; queue: boolean; recs: { id: string; updated: number }[] }>();
    const add = (st: SyncedStore, queue: boolean, rec: { id: string; updated: number }) => {
      const k = `${st}/${queue}`;
      const g = byStore.get(k) ?? { st, queue, recs: [] };
      g.recs.push(rec);
      byStore.set(k, g);
    };
    for (const w of page.records) {
      const incoming = w.data as { id: string; updated: number };
      const local = store.local(w.store, w.id);
      if (w.store === 'days' && local) {
        // Both devices may have studied today: keep the most of each count.
        const merged = mergeDay(local as DayLog, incoming as unknown as DayLog);
        const same = (a: unknown, b: unknown) => JSON.stringify({ ...(a as object), updated: 0 }) === JSON.stringify({ ...(b as object), updated: 0 });
        if (same(merged, local)) continue;
        add('days', !same(merged, incoming), same(merged, incoming) ? incoming : { ...merged, updated: Math.max(merged.updated, Date.now()) });
        continue;
      }
      if (local && local.updated >= incoming.updated) continue;
      add(w.store, false, incoming);
    }
    for (const { st, queue, recs } of byStore.values()) {
      await idb.putMany(st, recs, queue);
      store.applyRemote(st, recs);
      pulled += recs.length;
    }
    since = page.cursor;
    setCursor(since);
    if (!page.more) break;
  }

  store.updateDevice({ lastSync: Date.now() });
  return { pushed, pulled };
}

// ---- automatic sync ---------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | null = null;
export let lastError = '';

function canSync() {
  return !!store.device.syncToken && store.device.autoSync && navigator.onLine !== false;
}

async function quiet() {
  if (!canSync()) return;
  try {
    await syncNow();
    lastError = '';
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
  }
  store.emit();
}

export function startAutoSync() {
  store.onChange = () => {
    if (!canSync()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(quiet, 20_000);
  };
  // Push when the app goes to the background; pull when it comes back.
  addEventListener('visibilitychange', quiet);
  addEventListener('online', quiet);
  setInterval(() => document.visibilityState === 'visible' && quiet(), 5 * 60_000);
  quiet();
}
