// App state: everything lives in memory for instant UI, and is written
// through to IndexedDB (and from there, synced). Components subscribe with
// the useStore hook in ./hooks.

import { getPack } from '../content';
import type { LanguagePack } from '../content/types';
import * as idb from './db';
import type { SyncedStore } from './db';
import {
  DEFAULT_DEVICE, defaultSettings, emptyDay, uid,
  type Card, type DayLog, type DeviceSettings, type InboxItem, type JournalEntry, type KV, type Note, type ReviewLog, type Settings,
} from './model';
import type { Built } from './notes';
import { schedule, seedOf, State, type Rating } from './srs';
import { dayKey } from './time';

type Listener = () => void;

const DEVICE_KEY = 'fluent.device';

function loadDevice(): DeviceSettings {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (raw) return { ...DEFAULT_DEVICE, ...JSON.parse(raw) };
  } catch { /* private mode or blocked storage */ }
  return { ...DEFAULT_DEVICE };
}

interface Undo {
  card: Card;
  day: DayLog;
  logId: string;
}

export class Store {
  ready = false;
  version = 0;
  notes = new Map<string, Note>();
  cards = new Map<string, Card>();
  days = new Map<string, DayLog>();
  journal = new Map<string, JournalEntry>();
  inbox = new Map<string, InboxItem>();
  kv = new Map<string, KV>();
  settings: Settings = defaultSettings(dayKey(Date.now()));
  device: DeviceSettings = loadDevice();
  /** Review log is loaded lazily (it only grows). */
  revlog: ReviewLog[] | null = null;
  private todayLogs: ReviewLog[] = [];
  private undoStack: Undo[] = [];
  private listeners = new Set<Listener>();
  /** Called after local changes; sync hooks in here. */
  onChange: (() => void) | null = null;
  /** Clock, replaceable in tests. */
  now: () => number = () => Date.now();

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  emit() {
    this.version++;
    for (const l of this.listeners) l();
  }

  get pack(): LanguagePack {
    return getPack(this.settings.lang);
  }

  today(at = this.now()): string {
    return dayKey(at, this.settings.resetHour);
  }

  async init(): Promise<void> {
    const [notes, cards, days, journal, inbox, kv, settings] = await Promise.all([
      idb.getAll<Note>('notes'), idb.getAll<Card>('cards'), idb.getAll<DayLog>('days'),
      idb.getAll<JournalEntry>('journal'), idb.getAll<InboxItem>('inbox'), idb.getAll<KV>('kv'),
      idb.getAll<Settings>('settings'),
    ]);
    this.notes = new Map(notes.map(n => [n.id, n]));
    this.cards = new Map(cards.map(c => [c.id, c]));
    this.days = new Map(days.map(d => [d.id, d]));
    this.journal = new Map(journal.map(j => [j.id, j]));
    this.inbox = new Map(inbox.map(i => [i.id, i]));
    this.kv = new Map(kv.map(k => [k.id, k]));
    const s = settings.find(x => x.id === 'settings');
    if (s) this.settings = { ...defaultSettings(s.startDay), ...s, sched: { ...defaultSettings(s.startDay).sched, ...s.sched } };
    const today = this.today();
    this.todayLogs = (await idb.getAll<ReviewLog>('revlog')).filter(l => l.day === today && !(l as { deleted?: boolean }).deleted);
    this.ready = true;
    this.emit();
  }

  /** True until the person has finished the welcome screen. */
  get isNew(): boolean {
    return !this.settings.updated;
  }

  // ---- persistence ---------------------------------------------------------

  /** Set when the device refuses to save (usually storage full). */
  saveError = '';

  private write(store: SyncedStore, recs: { id: string; updated: number }[]) {
    idb.putMany(store, recs).catch(err => {
      console.error('save failed', store, err);
      this.saveError = err instanceof Error ? err.message : String(err);
      this.emit();
    });
  }

  private touch<T extends { updated: number }>(r: T): T {
    r.updated = Math.max(this.now(), r.updated + 1);
    return r;
  }

