import { beforeEach, describe, expect, it } from 'vitest';
import { spanish } from '../src/content/es';
import { resetDbHandle, wipe } from '../src/lib/db';
import { buildPair, buildSentence, buildWord } from '../src/lib/notes';
import { buildQueue, nextCard } from '../src/lib/queue';
import { State } from '../src/lib/srs';
import { Store } from '../src/lib/store';
import { MIN } from '../src/lib/time';

let t = Date.UTC(2026, 9, 27, 12);
function fresh() {
  const s = new Store();
  s.now = () => t;
  return s;
}

beforeEach(async () => {
  resetDbHandle();
  await wipe();
  t = Date.UTC(2026, 9, 27, 12);
});

describe('store', () => {
  it('makes word cards and studies them', async () => {
    const s = fresh();
    await s.init();
    const dog = spanish.words.find(w => w.id === 'dog')!;
    s.addBuilt(buildWord(spanish, dog, {}, ['recall', 'recognize'], t, 1, 'ˈpe.ro'), 'word');
    expect(s.liveNotes('word')).toHaveLength(1);
    expect(s.day().made.word).toBe(1);
    expect(s.notes.get('es-ES:word:dog')!.article).toBe('el');

    // Siblings wait: only one new card from this note today.
    let q = buildQueue(s);
    expect(q.fresh).toHaveLength(1);
    expect(q.fresh[0].tmpl).toBe('recall');

    const card = nextCard(q, t, 0).card!;
    s.answer(card.id, 3, 4000);
    expect(s.cards.get(card.id)!.state).toBe(State.Learning);
    expect(s.day().newCards).toBe(1);
    q = buildQueue(s);
    expect(q.fresh).toHaveLength(0);
    expect(q.learning).toHaveLength(1);

    t += 11 * MIN;
    s.answer(card.id, 3, 3000);
    expect(s.cards.get(card.id)!.state).toBe(State.Review);
    expect(s.day().reviews).toBe(1);

    // Undo puts it back.
    s.undo();
    expect(s.cards.get(card.id)!.state).toBe(State.Learning);
    expect(s.day().reviews).toBe(0);
  });

  it('persists to IndexedDB', async () => {
    const s = fresh();
    await s.init();
    s.addBuilt(buildSentence(spanish, spanish.grammar[0].sentences[0], spanish.grammar[0].id, {}, t, 1), 'sentence');
    s.addBuilt(buildPair(spanish, spanish.pairs[0], 0, t, 2));
    s.updateSettings({ minutes: 90 });
    await new Promise(r => setTimeout(r, 50));
    const again = fresh();
    await again.init();
    expect(again.liveNotes('sentence')).toHaveLength(1);
    expect(again.liveNotes('pair')).toHaveLength(1);
    expect(again.settings.minutes).toBe(90);
    expect(again.isNew).toBe(false);
  });

  it('deleting a note removes its cards from the queue', async () => {
    const s = fresh();
    await s.init();
    const cat = spanish.words.find(w => w.id === 'cat')!;
    const n = s.addBuilt(buildWord(spanish, cat, {}, ['recall'], t, 1));
    expect(buildQueue(s).fresh).toHaveLength(1);
    s.deleteNote(n.id);
    expect(buildQueue(s).fresh).toHaveLength(0);
  });
});
