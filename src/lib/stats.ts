import type { ReviewLog } from './model';
import { State } from './srs';
import type { Store } from './store';
import { addDays, DAY, keyStart } from './time';

export interface CardCounts {
  new: number;
  learning: number;
  young: number;
  mature: number;
  suspended: number;
  total: number;
}

function studied(s: Store, day: string): boolean {
  const d = s.days.get(day);
  if (!d) return false;
  return d.reviews + d.newCards > 0 || Object.values(d.made).some(n => n > 0);
}

/** Days in a row with some study, counting today only once something is done. */
export function streak(s: Store): { current: number; best: number } {
  const today = s.today();
  let cur = 0;
  let day = studied(s, today) ? today : addDays(today, -1);
  while (studied(s, day)) {
    cur++;
    day = addDays(day, -1);
  }
  let best = cur;
  const keys = [...s.days.keys()].filter(k => studied(s, k)).sort();
  let run = 0;
  let prev = '';
  for (const k of keys) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current: cur, best };
}

export function cardCounts(s: Store): CardCounts {
  const c: CardCounts = { new: 0, learning: 0, young: 0, mature: 0, suspended: 0, total: 0 };
  for (const card of s.cards.values()) {
    if (card.deleted || card.lang !== s.settings.lang) continue;
    const note = s.notes.get(card.noteId);
    if (!note || note.deleted) continue;
    c.total++;
    if (card.suspended) c.suspended++;
    else if (card.state === State.New) c.new++;
    else if (card.state === State.Review) (card.ivl >= 21 ? c.mature++ : c.young++);
    else c.learning++;
  }
  return c;
}

/** Cards coming due on each of the next `days` days (day 0 = today). */
export function forecast(s: Store, days = 14): number[] {
  const out = Array(days).fill(0);
  const start = keyStart(s.today(), s.settings.resetHour);
  for (const c of s.cards.values()) {
    if (c.deleted || c.suspended || c.state === State.New || c.lang !== s.settings.lang) continue;
    const idx = Math.max(0, Math.floor((c.due - start) / DAY));
    if (idx < days) out[idx]++;
  }
  return out;
}

export interface DayStat {
  day: string;
  reviews: number;
  minutes: number;
}

export function lastDays(s: Store, n = 30): DayStat[] {
  const today = s.today();
  return Array.from({ length: n }, (_, i) => {
    const day = addDays(today, i - n + 1);
    const d = s.days.get(day);
    return { day, reviews: d ? d.reviews + d.newCards : 0, minutes: d ? Math.round(d.ms / 60000) : 0 };
  });
}

/** Share of review cards (not learning ones) you remembered, over the last `days`. */
export function retention(logs: ReviewLog[], since: number): { rate: number | null; n: number } {
  let n = 0;
  let ok = 0;
  for (const l of logs) {
    if (l.ts < since || l.state !== State.Review) continue;
    n++;
    if (l.rating > 1) ok++;
  }
  return { rate: n ? ok / n : null, n };
}

export function totalMinutes(s: Store): number {
  let ms = 0;
  for (const d of s.days.values()) ms += d.ms;
  return Math.round(ms / 60000);
}
