import { describe, expect, it } from 'vitest';
import { clozeAccepted, clozeAnswer, clozeNumbers, makeCloze, parseCloze, plainText, sentenceWords, splitExample } from '../src/lib/cloze';

describe('cloze', () => {
  const t = 'Yo {{c1::hablo::hablar}} con {{c2::mi}} madre y {{c1::como::comer}}.';
  it('parses blanks and hints', () => {
    const parts = parseCloze(t);
    expect(parts.filter(p => p.t === 'cloze')).toHaveLength(3);
    expect(parts[1]).toEqual({ t: 'cloze', n: 1, answer: 'hablo', alts: ['hablo'], hint: 'hablar' });
    expect(parts[3]).toEqual({ t: 'cloze', n: 2, answer: 'mi', alts: ['mi'], hint: undefined });
  });
  it('lists card numbers and plain text', () => {
    expect(clozeNumbers(t)).toEqual([1, 2]);
    expect(plainText(t)).toBe('Yo hablo con mi madre y como.');
    expect(clozeAnswer(t, 1)).toBe('hablo … como');
  });
  it('builds clozes from tapped words', () => {
    const plain = '¿Dónde está el baño?';
    expect(sentenceWords(plain)).toEqual(['Dónde', 'está', 'el', 'baño']);
    const out = makeCloze(plain, new Map([[1, { n: 1, hint: 'estar' }], [3, { n: 2 }]]));
    expect(out).toBe('¿Dónde {{c1::está::estar}} el {{c2::baño}}?');
    expect(plainText(out)).toBe(plain);
  });
  it('accepts alternative answers', () => {
    const x = 'Sí, {{c1::lo|le::him}} conozco.';
    expect(plainText(x)).toBe('Sí, lo conozco.');
    expect(clozeAccepted(x, 1)).toEqual(['lo', 'le']);
    expect(clozeAccepted('Si {{c1::tuviera|tuviese::tener}} y {{c1::fuera|fuese::ser}}', 1)).toEqual(['tuviera fuera', 'tuviera fuese', 'tuviese fuera', 'tuviese fuese']);
  });
  it('splits vocab examples', () => {
    expect(splitExample('Tengo [[miedo]] a los perros.')).toEqual({ before: 'Tengo ', target: 'miedo', after: ' a los perros.' });
  });
});