  /** Apply records that came from the sync server (already persisted). */
  applyRemote(store: SyncedStore, recs: { id: string; updated: number; deleted?: boolean }[]) {
    for (const r of recs) {
      switch (store) {
        case 'notes': this.notes.set(r.id, r as Note); break;
        case 'cards': this.cards.set(r.id, r as Card); break;
        case 'days': this.days.set(r.id, r as DayLog); break;
        case 'journal': this.journal.set(r.id, r as JournalEntry); break;
        case 'inbox': this.inbox.set(r.id, r as InboxItem); break;
        case 'kv': this.kv.set(r.id, r as KV); break;
        case 'settings': this.settings = { ...this.settings, ...(r as Settings) }; break;
        case 'revlog': {
          const log = r as ReviewLog & { deleted?: boolean };
          this.todayLogs = this.todayLogs.filter(l => l.id !== log.id);
          if (this.revlog) this.revlog = this.revlog.filter(l => l.id !== log.id);
          if (log.deleted) break;
          this.revlog?.push(log);
          if (log.day === this.today()) this.todayLogs.push(log);
          break;
        }
      }
    }
    this.emit();
  }

  /** Current record for a synced store, for merging during sync. */
  local(store: SyncedStore, id: string): { id: string; updated: number } | undefined {
    switch (store) {
      case 'notes': return this.notes.get(id);
      case 'cards': return this.cards.get(id);
      case 'days': return this.days.get(id);
      case 'journal': return this.journal.get(id);
      case 'inbox': return this.inbox.get(id);
      case 'kv': return this.kv.get(id);
      case 'settings': return id === 'settings' ? this.settings : undefined;
      default: return undefined;
    }
  }

  private changed() {
    this.emit();
    this.onChange?.();
  }

  // ---- settings ------------------------------------------------------------

  updateSettings(patch: Partial<Settings>) {
    this.settings = this.touch({ ...this.settings, ...patch });
    this.write('settings', [this.settings]);
    this.changed();
  }

  updateDevice(patch: Partial<DeviceSettings>) {
    this.device = { ...this.device, ...patch };
    try { localStorage.setItem(DEVICE_KEY, JSON.stringify(this.device)); } catch { /* ignore */ }
    this.emit();
  }

  // ---- notes & cards -------------------------------------------------------

  /** Notes for the current language, not deleted. */
  liveNotes(kind?: Note['kind']): Note[] {
    const out: Note[] = [];
    for (const n of this.notes.values()) {
      if (n.deleted || n.lang !== this.settings.lang) continue;
      if (kind && n.kind !== kind) continue;
      out.push(n);
    }
    return out;
  }

  noteByRef(kind: Note['kind'], ref: string): Note | undefined {
    const id = `${this.settings.lang}:${kind}:${ref}`;
    const n = this.notes.get(id);
    return n && !n.deleted ? n : undefined;
  }

  cardsOf(noteId: string): Card[] {
    const out: Card[] = [];
    for (const c of this.cards.values()) if (c.noteId === noteId && !c.deleted) out.push(c);
    return out;
  }

  nextOrder(): number {
    let max = 0;
    for (const n of this.notes.values()) if (n.order > max) max = n.order;
    return max + 1;
  }

  /** Save a freshly built note with its cards and count it toward today's plan. */
  addBuilt(built: Built, countAs?: string) {
    const now = this.now();
    const existing = this.notes.get(built.note.id);
    const note = { ...built.note, updated: Math.max(now, (existing?.updated ?? 0) + 1), deleted: false };
    if (existing && !existing.deleted) {
      // Re-making an existing note keeps its review history.
      note.created = existing.created;
      note.order = existing.order;
    }
    this.notes.set(note.id, note);
    const cards = built.cards.map(c => {
      const prev = this.cards.get(c.id);
      return prev && !prev.deleted ? prev : { ...c, updated: now };
    });
    // Cards no longer wanted for this note get removed.
    const keep = new Set(cards.map(c => c.id));
    const dropped = this.cardsOf(note.id).filter(c => !keep.has(c.id)).map(c => this.touch({ ...c, deleted: true }));
    for (const c of [...cards, ...dropped]) this.cards.set(c.id, c);
    this.write('notes', [note]);
    this.write('cards', [...cards, ...dropped]);
    if (countAs && !(existing && !existing.deleted)) this.bump(countAs, 1);
    this.changed();
    return note;
  }

