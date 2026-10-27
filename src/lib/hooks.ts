import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { store } from './store';

/** Re-render whenever the store changes. Returns the store. */
export function useStore() {
  useSyncExternalStore(store.subscribe, () => store.version);
  return store;
}

/** Hash route, e.g. '#/words' → ['words']. */
export function useRoute(): string[] {
  const get = () => (location.hash.replace(/^#\/?/, '') || 'today').split('/').filter(Boolean);
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => setRoute(get());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (hash: string) => {
  if (location.hash !== hash) location.hash = hash;
};

/** Ticks every `ms` so time-based UI (learning timers) stays fresh. */
export function useNow(ms = 15_000): number {
  const [now, setNow] = useState(() => store.now());
  useEffect(() => {
    const t = setInterval(() => setNow(store.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useLatest<T>(v: T) {
  const r = useRef(v);
  r.current = v;
  return r;
}

/** Keyboard shortcuts while mounted. */
export function useKeys(map: Record<string, () => void>, active = true) {
  const latest = useLatest(map);
  const handler = useCallback((e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const fn = latest.current[e.key === ' ' ? 'Space' : e.key];
    if (fn) { e.preventDefault(); fn(); }
  }, [latest]);
  useEffect(() => {
    if (!active) return;
    addEventListener('keydown', handler);
    return () => removeEventListener('keydown', handler);
  }, [handler, active]);
}
