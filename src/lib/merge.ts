// Merging records that two devices (or a backup) both changed.
import type { DayLog } from './model';

/** A day studied on two devices: the latest tick of each item, the most of each count. */
export function mergeDay(a: DayLog, b: DayLog): DayLog {
  const max = (x: Record<string, number>, y: Record<string, number>) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = Math.max(out[k] ?? 0, v);
    return out;
  };
  const checks: Record<string, boolean> = {};
  const checkedAt: Record<string, number> = {};
  const aAt = a.checkedAt ?? {};
  const bAt = b.checkedAt ?? {};
  for (const id of new Set([...Object.keys(a.checks), ...Object.keys(b.checks)])) {
    const ta = id in a.checks ? aAt[id] ?? 0 : -1;
    const tb = id in b.checks ? bAt[id] ?? 0 : -1;
    const fromB = tb > ta || (tb === ta && b.updated > a.updated);
    checks[id] = fromB ? b.checks[id] : a.checks[id];
    checkedAt[id] = Math.max(ta, tb, 0);
  }
  const removed = [...new Set([...(a.removed ?? []), ...(b.removed ?? [])])];
  const custom = [...(a.custom ?? [])];
  for (const c of b.custom ?? []) if (!custom.some(x => x.id === c.id)) custom.push(c);
  return {
    id: a.id,
    checks,
    checkedAt,
    made: max(a.made, b.made),
    reviews: Math.max(a.reviews, b.reviews),
    newCards: Math.max(a.newCards, b.newCards),
    answers: Math.max(a.answers ?? a.reviews + a.newCards, b.answers ?? b.reviews + b.newCards),
    ms: Math.max(a.ms, b.ms),
    custom: custom.filter(c => !removed.includes(c.id)),
    removed,
    updated: Math.max(a.updated, b.updated),
  };
}

/** Same content, ignoring the edit time. */
export function sameContent(a: unknown, b: unknown): boolean {
  return JSON.stringify({ ...(a as object), updated: 0 }) === JSON.stringify({ ...(b as object), updated: 0 });
}
