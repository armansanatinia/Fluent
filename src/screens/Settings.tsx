import { useEffect, useRef, useState } from 'react';
import { CardImage } from '../components/media';
import { confirmAction, Seg, Spinner, Switch, toast } from '../components/ui';
import { COMING, PACKS } from '../content';
import { voicesFor, speak } from '../lib/audio';
import { useStore } from '../lib/hooks';
import type { Effect, GenderStyle, Level, Settings as S } from '../lib/model';
import { DEFAULT_GENDER } from '../lib/model';
import { health, resetCursor, syncNow, lastError, type Health } from '../lib/sync';
import { exportCsv, download } from '../lib/backup';
import { weekdayName } from '../lib/time';

const EFFECTS: { value: Effect; label: string }[] = [
  { value: 'explode', label: '💥 Explodes' }, { value: 'fire', label: '🔥 Catches fire' }, { value: 'ice', label: '❄️ Freezes' },
  { value: 'shatter', label: '🪟 Shatters' }, { value: 'electric', label: '⚡ Electrified' }, { value: 'melt', label: '🫠 Melts' },
  { value: 'none', label: 'No animation' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-title">{title}</div>
      <div className="card flat" style={{ padding: '0 16px' }}>{children}</div>
    </section>
  );
}

function Row({ title, help, children }: { title: string; help?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="setting">
      <div className="text"><b>{title}</b>{help && <small>{help}</small>}</div>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min = 0, max = 999, placeholder }: { value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; placeholder?: string }) {
  return (
    <input className="input" style={{ width: 90, textAlign: 'center' }} inputMode="numeric" value={value ?? ''} placeholder={placeholder}
      onChange={e => {
        const t = e.target.value.trim();
        if (!t) return onChange(null);
        const n = Number(t);
        if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.round(n))));
      }} />
  );
}

function Days({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="chips">
      {[1, 2, 3, 4, 5, 6, 0].map(d => (
        <button key={d} type="button" className={`chip${value.includes(d) ? ' on' : ''}`} onClick={() => onChange(value.includes(d) ? value.filter(x => x !== d) : [...value, d].sort())}>
          {weekdayName(d).slice(0, 3)}
        </button>
      ))}
    </div>
  );
}

