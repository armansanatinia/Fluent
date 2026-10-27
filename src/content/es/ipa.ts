// Castilian Spanish (distinción) spelling → IPA, by rule.
// Spanish spelling is regular enough that a word's pronunciation, syllables and
// stress follow from how it's written. Output is a broad phonetic transcription
// with the main allophones: [β ð ɣ] between vowels, [ŋ] before k/g/x, [z]
// before voiced consonants, and glides in diphthongs. Example: perro → ˈpe.ro.

interface Seg {
  p: string; // phoneme
  v: boolean; // vowel
  weak?: boolean; // unaccented i/u
  acc?: boolean; // written accent
}

const ACC: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
const FRONT = new Set(['e', 'i', 'é', 'í']);
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü']);

function vowel(ch: string): Seg {
  const base = ACC[ch] ?? ch;
  const acc = ch in ACC && ch !== 'ü';
  return { p: base, v: true, acc, weak: (base === 'i' || base === 'u') && !acc };
}

function segment(word: string): Seg[] {
  const w = word;
  const out: Seg[] = [];
  const C = (p: string) => out.push({ p, v: false });
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    const nx = w[i + 1] ?? '';
    const prev = w[i - 1] ?? '';
    if (VOWELS.has(ch)) { out.push(vowel(ch)); continue; }
    switch (ch) {
      case 'c':
        if (nx === 'h') { C('tʃ'); i++; }
        else C(FRONT.has(nx) ? 'θ' : 'k');
        break;
      case 'l':
        if (nx === 'l') { C('ʝ'); i++; } else C('l');
        break;
      case 'r':
        if (nx === 'r') { C('r'); i++; }
        else C(i === 0 || 'nls'.includes(prev) ? 'r' : 'ɾ');
        break;
      case 'q':
        C('k');
        if (nx === 'u') i++;
        break;
      case 'g':
        if (nx === 'u' && FRONT.has(w[i + 2] ?? '')) { C('ɡ'); i++; }
        else C(FRONT.has(nx) ? 'x' : 'ɡ');
        break;
      case 'j': C('x'); break;
      case 'z': C('θ'); break;
      case 'ñ': C('ɲ'); break;
      case 'v': case 'b': C('b'); break;
      case 'h': break; // silent
      case 'x':
        if (i === 0) C('s'); else { C('k'); C('s'); }
        break;
      case 'y':
        if (VOWELS.has(nx)) C('ʝ');
        else out.push({ p: 'i', v: true, weak: true });
        break;
      case 'w': out.push({ p: 'u', v: true, weak: true }); break;
      case 'k': C('k'); break;
      default:
        if (/[a-zñ]/.test(ch)) C(ch);
    }
  }
  return out;
}

const INSEPARABLE = new Set(['pɾ', 'bɾ', 'fɾ', 'kɾ', 'ɡɾ', 'tɾ', 'dɾ', 'pl', 'bl', 'fl', 'kl', 'ɡl']);

/** Split segments into syllables. */
function syllabify(segs: Seg[]): Seg[][] {
  // Find vowel nuclei groups (diphthongs/triphthongs stay together).
  const groups: { start: number; end: number }[] = [];
  let i = 0;
  while (i < segs.length) {
    if (!segs[i].v) { i++; continue; }
    let j = i;
    while (j + 1 < segs.length && segs[j + 1].v) {
      const a = segs[j];
      const b = segs[j + 1];
      // Two strong vowels (a, e, o, or an accented í/ú) never share a syllable.
      if (!a.weak && !b.weak) break;
      j++;
    }
    groups.push({ start: i, end: j });
    i = j + 1;
  }
  if (!groups.length) return [segs];
  const sylls: Seg[][] = [];
  let cursor = 0;
  for (let g = 0; g < groups.length; g++) {
    const grp = groups[g];
    const next = groups[g + 1];
    if (!next) { sylls.push(segs.slice(cursor)); break; }
    const cons = segs.slice(grp.end + 1, next.start);
    let keep: number; // consonants that stay with this syllable
    const n = cons.length;
    if (n <= 1) keep = 0;
    else if (n === 2) keep = INSEPARABLE.has(cons[0].p + cons[1].p) ? 0 : 1;
    else if (n === 3) keep = INSEPARABLE.has(cons[1].p + cons[2].p) ? 1 : 2;
    else keep = n - 2;
    const cut = grp.end + 1 + keep;
    sylls.push(segs.slice(cursor, cut));
    cursor = cut;
  }
  return sylls;
}

