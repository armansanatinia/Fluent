import { useState } from 'react';
import { Seg, Spinner, toast } from '../components/ui';
import { go, useStore } from '../lib/hooks';
import type { Level } from '../lib/model';
import { syncNow } from '../lib/sync';
import { weekdayName } from '../lib/time';
import { GenderEditor } from './Settings';

const PRINCIPLES = [
  ['👂', 'Pronunciation first', 'Train your ears with minimal pairs (pero / perro) and learn how every sound is spelled.'],
  ['🖼️', 'Pictures, not translations', 'Each word is tied to a picture you choose and its real sound. No English on the cards.'],
  ['💥', 'The gender trick', 'Masculine nouns explode, feminine nouns catch fire. Vivid images make el and la stick.'],
  ['💭', 'Personal connections', 'A quick memory for each word turns it from a fact into something that’s yours.'],
  ['🧩', 'Grammar through sentences', 'Real sentences become fill-in-the-blank cards. Your corrected mistakes too.'],
  ['🔁', 'Spaced repetition', 'Cards come back right before you’d forget them. The daily plan tells you exactly what to do.'],
];

function Connect() {
  const s = useStore();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const r = await syncNow();
      toast(`Downloaded ${r.pulled} items.`);
      if (!s.isNew) go('#/today');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not connect.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card stack">
      <b>Connect to your sync server</b>
      <input className="input" value={s.device.syncUrl} onChange={e => s.updateDevice({ syncUrl: e.target.value.trim() })} placeholder="Server address (empty if this is it)" autoCapitalize="off" />
      <input className="input" type="password" value={s.device.syncToken} onChange={e => s.updateDevice({ syncToken: e.target.value })} placeholder="Sync password" />
      <button className="btn primary" onClick={run} disabled={busy || !s.device.syncToken}>{busy ? <Spinner /> : 'Connect and download'}</button>
    </div>
  );
}

export function Welcome() {
  const s = useStore();
  const [step, setStep] = useState(0);
  const [connect, setConnect] = useState(false);
  const [level, setLevel] = useState<Level>(s.settings.level);
  const [minutes, setMinutes] = useState(s.settings.minutes);
  const [tutorDays, setTutorDays] = useState(s.settings.tutorDays);
  const [exchangeDays, setExchangeDays] = useState(s.settings.exchangeDays);

  const finish = () => {
    s.updateSettings({
      level, minutes, tutorDays, exchangeDays, startDay: s.today(),
      grammarStartAt: level === 'beginner' ? 450 : level === 'basics' ? 300 : 150,
      skipSounds: false,
    });
    go('#/today');
  };

  const dayChips = (value: number[], set: (v: number[]) => void) => (
    <div className="chips">
      {[1, 2, 3, 4, 5, 6, 0].map(d => (
        <button key={d} type="button" className={`chip${value.includes(d) ? ' on' : ''}`} onClick={() => set(value.includes(d) ? value.filter(x => x !== d) : [...value, d])}>{weekdayName(d).slice(0, 3)}</button>
      ))}
    </div>
  );

  return (
    <div className="stack loose" style={{ paddingTop: 12 }}>
      {step === 0 && (
        <>
          <div className="stack tight">
            <img src="/icons/icon.svg" alt="" width={56} height={56} />
            <h1 className="serif" style={{ fontSize: 34 }}>Spanish, the Fluent Forever way</h1>
            <p className="muted" style={{ fontSize: 17 }}>
              Everything from Gabriel Wyner’s method in one place — with a plan for each day. Castilian Spanish, as spoken in Spain.
            </p>
          </div>
          <div className="stack tight">
            {PRINCIPLES.map(([e, t, d]) => (
              <div key={t} className="card row top" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 26 }}>{e}</div>
                <div><b>{t}</b><div className="small muted">{d}</div></div>
              </div>
            ))}
          </div>
          <button className="btn primary big block" onClick={() => setStep(1)}>Set up my plan</button>
          {connect ? <Connect /> : <button className="btn ghost" onClick={() => setConnect(true)}>I already use Fluent on another device</button>}
        </>
      )}

      {step === 1 && (
        <>
          <h1>Your plan</h1>
          <div className="card stack">
            <b>Language</b>
            <div className="chips"><span className="chip on">🇪🇸 Spanish (Spain)</span></div>
          </div>
          <div className="card stack">
            <b>Where are you starting?</b>
            <Seg<Level> value={level} onChange={setLevel} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'basics', label: 'Some basics' }, { value: 'intermediate', label: 'Intermediate' }]} />
            <div className="small muted">Everyone still starts with pronunciation and the base words — they go faster when you know some already.</div>
          </div>
          <div className="card stack">
            <b>Minutes a day</b>
            <Seg value={minutes} onChange={setMinutes} options={[{ value: 30, label: '30' }, { value: 45, label: '45' }, { value: 60, label: '60' }, { value: 90, label: '90' }]} />
          </div>
          <div className="card stack">
            <b>Tutor lessons (italki)</b>
            {dayChips(tutorDays, setTutorDays)}
            <div className="small muted">Paid lessons. While you’re on pronunciation and base words, only the last day is scheduled.</div>
          </div>
          <div className="card stack">
            <b>Language exchange (free)</b>
            {dayChips(exchangeDays, setExchangeDays)}
            <div className="small muted">Tandem or HelloTalk, once grammar starts.</div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => setStep(0)}>Back</button>
            <button className="btn primary grow" onClick={() => setStep(2)}>Next: the gender trick</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>The gender trick</h1>
          <p className="muted">
            Every Spanish noun is masculine or feminine. Instead of memorising “el” and “la”, you imagine every masculine noun doing one
            vivid thing and every feminine noun doing another. The cards play it back each time you see the word.
          </p>
          <div className="card flat" style={{ padding: '0 16px' }}><GenderEditor /></div>
          <div className="row">
            <button className="btn" onClick={() => setStep(1)}>Back</button>
            <button className="btn primary grow" onClick={finish}>Start learning</button>
          </div>
        </>
      )}
    </div>
  );
}
