// What to study next. Learning cards come back on their minute timers;
// review cards are due by the day; new cards are introduced up to the daily
// limit, one card per note per day (siblings wait until tomorrow, so seeing
// "picture → perro" doesn't give away "perro → picture" a minute later).

import type { Card, Note, Template } from './model';
import { State } from './srs';
import type { Store } from './store';
import { MIN, nextDayStart } from './time';

const TEMPLATE_ORDER: Template[] = ['sound', 'spelling', 'pair', 'recall', 'define', 'cloze1', 'recognize', 'cloze2', 'spell', 'cloze3'];
const LEARN_AHEAD = 20 * MIN;

export interface QueueCounts {
  learning: number;
  review: number;
  fresh: number;
}

export interface Queue {
  learning: Card[];
  review: Card[];
  fresh: Card[];
}

function activeNotes(s: Store): Map<string, Note> {
  const m = new Map<string, Note>();
  for (const n of s.notes.values()) if (!n.deleted && n.lang === s.settings.lang) m.set(n.id, n);
  return m;
}

export function buildQueue(s: Store, now = s.now()): Queue {
  const notes = activeNotes(s);
  const today = s.today(now);
  const dayEnd = nextDayStart(now, s.settings.resetHour);
  const day = s.day(today);
  const learning: Card[] = [];
  const review: Card[] = [];
  const freshAll: Card[] = [];
  const seenToday = new Set<string>(); // notes with a card introduced or in learning today

  for (const c of s.cards.values()) {
    if (c.deleted || c.suspended || !notes.has(c.noteId)) continue;
    if (c.introduced === today || c.state === State.Learning || c.state === State.Relearning) seenToday.add(c.noteId);
    if (c.state === State.Learning || c.state === State.Relearning) learning.push(c);
    else if (c.state === State.Review) { if (c.due < dayEnd) review.push(c); }
    else freshAll.push(c);
  }
  learning.sort((a, b) => a.due - b.due);
  review.sort((a, b) => a.due - b.due);

  const reviewLeft = Math.max(0, s.settings.maxReviewsPerDay - day.reviews);
  const freshLeft = Math.max(0, s.settings.newCardsPerDay - day.newCards);
  freshAll.sort((a, b) => {
    const na = notes.get(a.noteId)!;
    const nb = notes.get(b.noteId)!;
    return na.order - nb.order || TEMPLATE_ORDER.indexOf(a.tmpl) - TEMPLATE_ORDER.indexOf(b.tmpl);
  });
  const fresh: Card[] = [];
  const picked = new Set<string>();
  for (const c of freshAll) {
    if (fresh.length >= freshLeft) break;
    if (seenToday.has(c.noteId) || picked.has(c.noteId)) continue;
    picked.add(c.noteId);
    fresh.push(c);
  }
  return { learning, review: review.slice(0, reviewLeft), fresh };
}

/**
 * Pick the next card. `served` is how many cards this session has shown,
 * used to mix one new card in after every few reviews. `skip` is the card
 * just answered: it's avoided only while something else can be shown.
 */
export function nextCard(q: Queue, now: number, served: number, skip?: string): { card: Card | null; waitUntil?: number } {
  const ok = (c: Card) => c.id !== skip;
  const dueLearning = q.learning.find(c => c.due <= now && ok(c));
  if (dueLearning) return { card: dueLearning };
  const rev = q.review.find(ok);
  const fresh = q.fresh.find(ok);
  if (rev && fresh) return { card: served % 4 === 3 ? fresh : rev };
  if (rev || fresh) return { card: (rev ?? fresh)! };
  const ahead = q.learning.find(c => c.due <= now + LEARN_AHEAD && ok(c));
  if (ahead) return { card: ahead };
  // Nothing else: the card just answered may come back, but not before its step.
  const skipped = [...q.learning, ...q.review, ...q.fresh].find(c => c.id === skip);
  const isLearning = (c: Card) => c.state === State.Learning || c.state === State.Relearning;
  if (skipped && (!isLearning(skipped) || skipped.due <= now + LEARN_AHEAD)) return { card: skipped };
  const later = q.learning[0];
  return later ? { card: null, waitUntil: later.due } : { card: null };
}

/** Cards due today (learning + review) and new cards waiting, for the plan. */
export function dueSummary(s: Store, now = s.now()): QueueCounts {
  const q = buildQueue(s, now);
  return { learning: q.learning.length, review: q.review.length, fresh: q.fresh.length };
}
