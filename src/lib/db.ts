// IndexedDB persistence. Every synced record has an `id` and an `updated`
// timestamp; each local write also drops a marker in the outbox so the next
// sync knows what to push.

import { openDB, type IDBPDatabase } from 'idb';

export const SYNCED = ['notes', 'cards', 'revlog', 'days', 'journal', 'inbox', 'kv', 'settings'] as const;
export type SyncedStore = (typeof SYNCED)[number];

export interface Rec {
  id: string;
  updated: number;
  deleted?: boolean;
}

interface OutboxEntry {
  key: string; // `${store}/${id}`
  store: SyncedStore;
  id: string;
  /** The record's `updated` when it was queued. */
  updated?: number;
}

let dbp: Promise<IDBPDatabase> | null = null;

export function db(name = 'fluent'): Promise<IDBPDatabase> {
  if (!dbp) {
    dbp = openDB(name, 1, {
      upgrade(d) {
        for (const s of SYNCED) d.createObjectStore(s, { keyPath: 'id' });
        d.createObjectStore('outbox', { keyPath: 'key' });
        d.createObjectStore('cache', { keyPath: 'id' });
      },
    });
  }
  return dbp;
}

/** For tests: forget the open connection. */
export function resetDbHandle() {
  dbp = null;
}

export async function getAll<T>(store: SyncedStore): Promise<T[]> {
  return (await db()).getAll(store) as Promise<T[]>;
}

/** Write records and queue them for sync. */
export async function putMany(store: SyncedStore, recs: Rec[], queue = true): Promise<void> {
  if (!recs.length) return;
  const d = await db();
  const tx = d.transaction(queue ? [store, 'outbox'] : [store], 'readwrite');
  const os = tx.objectStore(store);
  for (const r of recs) {
    os.put(r);
    if (queue) tx.objectStore('outbox').put({ key: `${store}/${r.id}`, store, id: r.id, updated: r.updated } satisfies OutboxEntry);
  }
  await tx.done;
}

export async function outbox(): Promise<OutboxEntry[]> {
  return (await db()).getAll('outbox') as Promise<OutboxEntry[]>;
}

/**
 * Remove pushed entries, in one transaction, but only where the queued
 * version is the one that was sent (updated = -1: the record was gone).
 * A record edited during the push re-queued itself with a newer `updated`
 * and stays for the next sync.
 */
export async function clearOutbox(sent: { key: string; updated: number }[]): Promise<void> {
  const d = await db();
  const tx = d.transaction('outbox', 'readwrite');
  await Promise.all(sent.map(async s => {
    const e = (await tx.store.get(s.key)) as OutboxEntry | undefined;
    if (e && (s.updated === -1 || e.updated === undefined || e.updated === s.updated)) await tx.store.delete(s.key);
  }));
  await tx.done;
}

export async function getOne<T>(store: SyncedStore, id: string): Promise<T | undefined> {
  return (await db()).get(store, id) as Promise<T | undefined>;
}

export async function cacheGet<T>(id: string): Promise<T | undefined> {
  const row = (await (await db()).get('cache', id)) as { id: string; value: T; at: number } | undefined;
  return row?.value;
}

export async function cacheSet<T>(id: string, value: T): Promise<void> {
  await (await db()).put('cache', { id, value, at: Date.now() });
}

export async function wipe(): Promise<void> {
  const d = await db();
  const names = [...SYNCED, 'outbox', 'cache'] as const;
  const tx = d.transaction([...names], 'readwrite');
  for (const n of names) tx.objectStore(n).clear();
  await tx.done;
}
