// The daily plan: everything to do today, in and out of the app.
//
// The book's order is: pronunciation → 625 base words → grammar through
// sentences → vocabulary with target-language definitions → fluency. Phases
// overlap: base words start alongside pronunciation, and grammar sentences
// join once enough base words are in your deck. Quotas scale with your daily
// minutes, and new work shrinks on days with a heavy review load so the plan
// stays near your time budget.

import type { ActivityTemplate, LanguagePack, PhaseId } from '../content/types';
import type { DayLog, Settings } from './model';
import { daysBetween, weekday } from './time';

export interface PlanCounts {
  wordsMade: number;
  sentencesMade: number;
  vocabMade: number;
  soundsMade: number;
  pairsMade: number;
  /** Learning + review cards due today. */
  due: number;
  /** New cards waiting to be introduced today. */
  fresh: number;
  inboxOpen: number;
  wroteToday: boolean;
}

export interface PhaseState {
  id: PhaseId;
  title: string;
  blurb: string;
  active: boolean;
  done: boolean;
  progress: number; // 0..1
  detail: string;
}

export interface PlanItem {
  id: string;
  section: 'app' | 'outside' | 'weekly' | 'custom';
  title: string;
  detail?: string;
  minutes: number;
  /** In-app route, e.g. '#/review'. */
  route?: string;
  /** Outside link. */
  url?: string;
  resource?: string;
  /** Completion worked out from your data. Otherwise you tick it yourself. */
  auto: boolean;
  done: boolean;
  progress?: { done: number; total: number };
}

export interface Plan {
  day: string;
  phases: PhaseState[];
  items: PlanItem[];
  minutes: number;
  minutesLeft: number;
  note?: string;
}

const QUOTA: Record<'words' | 'sentences' | 'vocab' | 'sounds', [number, number, number]> = {
  // [30 min, 60 min, 90 min]
  words: [8, 15, 22],
  sentences: [4, 8, 12],
  vocab: [6, 12, 18],
  sounds: [2, 3, 4],
};

function quota(kind: keyof typeof QUOTA, minutes: number, override: number | null): number {
  if (override != null) return override;
  const [a, b, c] = QUOTA[kind];
  if (minutes <= 30) return Math.round(a * (minutes / 30));
  if (minutes <= 60) return Math.round(a + ((b - a) * (minutes - 30)) / 30);
  return Math.round(b + ((c - b) * Math.min(minutes - 60, 60)) / 30);
}

// Rough minutes per thing, used for the time estimate.
const SEC = { review: 9, word: 50, sentence: 60, vocab: 40, sound: 240 };

export function phases(pack: LanguagePack, s: Settings, c: PlanCounts): PhaseState[] {
  const words = pack.words.length || 1;
  const sentences = pack.grammar.reduce((n, t) => n + t.sentences.length, 0) || 1;
  const soundsTotal = pack.sounds.length || 1;
  const soundsDone = s.skipSounds || c.soundsMade >= soundsTotal;
  const wordsDone = c.wordsMade >= words * 0.98;
  const grammarActive = c.wordsMade >= Math.min(s.grammarStartAt, words);
  const grammarDone = c.sentencesMade >= sentences * 0.9;
  const vocabActive = wordsDone && (c.sentencesMade >= sentences * 0.4);
  const vocabDone = c.vocabMade >= pack.vocab.length * 0.95 && pack.vocab.length > 0;
  return [
    {
      id: 'sounds', title: 'Pronunciation', active: !soundsDone, done: soundsDone,
      progress: s.skipSounds ? 1 : Math.min(1, c.soundsMade / soundsTotal),
      blurb: 'Train your ears with minimal pairs and learn how every sound is spelled.',
      detail: `${Math.min(c.soundsMade, soundsTotal)} of ${soundsTotal} sounds`,
    },
    {
      id: 'words', title: 'Base words', active: !wordsDone, done: wordsDone,
      progress: Math.min(1, c.wordsMade / words),
      blurb: 'The book’s “Your first 625” list: everyday words with pictures, real audio and genders, no English.',
      detail: `${c.wordsMade} of ${words} words`,
    },
    {
      id: 'grammar', title: 'Grammar through sentences', active: grammarActive && !grammarDone, done: grammarDone,
      progress: Math.min(1, c.sentencesMade / sentences),
      blurb: 'Example sentences turned into fill-in-the-blank cards, plus writing.',
      detail: grammarActive ? `${c.sentencesMade} of ${sentences} sentences` : `Starts after ${s.grammarStartAt} base words`,
    },
    {
      id: 'vocab', title: 'Vocabulary expansion', active: vocabActive && !vocabDone, done: vocabDone,
      progress: pack.vocab.length ? Math.min(1, c.vocabMade / pack.vocab.length) : 0,
      blurb: 'Frequent and abstract words, learned with Spanish definitions.',
      detail: vocabActive ? `${c.vocabMade} of ${pack.vocab.length} words` : 'Starts after the base words and some grammar',
    },
    {
      id: 'fluency', title: 'Fluency', active: grammarActive, done: false,
      progress: Math.min(1, (c.sentencesMade / sentences) * 0.5 + (c.vocabMade / Math.max(1, pack.vocab.length)) * 0.5),
      blurb: 'Speak with tutors, write and get corrected, read and watch in Spanish.',
      detail: grammarActive ? 'Tutors, exchanges, TV and books' : 'Light listening for now',
    },
  ];
}

