import { useMemo, useState } from 'react';
import { ClozeEditor } from '../components/ClozeEditor';
import { IconClipboard, IconTrash } from '../components/icons';
import { Ext, Sheet, Spinner, toast, TopBar } from '../components/ui';
import { askAi, aiReady } from '../lib/ai';
import { useStore } from '../lib/hooks';
import type { JournalEntry } from '../lib/model';
import { buildCustomSentence } from '../lib/notes';
import { phases } from '../lib/plan';
import { planCounts } from '../lib/progress';
import { daysBetween, prettyDate } from '../lib/time';
import type { Correction } from '../shared/ai';

const POST_TO = [
  { name: 'HiNative', url: 'https://hinative.com/' },
  { name: 'LangCorrect', url: 'https://langcorrect.com/' },
  { name: 'r/WriteStreakES', url: 'https://www.reddit.com/r/WriteStreakES/' },
];

function levelNow(s: ReturnType<typeof useStore>): 'A1' | 'A2' | 'B1' | 'B2' {
  const ph = phases(s.pack, s.settings, planCounts(s));
  if (ph[3].active || ph[3].done) return ph[2].done ? 'B2' : 'B1';
  if (ph[2].progress > 0.45) return 'A2';
  return s.settings.level === 'intermediate' ? 'B1' : 'A1';
}

/** Split corrected text into sentences, for picking which ones become cards. */
function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?¿¡\n]*[¿¡]?[^.!?\n]+[.!?]*/g) ?? []).map(x => x.trim()).filter(x => x.split(/\s+/).length >= 2);
}

function Fixes({ c }: { c: Correction }) {
  if (!c.fixes.length) return <div className="notice ok">No corrections — it reads naturally. ¡Muy bien!</div>;
  return (
    <div className="list">
      {c.fixes.map((f, i) => (
        <div key={i} className="item stack tight">
          <div><span style={{ textDecoration: 'line-through', color: 'var(--bad)' }}>{f.original}</span> → <b style={{ color: 'var(--ok)' }}>{f.corrected}</b></div>
          <div className="small muted">{f.why}</div>
        </div>
      ))}
    </div>
  );
}