function stressIndex(word: string, sylls: Seg[][]): number {
  for (let k = 0; k < sylls.length; k++) if (sylls[k].some(s => s.acc)) return k;
  if (sylls.length < 2) return 0;
  const last = word[word.length - 1];
  return /[aeiouns]/.test(last) ? sylls.length - 2 : sylls.length - 1;
}

const VOICED = new Set(['b', 'd', 'ɡ', 'm', 'n', 'ɲ', 'l', 'ʝ', 'r', 'ɾ']);
const NASAL = new Set(['m', 'n', 'ɲ', 'ŋ']);

function transcribeWord(raw: string): string {
  const word = raw.normalize('NFC').toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  if (!word) return '';
  const segs = segment(word);
  const sylls = syllabify(segs);
  const stressed = stressIndex(word, sylls);
  const flat = sylls.flat();

  // Glides: in each syllable, the strongest vowel is the nucleus.
  for (const syl of sylls) {
    const vs = syl.filter(s => s.v);
    if (vs.length < 2) continue;
    let nucleus = vs.findIndex(s => !s.weak);
    if (nucleus < 0) nucleus = vs.length - 1;
    vs.forEach((s, k) => {
      if (k === nucleus) return;
      if (k < nucleus) s.p = s.p === 'i' ? 'j' : 'w';
      else s.p = s.p === 'i' ? 'i̯' : 'u̯';
    });
  }

  // Allophones.
  const shown = flat.map(s => s.p);
  for (let k = 0; k < flat.length; k++) {
    const s = flat[k];
    if (s.v) continue;
    const prev = flat[k - 1];
    const next = flat[k + 1];
    if (s.p === 'b' || s.p === 'd' || s.p === 'ɡ') {
      const stop = k === 0 || (prev && NASAL.has(shown[k - 1])) || (s.p === 'd' && prev?.p === 'l');
      if (!stop) shown[k] = s.p === 'b' ? 'β' : s.p === 'd' ? 'ð' : 'ɣ';
    } else if (s.p === 'n' && next && !next.v) {
      if (next.p === 'b' || next.p === 'p' || next.p === 'm') shown[k] = 'm';
      else if (next.p === 'k' || next.p === 'ɡ' || next.p === 'x') shown[k] = 'ŋ';
    } else if (s.p === 's' && next && !next.v && VOICED.has(next.p)) {
      shown[k] = 'z';
    }
  }

  let pos = 0;
  const parts = sylls.map(syl => {
    const text = syl.map((_, k) => shown[pos + k]).join('');
    pos += syl.length;
    return text;
  });
  if (parts.length === 1) return parts[0];
  return parts.map((p, k) => (k === stressed ? 'ˈ' : k === 0 ? '' : '.') + p).join('');
}

/** IPA for a word or short phrase, without brackets: 'ˈpe.ro'. */
export function ipa(text: string): string {
  return text
    .split(/[\s-]+/)
    .map(transcribeWord)
    .filter(Boolean)
    .join(' ');
}

/** Number of syllables and which one is stressed (0-based), for the stress trainer. */
export function stressInfo(word: string): { syllables: string[]; stressed: number } {
  const w = word.normalize('NFC').toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  const sylls = syllabify(segment(w));
  return { syllables: sylls.map(s => s.map(x => x.p).join('')), stressed: stressIndex(w, sylls) };
}