const LEVEL_RANK = { A1: 0, A2: 1, B1: 2, B2: 3 } as const;

function currentLevel(ph: PhaseState[]): number {
  const on = (id: PhaseId) => ph.find(p => p.id === id)!;
  if (on('vocab').active || on('vocab').done) return on('grammar').done ? 3 : 2;
  if (on('grammar').active) return 1;
  return 0;
}

function pick<T>(list: T[], seed: number): T | undefined {
  return list.length ? list[((seed % list.length) + list.length) % list.length] : undefined;
}

export function buildPlan(pack: LanguagePack, s: Settings, c: PlanCounts, day: DayLog): Plan {
  const ph = phases(pack, s, c);
  const on = (id: PhaseId) => ph.find(p => p.id === id)!.active;
  const dayIndex = Math.max(0, daysBetween(s.startDay, day.id));
  const wd = weekday(day.id);
  const budget = s.minutes;
  const items: PlanItem[] = [];
  const made = (k: string) => day.made[k] ?? 0;

  // Reviews come first: they're what keeps everything you've learned.
  const reviewMin = Math.ceil((c.due * SEC.review) / 60);
  items.push({
    id: 'reviews', section: 'app', route: '#/review', auto: true,
    title: 'Review your flashcards',
    detail: c.due ? `${c.due} due${c.fresh ? ` · ${c.fresh} new waiting` : ''}` : c.fresh ? `${c.fresh} new cards to learn` : 'All caught up',
    minutes: Math.max(reviewMin + Math.ceil((c.fresh * SEC.review * 2) / 60), c.due || c.fresh ? 3 : 0),
    done: c.due === 0 && (c.fresh === 0 || day.reviews + day.newCards > 0),
    progress: day.reviews + day.newCards + c.due > 0 ? { done: day.reviews + day.newCards, total: day.reviews + day.newCards + c.due + c.fresh } : undefined,
  });

  // On heavy review days, scale new work down so the day stays near budget.
  const spare = Math.max(0, budget * 0.75 - reviewMin);
  const scale = reviewMin > budget * 0.5 ? Math.max(0, spare / (budget * 0.5)) : 1;
  const note = scale < 1 ? `Heavy review day: new cards scaled down to ${Math.round(scale * 100)}% so you stay near ${budget} minutes.` : undefined;
  const q = (k: keyof typeof QUOTA, override: number | null, factor = 1) => Math.max(k === 'sounds' ? 1 : 0, Math.round(quota(k, budget, override) * factor * scale));

  if (on('sounds')) {
    const n = Math.min(q('sounds', s.soundsPerDay), pack.sounds.length - c.soundsMade);
    items.push({
      id: 'sounds', section: 'app', route: '#/sounds', auto: true,
      title: `Learn ${n} new sound${n === 1 ? '' : 's'}`,
      detail: 'How it is made, how it is spelled, then add its cards',
      minutes: Math.ceil((n * SEC.sound) / 60), done: made('sound') >= n,
      progress: { done: Math.min(made('sound'), n), total: n },
    });
    items.push({
      id: 'ear', section: 'app', route: '#/sounds/drill', auto: true,
      title: 'Ear training: one minimal-pair drill',
      detail: 'Hear the difference between pero and perro, casa and caza',
      minutes: 5, done: made('drill') >= 1,
    });
  }

  if (on('words')) {
    const n = q('words', s.wordsPerDay, on('sounds') ? 0.6 : 1);
    const left = pack.words.length - c.wordsMade;
    const target = Math.min(n, left);
    if (target > 0) items.push({
      id: 'words', section: 'app', route: '#/words', auto: true,
      title: `Make ${target} new word cards`,
      detail: 'Pick a picture, hear it, imagine the gender, add a memory',
      minutes: Math.ceil((target * SEC.word) / 60), done: made('word') >= target,
      progress: { done: Math.min(made('word'), target), total: target },
    });
  }

  if (on('grammar')) {
    const n = q('sentences', s.sentencesPerDay, on('words') ? 0.5 : 1);
    if (n > 0) items.push({
      id: 'grammar', section: 'app', route: '#/grammar', auto: true,
      title: `Make ${n} sentence cards`,
      detail: 'Read the next grammar point, then turn its sentences into cards',
      minutes: Math.ceil((n * SEC.sentence) / 60), done: made('sentence') >= n,
      progress: { done: Math.min(made('sentence'), n), total: n },
    });
    items.push({
      id: 'write', section: 'app', route: '#/write', auto: true,
      title: 'Write a few sentences',
      detail: "Today's prompt in the journal; get it corrected, then make cards from the corrections",
      minutes: 10, done: c.wroteToday,
    });
  }

  if (on('vocab')) {
    const n = q('vocab', s.vocabPerDay);
    items.push({
      id: 'vocab', section: 'app', route: '#/vocab', auto: true,
      title: `Learn ${n} words with Spanish definitions`,
      detail: 'Frequent words that pictures can’t show',
      minutes: Math.ceil((n * SEC.vocab) / 60), done: made('vocab') >= n,
      progress: { done: Math.min(made('vocab'), n), total: n },
    });
  }

  if (c.inboxOpen > 0 && (on('grammar') || on('vocab') || ph[1].done)) {
    items.push({
      id: 'inbox', section: 'app', route: '#/inbox', auto: true,
      title: `Turn ${Math.min(c.inboxOpen, 5)} saved words into cards`,
      detail: 'Words you collected from tutors, shows and books',
      minutes: 5, done: made('custom') >= Math.min(c.inboxOpen, 5),
    });
  }

  // Outside the app.
  const level = currentLevel(ph);
  const fits = (a: ActivityTemplate) =>
    !s.hiddenActivities.includes(a.id) &&
    a.phases.some(p => on(p) || (p === 'fluency' && on('grammar'))) &&
    (!a.minLevel || LEVEL_RANK[a.minLevel] <= level);
  const pool = pack.activities.filter(fits);
  const res = (id: string) => pack.resources.find(r => r.id === id);
  const outside = (a: ActivityTemplate, id = `act:${a.id}`) => {
    const r = res(a.resource);
    items.push({
      id, section: 'outside', title: a.title, detail: a.tip, minutes: a.minutes,
      url: r?.url, resource: a.resource, auto: false, done: !!day.checks[id],
    });
  };

  const input = pool.filter(a => ['listen', 'watch', 'read'].includes(a.kind));
  const inputMinutes = budget >= 90 ? 2 : 1;
  const firstInput = pick(input, dayIndex);
  if (firstInput) outside(firstInput);
  if (inputMinutes > 1 || wd === 0 || wd === 6) {
    const second = pick(input.filter(a => a.kind !== firstInput?.kind), dayIndex + 3);
    if (second) outside(second);
  }

  const grammarOn = on('grammar') || ph[2].done;
  const tutorDays = grammarOn ? s.tutorDays : s.tutorDays.slice(-1);
  if (tutorDays.includes(wd)) {
    const tutors = pool.filter(a => a.kind === 'tutor');
    const t = pick(tutors, dayIndex);
    if (t) outside(t, `act:tutor`);
  }
  if (grammarOn && s.exchangeDays.includes(wd)) {
    const ex = pick(pool.filter(a => a.kind === 'exchange'), dayIndex);
    if (ex) outside(ex, 'act:exchange');
  }
  if (grammarOn && [1, 3, 5].includes(wd)) {
    const corr = pick(pool.filter(a => a.kind === 'correct'), dayIndex);
    if (corr) outside(corr, 'act:correct');
  }
  if (on('sounds') && [2, 4].includes(wd)) {
    const sp = pick(pool.filter(a => a.kind === 'speak'), dayIndex);
    if (sp) outside(sp, 'act:speak');
  }
  if (wd === 0) {
    const rv = pick(pool.filter(a => a.kind === 'review'), dayIndex);
    if (rv) outside(rv, 'act:weekly');
    items.push({
      id: 'weekly:checkin', section: 'weekly', auto: false, route: '#/progress',
      title: 'Weekly check-in', detail: 'Look at your progress and book next week’s tutor sessions',
      minutes: 5, done: !!day.checks['weekly:checkin'],
    });
  }

  for (const cu of day.custom ?? []) {
    items.push({ id: cu.id, section: 'custom', title: cu.title, url: cu.url, minutes: 0, auto: false, done: !!day.checks[cu.id] });
  }

  // Let a manual tick override an auto item too (e.g. you did it elsewhere).
  for (const it of items) if (day.checks[it.id]) it.done = true;

  const minutes = items.reduce((n, i) => n + i.minutes, 0);
  const minutesLeft = items.filter(i => !i.done).reduce((n, i) => n + i.minutes, 0);
  return { day: day.id, phases: ph, items, minutes, minutesLeft, note };
}
