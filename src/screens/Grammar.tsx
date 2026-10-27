import { useMemo, useState } from 'react';
import { ClozeEditor } from '../components/ClozeEditor';
import { ImagePicker } from '../components/ImagePicker';
import { AudioButton, CardImage } from '../components/media';
import { Bar, Prose, Sheet, Spinner, Switch, toast, TopBar } from '../components/ui';
import type { GrammarSentence, GrammarTopic } from '../content/types';
import { askAi, aiReady } from '../lib/ai';
import { clozeNumbers, parseCloze, plainText } from '../lib/cloze';
import { useStore } from '../lib/hooks';
import { buildCustomSentence, buildSentence } from '../lib/notes';
import type { Store } from '../lib/store';

function made(s: Store, id: string) {
  return !!s.noteByRef('sentence', id);
}

export function Grammar() {
  const s = useStore();
  const pack = s.pack;
  const [adding, setAdding] = useState(false);
  const madeSet = useMemo(() => new Set(s.liveNotes('sentence').map(n => n.ref)), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = pack.grammar.reduce((n, t) => n + t.sentences.length, 0);
  const next = pack.grammar.find(t => t.sentences.some(x => !madeSet.has(x.id)));
  const mine = s.liveNotes('sentence').filter(n => !n.ref).length;
  const levels = [...new Set(pack.grammar.map(t => t.level))];

  return (
    <div>
      <TopBar title="Grammar" back="#/study" />
      <div className="card stack">
        <div><span className="big-num">{madeSet.size}</span> <span className="muted">of {total} sentences made{mine ? ` · ${mine} of your own` : ''}</span></div>
        <Bar value={madeSet.size / total} />
        <div className="row wrap">
          {next && <a className="btn primary" href={`#/grammar/${next.id}`}>Continue: {next.title}</a>}
          <button className="btn" onClick={() => setAdding(true)}>Add your own sentence</button>
        </div>
      </div>
      <div className="card tint" style={{ marginTop: 14 }}>
        <p className="small muted" style={{ margin: 0 }}>
          <b>The book’s way:</b> read a grammar point, then learn it through example sentences. Every new thing in a sentence — a new word,
          a new form, a new word order — becomes a fill-in-the-blank card with a picture. No conjugation tables to memorise; the patterns
          sink in from real sentences. Got a grammar book? Add its example sentences here too.
        </p>
      </div>

      {levels.map(level => (
        <section key={level}>
          <div className="section-title">{level}</div>
          <div className="stack tight">
            {pack.grammar.filter(t => t.level === level).map(t => {
              const n = t.sentences.filter(x => madeSet.has(x.id)).length;
              return (
                <a key={t.id} className="card link" href={`#/grammar/${t.id}`} style={{ padding: '12px 14px' }}>
                  <div className="row between">
                    <b>{t.order}. {t.title}</b>
                    <span className={`badge ${n === t.sentences.length ? 'ok' : n ? 'accent' : ''}`}>{n}/{t.sentences.length}</span>
                  </div>
                  {n > 0 && n < t.sentences.length && <div style={{ marginTop: 8 }}><Bar value={n / t.sentences.length} /></div>}
                </a>
              );
            })}
          </div>
        </section>
      ))}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add your own sentence">
        <p className="small muted">From your grammar book, a tutor, a show — any sentence with something new in it.</p>
        <ClozeEditor onSave={(text, en) => {
          s.addBuilt(buildCustomSentence(s.settings.lang, text, en || undefined, {}, s.now(), s.nextOrder()), 'sentence');
          toast('Card made.');
        }} />
      </Sheet>
    </div>
  );
}

function SentencePreview({ text }: { text: string }) {
  return (
    <span className="serif" style={{ fontSize: 19, lineHeight: 1.45 }}>
      {parseCloze(text).map((p, i) => (p.t === 'text' ? <span key={i}>{p.text}</span> : <span key={i} className="filled" title={p.hint}>{p.answer}</span>))}
    </span>
  );
}

function SentenceMaker({ topic, sentence, onClose, onNext }: { topic: GrammarTopic; sentence: GrammarSentence; onClose: () => void; onNext: () => void }) {
  const s = useStore();
  const existing = s.noteByRef('sentence', sentence.id);
  const [image, setImage] = useState<string | undefined>(existing?.image);
  const [credit, setCredit] = useState<string | undefined>(existing?.imageCredit);
  const [personal, setPersonal] = useState(existing?.personal ?? '');
  const [usePic, setUsePic] = useState(true);
  const n = clozeNumbers(sentence.text).length;

  const save = (andNext: boolean) => {
    const built = buildSentence(s.pack, sentence, topic.id, { image: usePic ? image : undefined, imageCredit: usePic ? credit : undefined, personal: personal.trim() || undefined }, s.now(), existing?.order ?? s.nextOrder());
    s.addBuilt(built, 'sentence');
    if (andNext) onNext();
    else onClose();
  };

  return (
    <div className="stack">
      <div className="card stack">
        <SentencePreview text={sentence.text} />
        <div className="row"><AudioButton text={plainText(sentence.text)} sentence auto /><span className="faint small">{n} card{n === 1 ? '' : 's'}: one per blank</span></div>
        <div className="faint small">{sentence.en}</div>
        {sentence.note && <div className="small muted">💡 {sentence.note}</div>}
      </div>
      <div className="setting">
        <div className="text"><b>Add a picture</b><small>The book pairs each sentence with an image of the situation.</small></div>
        <Switch checked={usePic} onChange={setUsePic} />
      </div>
      {usePic && <ImagePicker query={sentence.image ?? sentence.en} alternatives={[plainText(sentence.text)]} value={image} onChange={(img, cr) => { setImage(img); setCredit(cr); }} />}
      <label className="field"><span>Personal connection (optional)</span>
        <input className="input" value={personal} onChange={e => setPersonal(e.target.value)} placeholder="When did this last happen to you?" />
      </label>
      <div className="row">
        <button className="btn primary grow" onClick={() => save(true)}>{existing ? 'Save' : 'Make cards & next'}</button>
        <button className="btn" onClick={() => save(false)}>Save & close</button>
      </div>
    </div>
  );
}

export function GrammarTopicView({ id }: { id: string }) {
  const s = useStore();
  const pack = s.pack;
  const topic = pack.grammar.find(t => t.id === id);
  const [open, setOpen] = useState<string | null>(null);
  const [showEn, setShowEn] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [adding, setAdding] = useState(false);
  if (!topic) return <TopBar title="Not found" back="#/grammar" />;

  const idx = pack.grammar.indexOf(topic);
  const nextTopic = pack.grammar[idx + 1];
  const doneCount = topic.sentences.filter(x => made(s, x.id)).length;
  const sentence = topic.sentences.find(x => x.id === open);
  const nextUnmade = (after?: string) => {
    const start = after ? topic.sentences.findIndex(x => x.id === after) + 1 : 0;
    return [...topic.sentences.slice(start), ...topic.sentences.slice(0, start)].find(x => !made(s, x.id) && x.id !== after);
  };

  const ask = async () => {
    if (!q.trim()) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await askAi({ task: 'explain', question: q, context: `Grammar topic: ${topic.title}\n${topic.summary}` });
      if (res.task === 'explain') setAnswer(res.result.answer);
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="stack loose">
      <TopBar title={topic.title} back="#/grammar" right={<span className="badge">{topic.level}</span>} />
      <div className="card">
        <Prose text={topic.summary} />
        {topic.ref && <div className="faint small">📚 More in: {topic.ref}</div>}
      </div>

      {aiReady() && (
        <div className="card flat stack">
          <b>Ask about this</b>
          <form className="row" onSubmit={e => { e.preventDefault(); ask(); }}>
            <input className="input grow" value={q} onChange={e => setQ(e.target.value)} placeholder="Why is it ‘estoy cansado’ and not ‘soy cansado’?" />
            <button className="btn" disabled={asking}>{asking ? <Spinner /> : 'Ask'}</button>
          </form>
          {answer && <Prose text={answer} />}
        </div>
      )}

      <section className="stack">
        <div className="row between">
          <h2>Sentences <span className="faint">({doneCount}/{topic.sentences.length})</span></h2>
          <label className="row small muted" style={{ gap: 6 }}>English <Switch checked={showEn} onChange={setShowEn} /></label>
        </div>
        {nextUnmade() && <button className="btn primary block" onClick={() => setOpen(nextUnmade()!.id)}>Make cards, one sentence at a time</button>}
        <div className="stack tight">
          {topic.sentences.map(x => {
            const note = s.noteByRef('sentence', x.id);
            return (
              <button key={x.id} className="card link row top" style={{ textAlign: 'left', padding: '12px 14px', cursor: 'pointer', font: 'inherit' }} onClick={() => setOpen(x.id)}>
                {note?.image ? <CardImage image={note.image} size="xs" /> : <span className={`badge ${note ? 'ok' : ''}`} style={{ minWidth: 28, justifyContent: 'center' }}>{note ? '✓' : '+'}</span>}
                <div className="grow stack tight">
                  <SentencePreview text={x.text} />
                  {showEn && <span className="faint small">{x.en}</span>}
                </div>
              </button>
            );
          })}
        </div>
        <button className="btn ghost" onClick={() => setAdding(true)}>Add a sentence from your grammar book</button>
      </section>

      {nextTopic && <a className="btn block" href={`#/grammar/${nextTopic.id}`}>Next topic: {nextTopic.title}</a>}

      <Sheet open={!!sentence} onClose={() => setOpen(null)} title={sentence && made(s, sentence.id) ? 'Edit sentence card' : 'Make sentence cards'}>
        {sentence && (
          <SentenceMaker key={sentence.id} topic={topic} sentence={sentence} onClose={() => setOpen(null)}
            onNext={() => { const nx = nextUnmade(sentence.id); setOpen(nx?.id ?? null); if (!nx) toast('Every sentence in this topic is made.'); }} />
        )}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add your own sentence">
        <ClozeEditor onSave={(text, en) => {
          s.addBuilt(buildCustomSentence(s.settings.lang, text, en || undefined, {}, s.now(), s.nextOrder(), topic.id), 'sentence');
          toast('Card made.');
        }} />
      </Sheet>
    </div>
  );
}
