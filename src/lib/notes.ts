// Builders that turn content (a base word, a sentence, a sound…) into a note
// plus its cards. Content notes get stable ids, so making the same card on two
// devices before they sync ends up as one card, not two.

import type { BaseWord, GrammarSentence, LanguagePack, MinimalPairSet, SoundLesson, VocabWord } from '../content/types';
import { clozeNumbers } from './cloze';
import type { Card, Note, NoteKind, Settings, Template } from './model';
import { uid } from './model';
import { newSched } from './srs';

export interface NoteMedia {
  image?: string;
  imageCredit?: string;
  audio?: string;
  audioCredit?: string;
  personal?: string;
  mnemonic?: string;
  extra?: string;
}

export interface Built {
  note: Note;
  cards: Card[];
}

export const noteId = (lang: string, kind: NoteKind, ref: string) => `${lang}:${kind}:${ref}`;

function cardsFor(note: Note, tmpls: Template[], now: number): Card[] {
  return tmpls.map(tmpl => ({
    ...newSched(now),
    id: `${note.id}:${tmpl}`,
    noteId: note.id,
    lang: note.lang,
    tmpl,
    updated: now,
  }));
}

/** Letters whose spelling an English speaker can't predict from the sound. */
export function trickySpelling(word: string): boolean {
  const w = word.toLowerCase();
  return /[bvhxáéíóú]|ll|y[aeiou]|[gj][eiéí]|gü/.test(w);
}

export function defaultWordTemplates(w: BaseWord, s: Pick<Settings, 'spellCards'>): Template[] {
  const t: Template[] = ['recall', 'recognize'];
  if (s.spellCards === 'all' || (s.spellCards === 'auto' && trickySpelling(w.word))) t.push('spell');
  return t;
}

export function buildWord(pack: LanguagePack, w: BaseWord, media: NoteMedia, tmpls: Template[], now: number, order: number, ipa?: string): Built {
  const note: Note = {
    id: noteId(pack.code, 'word', w.id),
    lang: pack.code,
    kind: 'word',
    ref: w.id,
    word: w.word,
    article: w.pos === 'noun' ? (w.article ?? articleFor(pack, w)) : undefined,
    gender: w.gender,
    fem: w.fem,
    pos: w.pos,
    en: w.en,
    ipa,
    ...media,
    image: media.image ?? defaultImage(w),
    tags: [w.category],
    order,
    created: now,
    updated: now,
  };
  return { note, cards: cardsFor(note, tmpls, now) };
}

export function articleFor(pack: LanguagePack, w: { gender?: string; article?: string }): string | undefined {
  if (w.article) return w.article;
  if (w.gender === 'm') return pack.genders.m.article;
  if (w.gender === 'f') return pack.genders.f.article;
  if (w.gender === 'mf') return `${pack.genders.m.article}/${pack.genders.f.article}`;
  return undefined;
}

export function defaultImage(w: { draw?: string; emoji?: string }): string | undefined {
  if (w.draw) return `draw:${w.draw}`;
  if (w.emoji) return `emoji:${w.emoji}`;
  return undefined;
}

export function buildSentence(pack: LanguagePack, s: GrammarSentence, topicId: string, media: NoteMedia, now: number, order: number): Built {
  const note: Note = {
    id: noteId(pack.code, 'sentence', s.id),
    lang: pack.code,
    kind: 'sentence',
    ref: s.id,
    word: s.text,
    en: s.en,
    extra: s.note,
    ...media,
    tags: [topicId],
    order,
    created: now,
    updated: now,
  };
  const tmpls = clozeNumbers(s.text).slice(0, 3).map(n => `cloze${n}` as Template);
  return { note, cards: cardsFor(note, tmpls, now) };
}

