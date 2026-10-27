import { describe, expect, it } from 'vitest';
import { spanish } from '../src/content/es';
import { clozeNumbers, parseCloze } from '../src/lib/cloze';

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('Spanish pack', () => {
  it('has the base word list with genders', () => {
    expect(spanish.words.length).toBeGreaterThanOrEqual(600);
    expect(unique(spanish.words.map(w => w.id))).toBe(true);
    const cats = new Set(spanish.categories.map(c => c.id));
    for (const w of spanish.words) {
      expect(cats.has(w.category), w.id).toBe(true);
      if (w.pos === 'noun') expect(w.gender, w.id).toBeTruthy();
    }
    const agua = spanish.words.find(w => w.word === 'agua')!;
    expect(agua.gender).toBe('f');
    expect(agua.article).toBe('el');
  });
  it('has well-formed grammar sentences', () => {
    expect(spanish.grammar.length).toBeGreaterThan(30);
    const ids = spanish.grammar.flatMap(t => t.sentences.map(s => s.id));
    expect(unique(ids)).toBe(true);
    for (const t of spanish.grammar) for (const s of t.sentences) {
      const n = clozeNumbers(s.text);
      expect(n[0], s.id).toBe(1);
      expect(parseCloze(s.text).some(p => p.t === 'cloze')).toBe(true);
      expect(s.text.includes('{{') && !s.text.replace(/\{\{c\d+::.*?\}\}/g, '').includes('{{'), s.id).toBe(true);
    }
    expect(spanish.grammar.some(t => t.id === 'demonstratives')).toBe(true);
  });
  it('has sounds and real minimal pairs', () => {
    const lessons = new Set(spanish.sounds.map(s => s.id));
    for (const s of spanish.sounds) for (const e of s.examples) expect(e.word.includes(e.mark), `${s.id} ${e.word}`).toBe(true);
    for (const p of spanish.pairs) {
      for (const l of p.lessons) expect(lessons.has(l), p.id).toBe(true);
      for (const [a, b] of p.pairs) expect(a).not.toBe(b);
    }
  });
  it('links every activity to a resource', () => {
    const res = new Set(spanish.resources.map(r => r.id));
    for (const a of spanish.activities) expect(res.has(a.resource), a.id).toBe(true);
    for (const r of spanish.resources) expect(r.url.startsWith('https://'), r.id).toBe(true);
  });
  it('keeps vocabulary separate from base words', () => {
    const base = new Set(spanish.words.map(w => `${w.word}|${w.pos}`));
    for (const v of spanish.vocab) {
      expect(base.has(`${v.word}|${v.pos}`)).toBe(false);
      expect(v.example.match(/\[\[/g)?.length, v.id).toBe(1);
    }
  });
});
