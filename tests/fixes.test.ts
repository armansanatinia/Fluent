// Regression tests for issues found in review.
import { beforeEach, describe, expect, it } from 'vitest';
import { spanish } from '../src/content/es';
import { check } from '../src/lib/answer';
import * as idb from '../src/lib/db';
import { mergeDay } from '../src/lib/merge';
import { emptyDay, type Card } from '../src/lib/model';
import { buildWord } from '../src/lib/notes';
import { buildQueue, nextCard } from '../src/lib/queue';
import { State } from '../src/lib/srs';
import { Store } from '../src/lib/store';
import { dayKey, MIN } from '../src/lib/time';

declare const process: { env: Record<string, string | undefined> };

let t = Date.UTC(2026, 9, 27, 12);
const fresh = () => { const s = new Store(); s.now = () => t; return s; };

beforeEach(async () => {
  idb.resetDbHandle();
  await idb.wipe();
  t = Date.UTC(2026, 9, 27, 12);
});

describe('journal', () => {
  it('saves the first entry of the day with an id, once', async () => {
    const s = fresh();
    await s.init();
    const a = s.saveJournal({ id: undefined, text: 'Hola, me llamo Ana.' });
    expect(a.id).toBeTruthy();
    const b = s.saveJournal({ id: a.id, text: 'Hola, me llamo Ana y vivo en Madrid.' });
    expect(b.id).toBe(a.id);
    expect(s.day().made.write).toBe(1);
    await new Promise(r => setTimeout(r, 30));
    expect(await idb.getAll('journal')).toHaveLength(1);
  });
});

describe('backup import', () => {
  it('keeps newer local edits', async () => {
    const s = fresh();
    await s.init();
    const dog = spanish.words.find(w => w.id === 'dog')!;
    const n = s.addBuilt(buildWord(spanish, dog, {}, ['recall'], t, 1));
    s.updateNote(n.id, { personal: 'new memory' });
    await new Promise(r => setTimeout(r, 30));
    const old = { ...s.notes.get(n.id)!, personal: 'old memory', updated: 5 };
    await s.importAll({ notes: [old] });
    expect(s.notes.get(n.id)!.personal).toBe('new memory');
  });
});

describe('queue', () => {
  it('never hides an overdue learning card behind the one just answered', () => {
    const mk = (id: string, due: number): Card => ({ id, noteId: id, lang: 'es-ES', tmpl: 'recall', state: State.Learning, due, step: 0, stability: 1, difficulty: 5, ease: 2.5, ivl: 0, reps: 1, lapses: 0, last: t, updated: t });
    const x = mk('x', t + 1 * MIN);
    const y = mk('y', t + 60 * MIN);
    const q = { learning: [x, y], review: [], fresh: [] };
    expect(nextCard(q, t + 2 * MIN, 0, 'x').card?.id).toBe('x');
    // But a learning card isn't shown long before its step.
    expect(nextCard({ learning: [y], review: [], fresh: [] }, t, 0, 'y')).toEqual({ card: null, waitUntil: y.due });
  });
  it('learning steps do not use up the review limit', async () => {
    const s = fresh();
    await s.init();
    const dog = spanish.words.find(w => w.id === 'dog')!;
    s.addBuilt(buildWord(spanish, dog, {}, ['recall'], t, 1));
    const id = buildQueue(s).fresh[0].id;
    s.answer(id, 1, 1000);
    t += 2 * MIN;
    s.answer(id, 1, 1000);
    expect(s.day().reviews).toBe(0);
    expect(s.day().answers).toBe(2);
  });
});

describe('day merge', () => {
  it('takes the latest tick from either device', () => {
    const a = { ...emptyDay('2026-10-27'), checks: { x: false }, checkedAt: { x: 200 }, updated: 1 };
    const b = { ...emptyDay('2026-10-27'), checks: { x: true }, checkedAt: { x: 100 }, updated: 2 };
    expect(mergeDay(a, b).checks.x).toBe(false);
    expect(mergeDay(b, a).checks.x).toBe(false);
  });
  it('does not bring back removed extra items', () => {
    const a = { ...emptyDay('d'), custom: [], removed: ['custom:1'] };
    const b = { ...emptyDay('d'), custom: [{ id: 'custom:1', title: 'x' }] };
    expect(mergeDay(a, b).custom).toEqual([]);
  });
});

describe('answers', () => {
  it('treats ñ as a letter, not an accent', () => {
    expect(check('ano', 'año')).not.toBe('accents');
    expect(check('arbol', 'árbol')).toBe('accents');
  });
});

describe('study day', () => {
  it('starts at 4 am local time even on a daylight-saving day', () => {
    process.env.TZ = 'Europe/Madrid';
    // 29 March 2026: clocks jump from 02:00 to 03:00 in Spain.
    const at = new Date(2026, 2, 29, 4, 30).getTime();
    expect(dayKey(at, 4)).toBe('2026-03-29');
    expect(dayKey(new Date(2026, 2, 29, 3, 30).getTime(), 4)).toBe('2026-03-28');
    delete process.env.TZ;
  });
});