  updateNote(id: string, patch: Partial<Note>) {
    const n = this.notes.get(id);
    if (!n) return;
    const next = this.touch({ ...n, ...patch });
    this.notes.set(id, next);
    this.write('notes', [next]);
    this.changed();
  }

  deleteNote(id: string) {
    const n = this.notes.get(id);
    if (!n) return;
    const note = this.touch({ ...n, deleted: true });
    const cards = this.cardsOf(id).map(c => this.touch({ ...c, deleted: true }));
    this.notes.set(id, note);
    for (const c of cards) this.cards.set(c.id, c);
    this.write('notes', [note]);
    this.write('cards', cards);
    this.changed();
  }

  setSuspended(cardId: string, suspended: boolean) {
    const c = this.cards.get(cardId);
    if (!c) return;
    const next = this.touch({ ...c, suspended });
    this.cards.set(cardId, next);
    this.write('cards', [next]);
    this.changed();
  }

  /** Forget a card's history and treat it as new again. */
  resetCard(cardId: string) {
    const c = this.cards.get(cardId);
    if (!c) return;
    const next = this.touch({ ...c, state: State.New, due: this.now(), step: 0, stability: 0, difficulty: 0, ease: 0, ivl: 0, reps: 0, lapses: 0, last: 0, introduced: undefined });
    this.cards.set(cardId, next);
    this.write('cards', [next]);
    this.changed();
  }

  // ---- reviewing -----------------------------------------------------------

