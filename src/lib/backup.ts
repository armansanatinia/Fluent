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
    n.kind === 'sentence' ? n.word.replace(/\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/g, (_m, c: string, a: string) => `{{c${c}::${a.split('|')[0]}}}`) : n.kind === 'pair' ? n.word.replace('|', ' / ') : n.word,
    n.article, n.gender, n.ipa, n.en, n.def, n.example?.replace(/\[\[(.+?)\]\]/g, '$1') ?? (n.kind === 'sentence' ? plainText(n.word) : ''),
    n.personal, n.mnemonic, (n.tags ?? []).join(' '),
  ]);
  return [head, ...rows].map(r => r.map(cell).join(',')).join('\n');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A daily calendar event, so your phone reminds you even when the app is closed. */
export function reminderIcs(time: string, minutes: number, url: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const start = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fluent//Daily reminder//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:fluent-daily-${Date.now()}@fluent`, `DTSTAMP:${stamp}`, `DTSTART:${start}`,
    `DURATION:PT${minutes}M`, 'RRULE:FREQ=DAILY', 'SUMMARY:Spanish — today’s Fluent plan',
    `DESCRIPTION:Open your daily plan: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Time for Spanish', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export function googleCalendarLink(time: string, minutes: number, url: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  const e = new Date(d.getTime() + minutes * 60_000);
  const f = (x: Date) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: 'Spanish — today’s Fluent plan', dates: `${f(d)}/${f(e)}`,
    details: `Open your daily plan: ${url}`, recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