export function buildSound(pack: LanguagePack, l: SoundLesson, now: number, order: number): Built {
  const note: Note = {
    id: noteId(pack.code, 'sound', l.id),
    lang: pack.code,
    kind: 'sound',
    ref: l.id,
    word: l.title,
    ipa: l.ipa,
    extra: l.spellings.join(' · '),
    example: l.examples.map(e => e.word).join(', '),
    tags: ['pronunciation'],
    order,
    created: now,
    updated: now,
  };
  return { note, cards: cardsFor(note, ['sound', 'spelling'], now) };
}

export function buildPair(pack: LanguagePack, set: MinimalPairSet, index: number, now: number, order: number): Built {
  const [a, b] = set.pairs[index];
  const note: Note = {
    id: noteId(pack.code, 'pair', `${set.id}.${index}`),
    lang: pack.code,
    kind: 'pair',
    ref: `${set.id}.${index}`,
    word: `${a}|${b}`,
    extra: set.contrast,
    tags: ['pronunciation', set.id],
    order,
    created: now,
    updated: now,
  };
  return { note, cards: cardsFor(note, ['pair'], now) };
}

export function buildVocab(pack: LanguagePack, v: VocabWord, media: NoteMedia, now: number, order: number, ipa?: string, templates?: Template[]): Built {
  const note: Note = {
    id: noteId(pack.code, 'vocab', v.id),
    lang: pack.code,
    kind: 'vocab',
    ref: v.id,
    word: v.word,
    article: v.pos === 'noun' ? articleFor(pack, v) : undefined,
    gender: v.gender,
    fem: v.fem,
    pos: v.pos,
    en: v.en,
    def: v.def,
    example: v.example,
    ipa,
    ...media,
    image: media.image ?? (v.emoji ? `emoji:${v.emoji}` : undefined),
    tags: [v.topic ?? 'vocab'],
    order,
    created: now,
    updated: now,
  };
  const tmpls: Template[] = templates ?? (note.image ? ['define', 'recall'] : ['define']);
  return { note, cards: cardsFor(note, tmpls, now) };
}

export interface CustomFields extends NoteMedia {
  word: string;
  article?: string;
  gender?: Note['gender'];
  en?: string;
  def?: string;
  example?: string;
  ipa?: string;
}

/** A word you collected yourself: from a tutor, a book, a show. */
export function buildCustom(lang: string, f: CustomFields, tmpls: Template[], now: number, order: number): Built {
  const note: Note = {
    id: `${lang}:custom:${uid()}`,
    lang,
    kind: 'custom',
    ...f,
    tags: ['mine'],
    order,
    created: now,
    updated: now,
  };
  return { note, cards: cardsFor(note, tmpls, now) };
}

/** A sentence you wrote and had corrected, or copied from your grammar book. */
export function buildCustomSentence(lang: string, text: string, en: string | undefined, media: NoteMedia, now: number, order: number, tag = 'mine'): Built {
  const note: Note = {
    id: `${lang}:sentence:${uid()}`,
    lang,
    kind: 'sentence',
    word: text,
    en,
    ...media,
    tags: [tag],
    order,
    created: now,
    updated: now,
  };
  const tmpls = clozeNumbers(text).slice(0, 3).map(n => `cloze${n}` as Template);
  return { note, cards: cardsFor(note, tmpls, now) };
}

export function templatesOf(cards: Card[]): Template[] {
  return cards.map(c => c.tmpl);
}

/** Templates a note can have, given what it holds. */
export function possibleTemplates(note: Note): Template[] {
  switch (note.kind) {
    case 'word':
    case 'custom':
      return note.def ? ['recall', 'recognize', 'spell', 'define'] : ['recall', 'recognize', 'spell'];
    case 'vocab':
      return ['define', 'recall', 'recognize', 'spell'];
    case 'sentence':
      return clozeNumbers(note.word).slice(0, 3).map(n => `cloze${n}` as Template);
    case 'sound':
      return ['sound', 'spelling'];
    case 'pair':
      return ['pair'];
  }
}