  answer(cardId: string, rating: Rating, ms: number) {
    const card = this.cards.get(cardId);
    if (!card) return;
    const now = this.now();
    const today = this.today(now);
    const out = schedule(card, rating, now, this.settings.sched, seedOf(card.id));
    const next: Card = { ...card, ...out.sched, introduced: card.introduced ?? today, updated: Math.max(now, card.updated + 1) };
    const day = this.day(today);
    const prevDay = structuredClone(day);
    const nextDay: DayLog = {
      ...day,
      reviews: day.reviews + (card.state === State.New ? 0 : 1),
      newCards: day.newCards + (card.state === State.New ? 1 : 0),
      ms: day.ms + Math.min(ms, 120_000),
      updated: Math.max(now, day.updated + 1),
    };
    const log: ReviewLog = {
      id: uid(), cardId, noteId: card.noteId, lang: card.lang, ts: now, day: today, rating,
      state: card.state, ivl: next.state === State.Review ? next.ivl : 0, ms: Math.min(ms, 120_000), updated: now,
    };
    this.cards.set(cardId, next);
    this.days.set(today, nextDay);
    this.todayLogs.push(log);
    this.revlog?.push(log);
    this.undoStack.push({ card, day: prevDay, logId: log.id });
    if (this.undoStack.length > 20) this.undoStack.shift();
    this.write('cards', [next]);
    this.write('days', [nextDay]);
    this.write('revlog', [log]);
    this.changed();
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  undo(): Card | null {
    const u = this.undoStack.pop();
    if (!u) return null;
    const card = this.touch({ ...u.card });
    const day = this.touch({ ...u.day });
    this.cards.set(card.id, card);
    this.days.set(day.id, day);
    this.todayLogs = this.todayLogs.filter(l => l.id !== u.logId);
    if (this.revlog) this.revlog = this.revlog.filter(l => l.id !== u.logId);
    this.write('cards', [card]);
    this.write('days', [day]);
    idb.getOne<ReviewLog>('revlog', u.logId).then(l => l && this.write('revlog', [{ ...l, deleted: true, updated: this.now() } as ReviewLog]));
    this.changed();
    return card;
  }

  reviewsToday(): ReviewLog[] {
    return this.todayLogs.filter(l => l.day === this.today());
  }

  async loadRevlog(): Promise<ReviewLog[]> {
    if (!this.revlog) {
      const all = await idb.getAll<ReviewLog & { deleted?: boolean }>('revlog');
      this.revlog = all.filter(l => !l.deleted).sort((a, b) => a.ts - b.ts);
    }
    return this.revlog;
  }

  // ---- days & plan ---------------------------------------------------------

  day(id = this.today()): DayLog {
    return this.days.get(id) ?? emptyDay(id);
  }

  private saveDay(d: DayLog) {
    const next = this.touch(d);
    this.days.set(next.id, next);
    this.write('days', [next]);
  }

  /** Count something made today ('word', 'sentence', 'drill', …). */
  bump(kind: string, n = 1) {
    const d = this.day();
    this.saveDay({ ...d, made: { ...d.made, [kind]: (d.made[kind] ?? 0) + n } });
    this.changed();
  }

  setCheck(itemId: string, done: boolean, dayId = this.today()) {
    const d = this.day(dayId);
    this.saveDay({ ...d, checks: { ...d.checks, [itemId]: done } });
    this.changed();
  }

  addCustomItem(title: string, url?: string) {
    const d = this.day();
    this.saveDay({ ...d, custom: [...(d.custom ?? []), { id: `custom:${uid()}`, title, url }] });
    this.changed();
  }

  removeCustomItem(id: string) {
    const d = this.day();
    this.saveDay({ ...d, custom: (d.custom ?? []).filter(c => c.id !== id) });
    this.changed();
  }

  // ---- key/value progress --------------------------------------------------

  get<T>(id: string): T | undefined {
    return this.kv.get(id)?.value as T | undefined;
  }

  set<T>(id: string, value: T) {
    const prev = this.kv.get(id);
    const rec: KV = { id, value, updated: Math.max(this.now(), (prev?.updated ?? 0) + 1) };
    this.kv.set(id, rec);
    this.write('kv', [rec]);
    this.changed();
  }

  // ---- journal & inbox -----------------------------------------------------

  saveJournal(entry: Partial<JournalEntry> & { text: string }): JournalEntry {
    const now = this.now();
    const prev = entry.id ? this.journal.get(entry.id) : undefined;
    const isNew = !prev;
    const rec: JournalEntry = {
      id: uid(), lang: this.settings.lang, day: this.today(), created: now,
      ...prev, ...entry, updated: Math.max(now, (prev?.updated ?? 0) + 1),
    } as JournalEntry;
    this.journal.set(rec.id, rec);
    this.write('journal', [rec]);
    if (isNew && rec.text.trim()) this.bump('write', 1);
    else this.changed();
    return rec;
  }

  deleteJournal(id: string) {
    const j = this.journal.get(id);
    if (!j) return;
    const rec = this.touch({ ...j, deleted: true });
    this.journal.set(id, rec);
    this.write('journal', [rec]);
    this.changed();
  }

  addInbox(text: string, context?: string, source?: string): InboxItem {
    const now = this.now();
    const rec: InboxItem = { id: uid(), lang: this.settings.lang, text, context, source, created: now, updated: now };
    this.inbox.set(rec.id, rec);
    this.write('inbox', [rec]);
    this.changed();
    return rec;
  }

  updateInbox(id: string, patch: Partial<InboxItem>) {
    const i = this.inbox.get(id);
    if (!i) return;
    const rec = this.touch({ ...i, ...patch });
    this.inbox.set(id, rec);
    this.write('inbox', [rec]);
    this.changed();
  }

  // ---- whole-database operations ------------------------------------------

  async exportAll(): Promise<Record<string, unknown[]>> {
    const out: Record<string, unknown[]> = {};
    for (const s of idb.SYNCED) out[s] = await idb.getAll(s);
    return out;
  }

  async importAll(data: Record<string, { id: string; updated: number }[]>) {
    for (const s of idb.SYNCED) {
      const recs = data[s];
      if (Array.isArray(recs) && recs.length) await idb.putMany(s, recs);
    }
    this.revlog = null;
    await this.init();
    this.onChange?.();
  }

  async wipe() {
    await idb.wipe();
    this.notes.clear(); this.cards.clear(); this.days.clear(); this.journal.clear(); this.inbox.clear(); this.kv.clear();
    this.settings = defaultSettings(this.today());
    this.revlog = null;
    this.todayLogs = [];
    this.emit();
  }
}

export const store = new Store();
