import type { Gender, PartOfSpeech } from '../content/types';
import type { Sched, SchedulerSettings } from './srs';
import { DEFAULT_SCHED } from './srs';

export type NoteKind = 'word' | 'sentence' | 'sound' | 'pair' | 'vocab' | 'custom';

/** Card templates, following the book's gallery of flashcards. */
export type Template =
  | 'recall' // picture → say the word (and its gender)
  | 'recognize' // word + audio → what does it mean (picture)
  | 'spell' // picture + audio → type the spelling
  | 'cloze1' | 'cloze2' | 'cloze3' // sentence with a blank → fill it
  | 'pair' // hear one of two similar words → which was it?
  | 'sound' // spelling → how does it sound?
  | 'spelling' // sound → how is it spelled?
  | 'define'; // target-language definition → word

export const TEMPLATE_LABEL: Record<Template, string> = {
  recall: 'Picture → word',
  recognize: 'Word → picture',
  spell: 'Spelling',
  cloze1: 'Fill the blank',
  cloze2: 'Fill the blank (2)',
  cloze3: 'Fill the blank (3)',
  pair: 'Minimal pair',
  sound: 'Spelling → sound',
  spelling: 'Sound → spelling',
  define: 'Definition → word',
};

export interface Note {
  id: string;
  lang: string;
  kind: NoteKind;
  /** Content id this note was made from: a base word, sentence, sound, pair or vocab id. */
  ref?: string;
  /** The target text. Sentences keep their cloze markup; pairs are 'pero|perro'. */
  word: string;
  article?: string;
  gender?: Gender;
  fem?: string;
  pos?: PartOfSpeech;
  /** English gloss, hidden unless asked for. */
  en?: string;
  def?: string;
  example?: string;
  ipa?: string;
  /** data: URL, https URL, 'draw:<spec>' or 'emoji:<char>'. */
  image?: string;
  imageCredit?: string;
  /** Native recording URL. */
  audio?: string;
  audioCredit?: string;
  /** The book's personal connection: a memory tied to this word. */
  personal?: string;
  /** What you pictured for the gender (e.g. the dog exploding). */
  mnemonic?: string;
  extra?: string;
  tags?: string[];
  order: number;
  created: number;
  updated: number;
  deleted?: boolean;
}

export interface Card extends Sched {
  id: string;
  noteId: string;
  lang: string;
  tmpl: Template;
  suspended?: boolean;
  /** Study day (YYYY-MM-DD) the card was first shown. */
  introduced?: string;
  updated: number;
  deleted?: boolean;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  noteId: string;
  lang: string;
  ts: number;
  day: string;
  rating: 1 | 2 | 3 | 4;
  /** Card state before the answer. */
  state: number;
  /** Interval given, days (0 while learning). */
  ivl: number;
  /** Time spent on the card, ms. */
  ms: number;
  updated: number;
}

export interface DayLog {
  id: string; // study day YYYY-MM-DD
  /** Ticked plan items. */
  checks: Record<string, boolean>;
  /** When each check last changed, so two devices merge to the latest tick. */
  checkedAt?: Record<string, number>;
  /** Things made today, by kind: word, sentence, vocab, sound, custom, drill, write. */
  made: Record<string, number>;
  /** Answers on cards that were already in review (counts toward the review limit). */
  reviews: number;
  newCards: number;
  /** Every answer today, learning steps included. */
  answers?: number;
  ms: number;
  /** Extra items added by hand for this day. */
  custom?: { id: string; title: string; url?: string }[];
  /** Ids of extra items removed, so a merge doesn't bring them back. */
  removed?: string[];
  updated: number;
}

/** How many cards were answered on a day. */
export function answered(d: DayLog | undefined): number {
  if (!d) return 0;
  return d.answers ?? d.reviews + d.newCards;
}

export interface JournalEntry {
  id: string;
  lang: string;
  day: string;
  prompt?: string;
  text: string;
  /** Corrected version, from a native speaker or the AI helper. */
  corrected?: string;
  feedback?: string;
  postedTo?: string;
  cardsMade?: number;
  created: number;
  updated: number;
  deleted?: boolean;
}

export interface InboxItem {
  id: string;
  lang: string;
  text: string;
  context?: string;
  source?: string;
  done?: boolean;
  created: number;
  updated: number;
  deleted?: boolean;
}

export interface KV<T = unknown> {
  id: string;
  value: T;
  updated: number;
}

export type Effect = 'explode' | 'fire' | 'ice' | 'shatter' | 'melt' | 'electric' | 'none';

export interface GenderStyle {
  action: string;
  effect: Effect;
  color: string;
  emoji: string;
}

export type Level = 'beginner' | 'basics' | 'intermediate';

/** Settings that sync between devices. */
export interface Settings {
  id: 'settings';
  lang: string;
  level: Level;
  minutes: number;
  startDay: string;
  resetHour: number;
  sched: SchedulerSettings;
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  /** null = work it out from `minutes`. */
  wordsPerDay: number | null;
  sentencesPerDay: number | null;
  vocabPerDay: number | null;
  soundsPerDay: number | null;
  /** Base words made before grammar sentences join the plan. */
  grammarStartAt: number;
  skipSounds: boolean;
  tutorDays: number[];
  exchangeDays: number[];
  gender: { m: GenderStyle; f: GenderStyle };
  animations: boolean;
  autoplay: boolean;
  preferRecordings: boolean;
  typeRecall: boolean;
  spellCards: 'auto' | 'all' | 'none';
  showIpa: boolean;
  /** Activity ids hidden from the daily plan. */
  hiddenActivities: string[];
  updated: number;
}

/** Settings that stay on this device. */
export interface DeviceSettings {
  syncUrl: string;
  syncToken: string;
  autoSync: boolean;
  lastSync: number;
  voice: string;
  rate: number;
  aiMode: 'off' | 'server' | 'key';
  aiKey: string;
  aiModel: string;
  theme: 'auto' | 'light' | 'dark';
}

export const DEFAULT_GENDER: Settings['gender'] = {
  m: { action: 'explodes', effect: 'explode', color: '#2f6fed', emoji: '💥' },
  f: { action: 'bursts into flames', effect: 'fire', color: '#e5383b', emoji: '🔥' },
};

export function defaultSettings(today: string): Settings {
  return {
    id: 'settings',
    lang: 'es-ES',
    level: 'basics',
    minutes: 60,
    startDay: today,
    resetHour: 4,
    sched: { ...DEFAULT_SCHED },
    newCardsPerDay: 40,
    maxReviewsPerDay: 500,
    wordsPerDay: null,
    sentencesPerDay: null,
    vocabPerDay: null,
    soundsPerDay: null,
    grammarStartAt: 300,
    skipSounds: false,
    tutorDays: [2, 6],
    exchangeDays: [4],
    gender: structuredClone(DEFAULT_GENDER),
    animations: true,
    autoplay: true,
    preferRecordings: true,
    typeRecall: false,
    spellCards: 'auto',
    showIpa: true,
    hiddenActivities: [],
    updated: 0,
  };
}

export const DEFAULT_DEVICE: DeviceSettings = {
  syncUrl: '',
  syncToken: '',
  autoSync: true,
  lastSync: 0,
  voice: '',
  rate: 0.9,
  aiMode: 'off',
  aiKey: '',
  aiModel: 'claude-opus-5-5',
  theme: 'auto',
};

export function emptyDay(id: string): DayLog {
  return { id, checks: {}, made: {}, reviews: 0, newCards: 0, answers: 0, ms: 0, updated: 0 };
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
