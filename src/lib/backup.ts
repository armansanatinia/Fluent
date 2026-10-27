import { plainText } from './cloze';
import type { Store } from './store';

export function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

const cell = (v: unknown) => {
  const t = String(v ?? '');
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Notes as CSV, for importing into Anki (File → Import, fields separated by commas). */
export function exportCsv(s: Store): string {
  const head = ['kind', 'front', 'article', 'gender', 'ipa', 'english', 'definition', 'example', 'personal', 'gender_image', 'tags'];
  const rows = s.liveNotes().map(n => [
    n.kind,
    n.kind === 'sentence' ? n.word.replace(/\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/g, '{{c$1::$2}}') : n.kind === 'pair' ? n.word.replace('|', ' / ') : n.word,
    n.article, n.gender, n.ipa, n.en, n.def, n.example?.replace(/\[\[(.+?)\]\]/g, '$1') ?? (n.kind === 'sentence' ? plainText(n.word) : ''),
    n.personal, n.mnemonic, (n.tags ?? []).join(' '),
  ]);
  return [head, ...rows].map(r => r.map(cell).join(',')).join('\n');
}
