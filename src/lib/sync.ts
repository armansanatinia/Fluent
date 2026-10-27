// Sync between devices through the app's Cloudflare worker.
// Push: everything in the outbox. Pull: everything the server has seen since
// our cursor. Conflicts resolve by last edit wins, except day logs, which merge.

import * as idb from './db';
import type { SyncedStore } from './db';
import { mergeDay, sameContent } from './merge';
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
    // Clear only entries whose record hasn't changed since we read it.
    await idb.clearOutbox(sent);
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
      if (w.store === 'revlog') {
        // Review logs aren't kept in memory: compare with the saved copy (an undo leaves a newer tombstone).
        const here = await idb.getOne<{ updated: number }>('revlog', w.id);
        if (!here || incoming.updated > here.updated) add('revlog', false, incoming);
        continue;
      }
      const local = store.local(w.store, w.id);
      if (w.store === 'days' && local) {
        // Both devices may have studied today: take the latest tick and the most of each count.
        const merged = mergeDay(local as DayLog, incoming as unknown as DayLog);
        if (sameContent(merged, local)) continue;
        const pushBack = !sameContent(merged, incoming);
        add('days', pushBack, { ...merged, updated: Math.max(local.updated + 1, incoming.updated, pushBack ? Date.now() : 0) });
        continue;
      }
      if (local && local.updated >= incoming.updated) continue;
      add(w.store, false, incoming);
    }
    for (const { st, queue, recs } of byStore.values()) {
      // applyRemote re-checks against memory, in case you edited something while this page loaded.
      const taken = store.applyRemote(st, recs);
      await idb.putMany(st, taken, queue);
      pulled += taken.length;
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
