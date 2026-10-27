// Native audio, the book's way: real recordings of real speakers first
// (Lingua Libre on Wikimedia Commons, looked up by exact spelling), and the
// device's Spanish (Spain) voice when no recording exists.

import { cacheGet, cacheSet } from './db';
import { store } from './store';

export interface Recording {
  file: string; // Commons file name without 'File:'
  speaker: string;
  url: string;
  credit: string;
}

const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const MONTH = 30 * 86_400_000;

/**
 * Lingua Libre speakers from Spain, ranked first so you hear Castilian. You can
 * prefer or skip any other speaker from the audio menu on a card.
 */
const SPAIN_SPEAKERS = ['Rodelar', 'Millars'];

export function fileUrl(file: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
}

function norm(s: string) {
  return s.normalize('NFC').toLowerCase().trim();
}

function speakerPrefs(): { prefer: string[]; avoid: string[] } {
  return store.get<{ prefer: string[]; avoid: string[] }>('audio:speakers') ?? { prefer: [], avoid: [] };
}

export function rankRecordings(list: Recording[]): Recording[] {
  const { prefer, avoid } = speakerPrefs();
  const score = (r: Recording) =>
    (avoid.includes(r.speaker) ? -100 : 0) + (prefer.includes(r.speaker) ? 50 : 0) + (SPAIN_SPEAKERS.includes(r.speaker) ? 10 : 0);
  return [...list].sort((a, b) => score(b) - score(a));
}

/** All Lingua Libre recordings of exactly this word (cached for a month). */
export async function findRecordings(word: string, llCode = store.pack.linguaLibre): Promise<Recording[]> {
  if (!llCode) return [];
  const w = norm(word);
  if (!w || w.length > 60) return [];
  const key = `ll:${llCode}:${w}`;
  const cached = await cacheGet<{ at: number; list: Recording[] }>(key).catch(() => undefined);
  if (cached && Date.now() - cached.at < MONTH) return rankRecordings(cached.list);
  try {
    const params = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', list: 'search', srnamespace: '6', srlimit: '50',
      srsearch: `intitle:"${llCode}" intitle:"${w}"`,
    });
    const res = await fetch(`${COMMONS}?${params}`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { query?: { search?: { title: string }[] } };
    const prefix = `file:${norm(llCode)}-`;
    const list: Recording[] = [];
    for (const { title } of data.query?.search ?? []) {
      const t = norm(title);
      if (!t.startsWith(prefix)) continue;
      const m = t.slice(prefix.length).match(/^(.+)-(.+)\.(wav|ogg|mp3|flac)$/);
      if (!m) continue;
      // The word is everything after the last hyphen that matches exactly.
      if (!t.endsWith(`-${w}.${m[3]}`)) continue;
      const file = title.replace(/^File:/i, '');
      const speaker = file.slice(llCode.length + 1, file.length - w.length - m[3].length - 2);
      list.push({ file, speaker, url: fileUrl(file), credit: `${speaker} · Lingua Libre · CC BY-SA 4.0` });
    }
    await cacheSet(key, { at: Date.now(), list }).catch(() => undefined);
    return rankRecordings(list);
  } catch {
    return [];
  }
}

// ---- playback --------------------------------------------------------------

let player: HTMLAudioElement | null = null;

export function stopAudio() {
  player?.pause();
  if ('speechSynthesis' in globalThis) speechSynthesis.cancel();
}

export function playUrl(url: string): Promise<boolean> {
  stopAudio();
  player = player ?? new Audio();
  player.src = url;
  return player.play().then(() => true, () => false);
}

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

export function voices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in globalThis)) return Promise.resolve([]);
  if (!voicesReady) {
    voicesReady = new Promise(resolve => {
      const got = speechSynthesis.getVoices();
      if (got.length) return resolve(got);
      const done = () => resolve(speechSynthesis.getVoices());
      speechSynthesis.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 1500);
    });
  }
  return voicesReady;
}

/** Voices for a language, best first (exact region, then quality hints). */
export async function voicesFor(lang: string): Promise<SpeechSynthesisVoice[]> {
  const all = await voices();
  const tag = lang.toLowerCase().replace('_', '-');
  const base = tag.split('-')[0];
  const score = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    let s = l === tag ? 100 : l.startsWith(base) ? 10 : -1000;
    if (/premium|enhanced|neural|natural/i.test(v.name)) s += 20;
    if (/google/i.test(v.name)) s += 8;
    if (/mónica|monica|jorge|lucia|lucía|elvira|álvaro|alvaro|marisol/i.test(v.name)) s += 5;
    return s;
  };
  return all.filter(v => score(v) > 0).sort((a, b) => score(b) - score(a));
}

export async function speak(text: string, rate = store.device.rate): Promise<boolean> {
  if (!('speechSynthesis' in globalThis) || !text.trim()) return false;
  stopAudio();
  const lang = store.pack.ttsLang;
  const list = await voicesFor(lang);
  const chosen = list.find(v => v.name === store.device.voice) ?? list[0];
  const u = new SpeechSynthesisUtterance(text);
  u.lang = chosen?.lang ?? lang;
  if (chosen) u.voice = chosen;
  u.rate = rate;
  return new Promise(resolve => {
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

/**
 * Say a word: its saved recording, else a native recording found online
 * (when preferred), else the device voice.
 */
export async function sayWord(word: string, savedUrl?: string): Promise<'recording' | 'tts' | 'none'> {
  if (savedUrl && (await playUrl(savedUrl))) return 'recording';
  if (store.settings.preferRecordings && !word.includes(' ')) {
    const [best] = await findRecordings(word);
    if (best && (await playUrl(best.url))) return 'recording';
  }
  return (await speak(word)) ? 'tts' : 'none';
}

/**
 * iOS only lets a page play sound after a tap. Play a silent clip on the
 * first tap so later automatic playback (revealing a card) works.
 */
export function unlockAudioOnFirstTap() {
  const unlock = () => {
    removeEventListener('pointerdown', unlock, true);
    try {
      player = player ?? new Audio();
      player.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      player.play().catch(() => undefined);
      if ('speechSynthesis' in globalThis) {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
      }
    } catch { /* ignore */ }
  };
  addEventListener('pointerdown', unlock, true);
}