export function GenderEditor() {
  const s = useStore();
  const [demo, setDemo] = useState<{ g: 'm' | 'f'; k: number } | null>(null);
  const set = (g: 'm' | 'f', patch: Partial<GenderStyle>) => s.updateSettings({ gender: { ...s.settings.gender, [g]: { ...s.settings.gender[g], ...patch } } });
  return (
    <>
      {(['m', 'f'] as const).map(g => {
        const st = s.settings.gender[g];
        const example = g === 'm' ? 'emoji:🐕' : 'emoji:🌸';
        return (
          <div key={g} className="setting" style={{ alignItems: 'flex-start' }}>
            <div className="text stack tight">
              <b style={{ color: st.color }}>{s.pack.genders[g].label} — “{s.pack.genders[g].article}”</b>
              <label className="field"><span>What happens to every {s.pack.genders[g].label} noun</span>
                <input className="input" value={st.action} onChange={e => set(g, { action: e.target.value })} />
              </label>
              <div className="row wrap">
                <select className="select" style={{ width: 'auto' }} value={st.effect} onChange={e => set(g, { effect: e.target.value as Effect })}>
                  {EFFECTS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                </select>
                <input className="input" style={{ width: 64, textAlign: 'center' }} value={st.emoji} onChange={e => set(g, { emoji: e.target.value })} aria-label="Emoji" />
                <input type="color" value={st.color} onChange={e => set(g, { color: e.target.value })} aria-label="Colour" style={{ width: 46, height: 46, border: 0, background: 'none' }} />
                <button type="button" className="btn small" onClick={() => setDemo({ g, k: Date.now() })}>Preview</button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <CardImage image={example} size="md" fx={demo?.g === g ? st.effect : null} fxKey={demo?.g === g ? demo.k : 0} />
            </div>
          </div>
        );
      })}
      <div className="setting">
        <div className="text"><small>The book’s suggestion: masculine nouns explode, feminine nouns catch fire. Pick anything vivid — what matters is that you always picture the same thing.</small></div>
        <button className="btn small ghost" onClick={() => s.updateSettings({ gender: structuredClone(DEFAULT_GENDER) })}>Reset</button>
      </div>
    </>
  );
}

function VoicePicker() {
  const s = useStore();
  const [list, setList] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => { voicesFor(s.pack.ttsLang).then(setList); }, [s.pack.ttsLang]);
  return (
    <>
      <Row title="Device voice" help="Used when no native recording exists, and for sentences.">
        <select className="select" style={{ maxWidth: 190 }} value={s.device.voice} onChange={e => s.updateDevice({ voice: e.target.value })}>
          <option value="">Best available</option>
          {list.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
        </select>
      </Row>
      <Row title="Speed" help={`${Math.round(s.device.rate * 100)}%`}>
        <input type="range" min={0.6} max={1.1} step={0.05} value={s.device.rate} onChange={e => s.updateDevice({ rate: Number(e.target.value) })} style={{ width: 140 }} />
      </Row>
      <Row title="Test">
        <button className="btn small" onClick={() => speak('Hola, ¿qué tal? Me llamo Lucía y vivo en Madrid.')}>Play</button>
      </Row>
      {list.length === 0 && <div className="notice warn" style={{ margin: '0 0 12px' }}>No Spanish (Spain) voice on this device. On iPhone: Settings → Accessibility → Spoken Content → Voices → Spanish (Spain).</div>}
    </>
  );
}

function SyncPanel() {
  const s = useStore();
  const d = s.device;
  const [h, setH] = useState<Health | null | 'checking'>('checking');
  const [busy, setBusy] = useState(false);
  const check = () => { setH('checking'); health().then(setH); };
  useEffect(check, [d.syncUrl, d.syncToken]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async () => {
    setBusy(true);
    try {
      const r = await syncNow();
      toast(`Synced: sent ${r.pushed}, received ${r.pulled}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setBusy(false);
    }
  };
  const status = h === 'checking' ? <Spinner /> : !h ? <span className="badge warn">No server found</span> : !h.authed ? <span className="badge bad">Password needed</span> : <span className="badge ok">Connected</span>;
  return (
    <>
      <Row title="Status" help={d.lastSync ? `Last sync ${new Date(d.lastSync).toLocaleString()}` : 'Never synced on this device'}>{status}</Row>
      <div className="setting" style={{ display: 'block' }}>
        <label className="field"><span>Server address (leave empty when the app is opened from its own server)</span>
          <input className="input" value={d.syncUrl} onChange={e => s.updateDevice({ syncUrl: e.target.value.trim() })} placeholder="https://fluent.yourname.workers.dev" inputMode="url" autoCapitalize="off" />
        </label>
        <label className="field" style={{ marginTop: 10 }}><span>Sync password (the SYNC_TOKEN you set on the server)</span>
          <input className="input" type="password" value={d.syncToken} onChange={e => s.updateDevice({ syncToken: e.target.value })} autoComplete="off" />
        </label>
      </div>
      <Row title="Sync automatically" help="When you open and leave the app, and every few minutes.">
        <Switch checked={d.autoSync} onChange={v => s.updateDevice({ autoSync: v })} />
      </Row>
      <Row title="Sync now" help={lastError ? `Last error: ${lastError}` : undefined}>
        <button className="btn small" onClick={run} disabled={busy || !d.syncToken}>{busy ? <Spinner /> : 'Sync'}</button>
      </Row>
      <Row title="Download everything again" help="Use if a device seems to be missing cards.">
        <button className="btn small ghost" onClick={() => { resetCursor(); run(); }} disabled={!d.syncToken}>Full sync</button>
      </Row>
    </>
  );
}

function AiPanel() {
  const s = useStore();
  const d = s.device;
  return (
    <>
      <Row title="AI helper" help="Corrects your journal, explains grammar, and drafts definitions for your own words. Native speakers stay in the plan.">
        <Seg value={d.aiMode} onChange={v => s.updateDevice({ aiMode: v })} options={[{ value: 'off', label: 'Off' }, { value: 'server', label: 'Server' }, { value: 'key', label: 'My key' }]} />
      </Row>
      {d.aiMode === 'server' && <div className="small muted" style={{ padding: '0 0 12px' }}>Uses the ANTHROPIC_API_KEY stored on your sync server. Sync must be set up.</div>}
      {d.aiMode === 'key' && (
        <div className="setting" style={{ display: 'block' }}>
          <label className="field"><span>Anthropic API key (kept on this device only)</span>
            <input className="input" type="password" value={d.aiKey} onChange={e => s.updateDevice({ aiKey: e.target.value.trim() })} placeholder="sk-ant-…" autoComplete="off" />
          </label>
        </div>
      )}
      {d.aiMode !== 'off' && (
        <Row title="Model" help="Claude Opus 5.5 by default.">
          <input className="input" style={{ width: 190 }} value={d.aiModel} onChange={e => s.updateDevice({ aiModel: e.target.value.trim() })} />
        </Row>
      )}
    </>
  );
}

export function Settings() {
  const s = useStore();
  const st = s.settings;
  const up = (patch: Partial<S>) => s.updateSettings(patch);
  const sched = st.sched;
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const data = await s.exportAll();
    download(new Blob([JSON.stringify({ app: 'fluent', version: 1, at: new Date().toISOString(), data })], { type: 'application/json' }), `fluent-backup-${s.today()}.json`);
  };
  const doImport = async (f?: File | null) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed?.app !== 'fluent' || !parsed.data) throw new Error('Not a Fluent backup.');
      if (!confirmAction('Merge this backup into the app? Newer edits win.')) return;
      await s.importAll(parsed.data);
      toast('Backup imported.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  return (
    <div className="stack">
      <h1>Settings</h1>

      <Section title="Language">
        <Row title="Learning" help="More languages can be added as packs.">
          <select className="select" style={{ width: 'auto' }} value={st.lang} onChange={e => up({ lang: e.target.value })}>
            {Object.values(PACKS).map(p => <option key={p.code} value={p.code}>{p.flag} {p.name}</option>)}
            {COMING.map(c => <option key={c.code} disabled>{c.flag} {c.name} (later)</option>)}
          </select>
        </Row>
        <Row title="Your level">
          <Seg<Level> value={st.level} onChange={v => up({ level: v })} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'basics', label: 'Some basics' }, { value: 'intermediate', label: 'Intermediate' }]} />
        </Row>
      </Section>

      <Section title="Your daily plan">
        <Row title="Minutes a day" help="New cards and activities are sized to fit.">
          <Seg value={st.minutes} onChange={v => up({ minutes: v })} options={[{ value: 30, label: '30' }, { value: 45, label: '45' }, { value: 60, label: '60' }, { value: 90, label: '90' }]} />
        </Row>
        <Row title="New base words a day" help="Empty = worked out from your minutes."><NumberInput value={st.wordsPerDay} onChange={v => up({ wordsPerDay: v })} placeholder="auto" max={60} /></Row>
        <Row title="Sentences a day"><NumberInput value={st.sentencesPerDay} onChange={v => up({ sentencesPerDay: v })} placeholder="auto" max={40} /></Row>
        <Row title="Vocabulary words a day"><NumberInput value={st.vocabPerDay} onChange={v => up({ vocabPerDay: v })} placeholder="auto" max={60} /></Row>
        <Row title="Sounds a day"><NumberInput value={st.soundsPerDay} onChange={v => up({ soundsPerDay: v })} placeholder="auto" max={10} /></Row>
        <Row title="Start grammar after" help="Base words made before sentences join the plan.">
          <NumberInput value={st.grammarStartAt} onChange={v => up({ grammarStartAt: v ?? 0 })} max={700} />
        </Row>
        <Row title="Skip the pronunciation phase" help="Only if your ears and accent are already solid.">
          <Switch checked={st.skipSounds} onChange={v => up({ skipSounds: v })} />
        </Row>
        <div className="setting" style={{ display: 'block' }}>
          <b>Tutor days</b>
          <small className="faint" style={{ display: 'block', marginBottom: 8 }}>Paid lessons (italki). Early on, only the last of these days is used.</small>
          <Days value={st.tutorDays} onChange={v => up({ tutorDays: v })} />
        </div>
        <div className="setting" style={{ display: 'block' }}>
          <b>Language exchange days</b>
          <small className="faint" style={{ display: 'block', marginBottom: 8 }}>Free exchanges (Tandem, HelloTalk), from the grammar phase on.</small>
          <Days value={st.exchangeDays} onChange={v => up({ exchangeDays: v })} />
        </div>
      </Section>

      <Section title="The gender trick">
        <GenderEditor />
      </Section>

      <Section title="Flashcards">
        <Row title="Scheduling" help={sched.algorithm === 'fsrs' ? 'FSRS: a modern model of your memory. Fewer reviews for the same recall.' : 'SM-2: Anki’s classic algorithm, as used in the book.'}>
          <Seg value={sched.algorithm} onChange={v => up({ sched: { ...sched, algorithm: v } })} options={[{ value: 'fsrs', label: 'FSRS' }, { value: 'sm2', label: 'Anki SM-2' }]} />
        </Row>
        {sched.algorithm === 'fsrs' && (
          <Row title="Target recall" help={`${Math.round(sched.retention * 100)}% — higher means more reviews.`}>
            <input type="range" min={0.8} max={0.97} step={0.01} value={sched.retention} onChange={e => up({ sched: { ...sched, retention: Number(e.target.value) } })} style={{ width: 140 }} />
          </Row>
        )}
        <Row title="New cards a day (max)" help="Cap on brand-new cards shown in reviews."><NumberInput value={st.newCardsPerDay} onChange={v => up({ newCardsPerDay: v ?? 0 })} max={300} /></Row>
        <Row title="Reviews a day (max)"><NumberInput value={st.maxReviewsPerDay} onChange={v => up({ maxReviewsPerDay: v ?? 0 })} max={9999} /></Row>
        <Row title="Learning steps (minutes)" help="Shown again after these delays on the first day.">
          <input className="input" style={{ width: 110, textAlign: 'center' }} defaultValue={sched.learnSteps.join(' ')}
            onBlur={e => { const steps = e.target.value.split(/[\s,]+/).map(Number).filter(n => n > 0); if (steps.length) up({ sched: { ...sched, learnSteps: steps } }); }} />
        </Row>
        <Row title="Type your answer on picture cards" help="Otherwise say it out loud, then reveal."><Switch checked={st.typeRecall} onChange={v => up({ typeRecall: v })} /></Row>
        <Row title="Spelling cards">
          <Seg value={st.spellCards} onChange={v => up({ spellCards: v })} options={[{ value: 'auto', label: 'Tricky words' }, { value: 'all', label: 'All' }, { value: 'none', label: 'None' }]} />
        </Row>
        <Row title="Show pronunciation (IPA)"><Switch checked={st.showIpa} onChange={v => up({ showIpa: v })} /></Row>
        <Row title="Play audio automatically"><Switch checked={st.autoplay} onChange={v => up({ autoplay: v })} /></Row>
        <Row title="Animations"><Switch checked={st.animations} onChange={v => up({ animations: v })} /></Row>
      </Section>

      <Section title="Audio">
        <Row title="Prefer native recordings" help="Real speakers from Lingua Libre; the device voice fills the gaps.">
          <Switch checked={st.preferRecordings} onChange={v => up({ preferRecordings: v })} />
        </Row>
        <VoicePicker />
      </Section>

      <Section title="Sync between devices"><SyncPanel /></Section>
      <Section title="AI helper"><AiPanel /></Section>

      <Section title="Appearance">
        <Row title="Theme">
          <Seg value={s.device.theme} onChange={v => s.updateDevice({ theme: v })} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </Row>
      </Section>

      <Section title="Your data">
        <Row title="Back up" help="Everything, as one file."><button className="btn small" onClick={doExport}>Export</button></Row>
        <Row title="Restore" help="Merge a backup file into this device.">
          <button className="btn small" onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => doImport(e.target.files?.[0])} />
        </Row>
        <Row title="Export for Anki" help="Your notes as a spreadsheet Anki can import (pictures stay in the app).">
          <button className="btn small" onClick={() => download(new Blob([exportCsv(s)], { type: 'text/csv' }), `fluent-notes-${s.today()}.csv`)}>CSV</button>
        </Row>
        <Row title="Start over" help="Deletes everything on this device. Synced data stays on the server.">
          <button className="btn small danger" onClick={async () => { if (confirmAction('Delete all cards and progress on this device?')) { await s.wipe(); location.hash = '#/welcome'; } }}>Reset</button>
        </Row>
      </Section>

      <section className="card tint small muted" style={{ marginTop: 20 }}>
        <b>About.</b> Built on Gabriel Wyner’s <i>Fluent Forever</i>: pronunciation first, pictures instead of translations, the gender
        trick, personal connections, grammar through sentences, monolingual definitions and spaced repetition. Recordings: Lingua Libre
        (Wikimedia, CC BY-SA). Pictures: Openverse and Wikimedia Commons, credited on each card.
      </section>
    </div>
  );
}
