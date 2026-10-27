// Fetch JSON from an open API. If the browser can't reach it directly (CORS,
// a content blocker, a strict network), go through the app's own server.
import { store } from './store';

export function serverBase(): string {
  return (store.device.syncUrl || '').replace(/\/$/, '');
}

export function serverHeaders(): Record<string, string> {
  return store.device.syncToken ? { authorization: `Bearer ${store.device.syncToken}` } : {};
}

export async function getJson<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url);
    if (res.ok) return (await res.json()) as T;
    if (res.status < 500 && res.status !== 403 && res.status !== 429) throw new Error(`HTTP ${res.status}`);
  } catch { /* fall through to the proxy */ }
  const res = await fetch(`${serverBase()}/api/proxy?u=${encodeURIComponent(url)}`, { headers: serverHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
