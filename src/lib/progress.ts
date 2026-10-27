// Counts the daily plan and progress screens are built from.
import { buildPlan, type Plan, type PlanCounts } from './plan';
import { buildQueue } from './queue';
import type { Store } from './store';

export function excludedWords(s: Store): string[] {
  return s.get<string[]>(`words:excluded:${s.settings.lang}`) ?? [];
}

export function planCounts(s: Store): PlanCounts {
  const q = buildQueue(s);
  const words = new Set(s.liveNotes('word').map(n => n.ref));
  for (const id of excludedWords(s)) words.add(id);
  const today = s.today();
  let inboxOpen = 0;
  for (const i of s.inbox.values()) if (!i.deleted && !i.done && i.lang === s.settings.lang) inboxOpen++;
  let wroteToday = false;
  for (const j of s.journal.values()) if (!j.deleted && j.day === today && j.text.trim() && j.lang === s.settings.lang) wroteToday = true;
  return {
    wordsMade: words.size,
    sentencesMade: s.liveNotes('sentence').filter(n => n.ref).length,
    vocabMade: s.liveNotes('vocab').length,
    soundsMade: s.liveNotes('sound').length,
    pairsMade: s.liveNotes('pair').length,
    due: q.learning.length + q.review.length,
    fresh: q.fresh.length,
    inboxOpen,
    wroteToday,
  };
}

export function todayPlan(s: Store): Plan {
  return buildPlan(s.pack, s.settings, planCounts(s), s.day());
}
