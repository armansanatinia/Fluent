// Fill-in-the-blank markup, Anki style: {{c1::answer::hint}}.

const RE = /\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/g;

export type ClozePart =
  | { t: 'text'; text: string }
  /** `answer` is what's shown; `alts` are all accepted answers ({{c1::lo|le::him}}). */
  | { t: 'cloze'; n: number; answer: string; alts: string[]; hint?: string };

export function parseCloze(text: string): ClozePart[] {
  const parts: ClozePart[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    if (m.index! > last) parts.push({ t: 'text', text: text.slice(last, m.index) });
    const alts = m[2].split('|').map(a => a.trim()).filter(Boolean);
    parts.push({ t: 'cloze', n: Number(m[1]), answer: alts[0] ?? m[2], alts, hint: m[3] || undefined });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ t: 'text', text: text.slice(last) });
  return parts;
}

export function clozeNumbers(text: string): number[] {
  return [...new Set(parseCloze(text).flatMap(p => (p.t === 'cloze' ? [p.n] : [])))].sort((a, b) => a - b);
}

/** The sentence with all markup removed. */
export function plainText(text: string): string {
  return parseCloze(text).map(p => (p.t === 'text' ? p.text : p.answer)).join('');
}

/** The answer(s) for cloze number n, joined. */
export function clozeAnswer(text: string, n: number): string {
  return parseCloze(text).flatMap(p => (p.t === 'cloze' && p.n === n ? [p.answer] : [])).join(' … ');
}

/** Every accepted way to fill cloze n (alternatives multiply across its blanks). */
export function clozeAccepted(text: string, n: number): string[] {
  let out = [''];
  for (const p of parseCloze(text)) {
    if (p.t !== 'cloze' || p.n !== n) continue;
    out = out.flatMap(prefix => p.alts.map(a => (prefix ? `${prefix} ${a}` : a)));
  }
  return out;
}

/**
 * Wrap the chosen word positions of a plain sentence in cloze markup.
 * `picks` maps a word index to its cloze number and optional hint.
 */
export function makeCloze(plain: string, picks: Map<number, { n: number; hint?: string }>): string {
  const tokens = plain.match(/[\p{L}\p{M}\p{N}'’-]+|[^\p{L}\p{M}\p{N}'’-]+/gu) ?? [];
  let wi = -1;
  return tokens
    .map(tok => {
      if (!/[\p{L}\p{N}]/u.test(tok)) return tok;
      wi++;
      const p = picks.get(wi);
      if (!p) return tok;
      return `{{c${p.n}::${tok}${p.hint ? `::${p.hint}` : ''}}}`;
    })
    .join('');
}

/** Words of a plain sentence, for tapping to make blanks. */
export function sentenceWords(plain: string): string[] {
  return (plain.match(/[\p{L}\p{M}\p{N}'’-]+/gu) ?? []).filter(w => /[\p{L}\p{N}]/u.test(w));
}

/** Split an example like 'Tengo [[miedo]] a los perros.' around the target. */
export function splitExample(example: string): { before: string; target: string; after: string } {
  const m = example.match(/^(.*?)\[\[(.+?)\]\](.*)$/s);
  if (!m) return { before: example, target: '', after: '' };
  return { before: m[1], target: m[2], after: m[3] };
}

export function stripExample(example: string): string {
  return example.replace(/\[\[(.+?)\]\]/g, '$1');
}
