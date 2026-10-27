// Checking typed answers. Spelling matters (it's a spelling card), but a
// missing accent is reported as "almost" rather than plain wrong.

export type Verdict = 'exact' | 'accents' | 'close' | 'wrong' | 'empty';

export interface DiffPart {
  text: string;
  kind: 'ok' | 'bad' | 'miss';
}

const clean = (s: string) =>
  s.normalize('NFC').toLowerCase().replace(/[¿?¡!.,;:"“”«»()]/g, '').replace(/\s+/g, ' ').trim();

export const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Show the expected answer, marking letters the typed answer got wrong or missed. */
export function diff(typed: string, expected: string): DiffPart[] {
  const a = clean(typed);
  const b = expected.normalize('NFC');
  const bl = b.toLowerCase();
  // Align with an edit-distance table, then walk back.
  const n = a.length;
  const m = bl.length;
  const dp = Array.from({ length: n + 1 }, (_, i) => [i, ...Array(m).fill(0)]);
  for (let j = 1; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === bl[j - 1] ? 0 : 1));
  const marks: DiffPart['kind'][] = Array(m).fill('ok');
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === bl[j - 1] ? 0 : 1)) {
      if (a[i - 1] !== bl[j - 1]) marks[j - 1] = 'bad';
      i--; j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      marks[j - 1] = 'miss';
      j--;
    } else i--;
  }
  const parts: DiffPart[] = [];
  for (let k = 0; k < m; k++) {
    const last = parts[parts.length - 1];
    if (last && last.kind === marks[k]) last.text += b[k];
    else parts.push({ text: b[k], kind: marks[k] });
  }
  return parts;
}

export function check(typed: string, expected: string, alternatives: string[] = []): Verdict {
  const t = clean(typed);
  if (!t) return 'empty';
  const all = [expected, ...alternatives].map(clean);
  if (all.includes(t)) return 'exact';
  if (all.some(x => stripAccents(x) === stripAccents(t))) return 'accents';
  if (all.some(x => distance(x, t) <= Math.max(1, Math.floor(x.length / 6)))) return 'close';
  return 'wrong';
}

export const VERDICT_TEXT: Record<Verdict, string> = {
  exact: 'Correct!',
  accents: 'Almost — check the accents.',
  close: 'Close — a letter or two off.',
  wrong: 'Not quite.',
  empty: '',
};
