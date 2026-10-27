import { useMemo, useState } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { IconClose } from '../components/icons';
import { AudioButton, CardImage, GenderWord } from '../components/media';
import { Recordings } from '../components/Recordings';
import { Bar, Switch, toast, TopBar } from '../components/ui';
import { transcribe } from '../content';
import type { VocabWord } from '../content/types';
import { splitExample } from '../lib/cloze';
import { go, useStore } from '../lib/hooks';
import type { Template } from '../lib/model';
import { articleFor, buildVocab } from '../lib/notes';
import { todayPlan } from '../lib/progress';

const TOPIC: Record<string, string> = {
  core: 'Core', time: 'Time', connectors: 'Connectors', quantity: 'Quantity', mind: 'Thinking', feelings: 'Feelings',
  society: 'Society', work: 'Work', travel: 'Travel', 'everyday-spain': 'Everyday Spain', expressions: 'Expressions',
  description: 'Describing', actions: 'Actions',
};

function Example({ text }: { text: string }) {
  const ex = splitExample(text);
  return <span>{ex.before}<span className="filled">{ex.target}</span>{ex.after}</span>;
}

export function Vocab() {
  const s = useStore();
  const pack = s.pack;
  const [english, setEnglish] = useState(false);
  const madeSet = useMemo(() => new Set(s.liveNotes('vocab').map(n => n.ref)), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const bands = [1, 2, 3] as const;

  return (
    <div>
      <TopBar title="Vocabulary" back="#/study" />
      <div className="card stack">
        <div><span className="big-num">{madeSet.size}</span> <span className="muted">of {pack.vocab.length} words</span></div>
        <Bar value={madeSet.size / Math.max(1, pack.vocab.length)} />
        <a className="btn primary block" href="#/vocab/make">Learn the next words</a>
      </div>
      <div className="card tint" style={{ marginTop: 14 }}>
        <p className="small muted" style={{ margin: 0 }}>
          <b>The book’s way:</b> after the base words, learn the most frequent words — including the abstract ones pictures can’t show —
          through simple Spanish definitions and example sentences. English stays hidden unless you really need it.
        </p>
      </div>
      <div className="row between" style={{ marginTop: 18 }}>
        <span className="small muted">Show English</span>
        <Switch checked={english} onChange={setEnglish} />
      </div>
      {bands.map(b => {
        const list = pack.vocab.filter(v => v.band === b);
        if (!list.length) return null;
        return (
          <section key={b}>
            <div className="section-title">{b === 1 ? 'Top 1000' : b === 2 ? 'Top 2000' : 'Everyday Spain & expressions'}</div>
            <div className="list card flat" style={{ padding: '0 14px' }}>
              {list.map(v => (
                <a key={v.id} className="item row" href={`#/vocab/make/${v.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span className={`badge ${madeSet.has(v.id) ? 'ok' : ''}`} style={{ minWidth: 26, justifyContent: 'center' }}>{madeSet.has(v.id) ? '✓' : '+'}</span>
                  <div className="grow">
                    <div className="serif" style={{ fontWeight: 600, fontSize: 17 }}><GenderWord word={v.word} article={v.pos === 'noun' ? articleFor(pack, v) : undefined} gender={v.gender} /></div>
                    <div className="faint small">{english ? v.en : v.def}</div>
                  </div>
                  {v.topic && <span className="badge">{TOPIC[v.topic] ?? v.topic}</span>}
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MakeOne({ v, index, total, onDone }: { v: VocabWord; index: number; total: number; onDone: () => void }) {
  const s = useStore();
  const pack = s.pack;
  const existing = s.noteByRef('vocab', v.id);
  const existingT = existing ? s.cardsOf(existing.id).map(c => c.tmpl) : null;
  const fallback = v.emoji ? `emoji:${v.emoji}` : undefined;
  const [image, setImage] = useState<string | undefined>(existing?.image ?? fallback);
  const [credit, setCredit] = useState<string | undefined>(existing?.imageCredit);
  const [audio, setAudio] = useState<{ url?: string; credit?: string }>({ url: existing?.audio, credit: existing?.audioCredit });
  const [personal, setPersonal] = useState(existing?.personal ?? '');
  const [showEn, setShowEn] = useState(false);
  const [pick, setPick] = useState(false);
  const [tmpls, setTmpls] = useState<Template[]>(existingT ?? ['define', 'recognize']);
  const article = v.pos === 'noun' ? articleFor(pack, v) : undefined;
  const ipa = transcribe(pack.code, v.word);
  const toggle = (t: Template) => setTmpls(l => (l.includes(t) ? l.filter(x => x !== t) : [...l, t]));

  const save = () => {
    const t = tmpls.filter(x => x !== 'recall' || image);
    if (!t.length) return toast('Pick at least one card.');
    s.addBuilt(buildVocab(pack, v, { image, imageCredit: credit, audio: audio.url, audioCredit: audio.credit, personal: personal.trim() || undefined }, s.now(), existing?.order ?? s.nextOrder(), ipa, t), 'vocab');
    onDone();
  };

  return (
    <div className="stack loose">
      <div className="session-top">
        <a className="icon-btn plain" href="#/vocab" aria-label="Close"><IconClose /></a>
        <div className="grow center small muted">{total > 1 ? `Word ${index + 1} of ${total}` : existing ? 'Edit word' : 'New word'}</div>
        <span style={{ width: 40 }} />
      </div>
      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        {image && <CardImage image={image} size="md" />}
        <div className="word serif" style={{ fontSize: 36, fontWeight: 600 }}><GenderWord word={v.word} article={article} gender={v.gender} fem={v.fem} /></div>
        <div className="ipa" style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>[{ipa}]</div>
        <AudioButton text={v.word} url={audio.url} auto />
        <div className="def serif" style={{ fontSize: 19 }}>{v.def}</div>
        <div className="muted"><Example text={v.example} /></div>
        {showEn ? <div className="faint small">{v.en}</div> : <button className="btn small ghost" onClick={() => setShowEn(true)}>Show English</button>}
      </div>

      <section className="stack">
        <h2>Voice</h2>
        <Recordings word={v.word} value={audio.url} onChange={r => setAudio({ url: r?.url, credit: r?.credit })} />
      </section>

      <section className="stack">
        <div className="row between"><h2>Picture (optional)</h2><Switch checked={pick} onChange={setPick} /></div>
        {pick && <ImagePicker query={v.en} alternatives={[v.word]} value={image} fallback={fallback} onChange={(img, cr) => { setImage(img); setCredit(cr); }} />}
      </section>

      <label className="field"><span>Personal connection (optional)</span>
        <input className="input" value={personal} onChange={e => setPersonal(e.target.value)} placeholder="Where would you use this word?" />
      </label>

      <div className="card flat">
        {([
          ['define', 'Definition → word', 'Read the Spanish definition and example, recall the word.'],
          ['recognize', 'Word → meaning', 'See and hear the word, recall what it means.'],
          ['recall', 'Picture → word', 'Only with a picture.'],
          ['spell', 'Spelling', 'Hear it, type it.'],
        ] as [Template, string, string][]).map(([t, label, help]) => (
          <div className="setting" key={t}>
            <div className="text"><b>{label}</b><small>{help}</small></div>
            <Switch checked={tmpls.includes(t) && (t !== 'recall' || !!image)} onChange={() => toggle(t)} />
          </div>
        ))}
      </div>

      <button className="btn primary big block" onClick={save}>{existing ? 'Save changes' : 'Save & next'}</button>
    </div>
  );
}

export function MakeVocab({ only }: { only?: string }) {
  const s = useStore();
  const pack = s.pack;
  const queue = useMemo(() => {
    if (only) return pack.vocab.filter(v => v.id === only);
    const done = new Set(s.liveNotes('vocab').map(n => n.ref));
    return pack.vocab.filter(v => !done.has(v.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only]);
  const [pos, setPos] = useState(0);
  const [goal, setGoal] = useState(() => {
    if (only) return 1;
    const item = todayPlan(s).items.find(i => i.id === 'vocab');
    return Math.max((item?.progress?.total ?? 0) - (s.day().made.vocab ?? 0), 0) || 10;
  });
  const v = queue[pos];

  if (!v || pos >= goal) {
    return (
      <div className="stack loose" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 56 }}>📖</div>
        <h2>{pos} word{pos === 1 ? '' : 's'} added</h2>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <a className="btn primary" href="#/review">Review now</a>
          {v && <button className="btn" onClick={() => setGoal(g => g + 5)}>5 more</button>}
          <a className="btn ghost" href="#/today">Back to today</a>
        </div>
      </div>
    );
  }
  return <MakeOne key={v.id} v={v} index={pos} total={goal} onDone={() => { if (only) go('#/vocab'); else { setPos(p => p + 1); window.scrollTo(0, 0); } }} />;
}