export function Write() {
  const s = useStore();
  const pack = s.pack;
  const today = s.today();
  const level = levelNow(s);
  const entries = useMemo(() => [...s.journal.values()].filter(j => !j.deleted && j.lang === pack.code).sort((a, b) => b.created - a.created), [s, s.version, pack.code]); // eslint-disable-line react-hooks/exhaustive-deps
  const todays = entries.find(j => j.day === today);
  const levelPrompts = pack.prompts.filter(p => p.level === level);
  const [shift, setShift] = useState(0);
  const prompt = todays?.prompt
    ? pack.prompts.find(p => p.text === todays.prompt) ?? { id: 'x', level, text: todays.prompt, en: '' }
    : levelPrompts[(Math.max(0, daysBetween(s.settings.startDay, today)) + shift) % Math.max(1, levelPrompts.length)];
  const [text, setText] = useState(todays?.text ?? '');
  const [entryId, setEntryId] = useState<string | undefined>(todays?.id);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<Correction | null>(null);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [native, setNative] = useState('');
  const [cardFrom, setCardFrom] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const save = (patch: Partial<JournalEntry> = {}) => {
    if (!text.trim()) return;
    const rec = s.saveJournal({ id: entryId, text, prompt: prompt?.text, ...patch });
    setEntryId(rec.id);
    return rec;
  };

  const correct = async () => {
    save();
    setBusy(true);
    setAi(null);
    try {
      const res = await askAi({ task: 'correct', text, level, prompt: prompt?.text });
      if (res.task === 'correct') {
        setAi(res.result);
        setChosen(new Set(res.result.cards.map((_, i) => i)));
        save({ corrected: res.result.corrected, feedback: res.result.summary });
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'The AI helper failed.');
    } finally {
      setBusy(false);
    }
  };

  const makeAiCards = () => {
    if (!ai) return;
    let n = 0;
    ai.cards.forEach((c, i) => {
      if (!chosen.has(i) || !/\{\{c1::/.test(c.text)) return;
      s.addBuilt(buildCustomSentence(pack.code, c.text, c.en, {}, s.now(), s.nextOrder(), 'writing'), 'sentence');
      n++;
    });
    const prev = entryId ? s.journal.get(entryId) : undefined;
    save({ cardsMade: (prev?.cardsMade ?? 0) + n });
    toast(`${n} card${n === 1 ? '' : 's'} made from your corrections.`);
    setChosen(new Set());
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied. Paste it into the site you open.');
    } catch {
      toast('Select the text and copy it yourself.');
    }
  };

  return (
    <div className="stack loose">
      <TopBar title="Writing" back="#/study" />

      <div className="card tint small muted">
        <b>The book’s way:</b> write a few sentences using what you know, get them corrected by a native speaker, and turn every
        correction into a fill-in-the-blank card. Your mistakes become your best flashcards.
      </div>

      {prompt && (
        <div className="card stack">
          <div className="row between">
            <span className="badge accent">{level} · Today’s prompt</span>
            {!todays && <button className="btn small ghost" onClick={() => setShift(n => n + 1)}>Another</button>}
          </div>
          <div className="serif" style={{ fontSize: 21, lineHeight: 1.4 }}>{prompt.text}</div>
          {prompt.en && (showEn ? <div className="faint small">{prompt.en}</div> : <button className="btn small ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowEn(true)}>English</button>)}
        </div>
      )}

      <div className="stack">
        <textarea className="textarea" style={{ minHeight: 180, fontSize: 17 }} lang={pack.ttsLang} value={text} onChange={e => setText(e.target.value)}
          onBlur={() => save()} placeholder="Escribe aquí… Three to five sentences is plenty." spellCheck={false} />
        <div className="row between">
          <span className="faint small">{words} words</span>
          <button className="btn small" onClick={() => { save(); toast('Saved.'); }} disabled={!text.trim()}>Save</button>
        </div>
      </div>

      <section className="stack">
        <h2>Get it corrected</h2>
        <div className="row wrap">
          <button className="btn" onClick={copy} disabled={!text.trim()}><IconClipboard width={18} /> Copy text</button>
          {POST_TO.map(p => <Ext key={p.name} href={p.url} className="btn small">{p.name}</Ext>)}
        </div>
        <p className="small muted" style={{ margin: 0 }}>Post it, or bring it to your next tutor lesson. When the corrections come back, paste them below.</p>
        {aiReady() ? (
          <button className="btn primary" onClick={correct} disabled={!text.trim() || busy}>{busy ? <><Spinner /> Correcting…</> : 'Quick correction from the AI helper'}</button>
        ) : (
          <div className="faint small">Turn on the AI helper in <a href="#/settings">Settings</a> for instant corrections between tutor sessions.</div>
        )}
      </section>

      {ai && (
        <section className="card stack">
          <h3>Corrected</h3>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.5 }}>{ai.corrected}</div>
          <div className="notice">{ai.summary}</div>
          <Fixes c={ai} />
          {ai.cards.length > 0 && (
            <>
              <h3>Cards from your corrections</h3>
              {ai.cards.map((c, i) => (
                <label key={i} className="row top" style={{ gap: 10 }}>
                  <input type="checkbox" className="check" checked={chosen.has(i)} onChange={() => setChosen(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })} />
                  <div className="grow">
                    <div className="serif">{c.text.replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g, '[$1]')}</div>
                    <div className="faint small">{c.en}</div>
                  </div>
                </label>
              ))}
              <button className="btn primary" onClick={makeAiCards} disabled={!chosen.size}>Make {chosen.size} card{chosen.size === 1 ? '' : 's'}</button>
            </>
          )}
        </section>
      )}

      <section className="stack">
        <h2>Corrections from a native speaker</h2>
        <textarea className="textarea" value={native} onChange={e => setNative(e.target.value)} placeholder="Paste the corrected version here" lang={pack.ttsLang} />
        {native.trim() && (
          <>
            <div className="small muted">Tap a sentence to turn its correction into a card:</div>
            <div className="stack tight">
              {sentencesOf(native).map((x, i) => (
                <button key={i} className="card link" style={{ textAlign: 'left', padding: '10px 14px', font: 'inherit', cursor: 'pointer' }} onClick={() => setCardFrom(x)}>{x}</button>
              ))}
            </div>
            <button className="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => save({ corrected: native })}>Save corrections with the entry</button>
          </>
        )}
      </section>

      {entries.length > 0 && (
        <section className="stack">
          <h2>Your journal</h2>
          {entries.slice(0, 30).map(j => (
            <details key={j.id} className="card flat">
              <summary className="row between" style={{ cursor: 'pointer' }}>
                <span><b>{prettyDate(j.day)}</b> <span className="faint small">· {j.text.trim().split(/\s+/).length} words{j.cardsMade ? ` · ${j.cardsMade} cards` : ''}</span></span>
              </summary>
              <div className="stack" style={{ marginTop: 10 }}>
                {j.prompt && <div className="faint small">{j.prompt}</div>}
                <div style={{ whiteSpace: 'pre-wrap' }}>{j.text}</div>
                {j.corrected && <div className="notice ok" style={{ whiteSpace: 'pre-wrap' }}>{j.corrected}</div>}
                {j.feedback && <div className="small muted">{j.feedback}</div>}
                <div className="row">
                  {j.corrected && <button className="btn small" onClick={() => setNative(j.corrected!)}>Make cards from this</button>}
                  <button className="btn small ghost danger" onClick={() => s.deleteJournal(j.id)}><IconTrash width={16} /> Delete</button>
                </div>
              </div>
            </details>
          ))}
        </section>
      )}

      <Sheet open={!!cardFrom} onClose={() => setCardFrom(null)} title="Make a card from this correction">
        {cardFrom && (
          <ClozeEditor key={cardFrom} initial={cardFrom} onSave={(cloze, en) => {
            s.addBuilt(buildCustomSentence(pack.code, cloze, en || undefined, {}, s.now(), s.nextOrder(), 'writing'), 'sentence');
            const prev = entryId ? s.journal.get(entryId) : undefined;
            if (prev) save({ cardsMade: (prev.cardsMade ?? 0) + 1 });
            toast('Card made.');
            setCardFrom(null);
          }} />
        )}
      </Sheet>
    </div>
  );
}
