import { useMemo, useState } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { IconClose } from '../components/icons';
import { AudioButton, CardImage, GenderTag, GenderWord } from '../components/media';
import { Recordings } from '../components/Recordings';
import { Bar, Switch, toast, TopBar } from '../components/ui';
import { transcribe } from '../content';
import type { BaseWord } from '../content/types';
import { go, useStore } from '../lib/hooks';
import type { Template } from '../lib/model';
import { articleFor, buildWord, defaultImage, defaultWordTemplates } from '../lib/notes';
import { excludedWords, todayPlan } from '../lib/progress';
import type { Store } from '../lib/store';

const skipKey = (s: Store) => `words:skipped:${s.settings.lang}`;

function skippedToday(s: Store): Set<string> {
  const m = s.get<Record<string, string>>(skipKey(s)) ?? {};
  const today = s.today();
  return new Set(Object.entries(m).filter(([, d]) => d === today).map(([id]) => id));
}

export function wordsTarget(s: Store): number {
  const item = todayPlan(s).items.find(i => i.id === 'words');
  return item?.progress?.total ?? 0;
}

export function Words() {
  const s = useStore();
  const [english, setEnglish] = useState(false);
  const pack = s.pack;
  const made = useMemo(() => new Map(s.liveNotes('word').map(n => [n.ref!, n])), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const excluded = new Set(excludedWords(s));
  const done = pack.words.filter(w => made.has(w.id) || excluded.has(w.id)).length;
  const target = wordsTarget(s);
  const today = s.day().made.word ?? 0;

  return (
    <div>
      <TopBar title="Base words" back="#/study" />
      <div className="card stack">
        <div className="row between">
          <div><span className="big-num">{done}</span> <span className="muted">of {pack.words.length} words</span></div>
          {target > 0 && <span className="badge accent">Today {Math.min(today, target)}/{target}</span>}
        </div>
        <Bar value={done / pack.words.length} />
        <a className="btn primary big block" href="#/words/make">{done >= pack.words.length ? 'All words made — review them in Browse' : `Make the next ${Math.max(1, target - today) || 10} words`}</a>
      </div>

      <div className="card tint" style={{ marginTop: 14 }}>
        <div className="small muted">
          <b>The book’s way:</b> every word gets a picture you choose, its real pronunciation, and no English. Nouns get the gender trick —
          masculine words <b style={{ color: 'var(--m)' }}>{s.settings.gender.m.action} {s.settings.gender.m.emoji}</b>, feminine words{' '}
          <b style={{ color: 'var(--f)' }}>{s.settings.gender.f.action} {s.settings.gender.f.emoji}</b> — and a quick personal memory makes it stick.
        </div>
      </div>

      <div className="row between" style={{ marginTop: 18 }}>
        <span className="small muted">Show English concepts</span>
        <Switch checked={english} onChange={setEnglish} label="Show English" />
      </div>

      {pack.categories.map(cat => {
        const list = pack.words.filter(w => w.category === cat.id);
        if (!list.length) return null;
        const n = list.filter(w => made.has(w.id)).length;
        return (
          <section key={cat.id}>
            <div className="section-title">{cat.native} · {cat.title} <span className="faint">({n}/{list.length})</span></div>
            <div className="word-grid">
              {list.map(w => {
                const note = made.get(w.id);
                return (
                  <a key={w.id} className={`word-tile${note ? ' made' : ''}`} href={`#/words/make/${w.id}`} style={excluded.has(w.id) ? { opacity: 0.4 } : undefined}>
                    <CardImage image={note?.image ?? defaultImage(w)} size="xs" />
                    <span className="w"><GenderWord word={w.word} article={w.pos === 'noun' ? articleFor(pack, w) : undefined} gender={w.gender} /></span>
                    {english && <span className="faint tiny">{w.en}</span>}
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MakeOne({ w, index, total, onDone, onSkip, onExclude }: { w: BaseWord; index: number; total: number; onDone: () => void; onSkip: () => void; onExclude: () => void }) {
  const s = useStore();
  const pack = s.pack;
  const existing = s.noteByRef('word', w.id);
  const existingCards = existing ? s.cardsOf(existing.id).map(c => c.tmpl) : null;
  const fallback = defaultImage(w);
  const [image, setImage] = useState<string | undefined>(existing?.image ?? fallback);
  const [credit, setCredit] = useState<string | undefined>(existing?.imageCredit);
  const [audio, setAudio] = useState<{ url?: string; credit?: string }>({ url: existing?.audio, credit: existing?.audioCredit });
  const [personal, setPersonal] = useState(existing?.personal ?? '');
  const [mnemonic, setMnemonic] = useState(existing?.mnemonic ?? '');
  const [tmpls, setTmpls] = useState<Template[]>(existingCards ?? defaultWordTemplates(w, s.settings));
  const [fx, setFx] = useState(0);
  const [showEn, setShowEn] = useState(false);

  const article = w.pos === 'noun' ? articleFor(pack, w) : undefined;
  const g = w.gender === 'm' || w.gender === 'f' ? w.gender : null;
  const cat = pack.categories.find(c => c.id === w.category);
  const ipa = transcribe(pack.code, w.word);
  const toggle = (t: Template) => setTmpls(list => (list.includes(t) ? list.filter(x => x !== t) : [...list, t]));

  const save = () => {
    if (!tmpls.length) return toast('Pick at least one card.');
    const built = buildWord(pack, w, { image, imageCredit: credit, audio: audio.url, audioCredit: audio.credit, personal: personal.trim() || undefined, mnemonic: mnemonic.trim() || undefined }, tmpls, s.now(), existing?.order ?? s.nextOrder(), ipa);
    s.addBuilt(built, 'word');
    const ex = excludedWords(s);
    if (ex.includes(w.id)) s.set(`words:excluded:${s.settings.lang}`, ex.filter(id => id !== w.id));
    onDone();
  };

  return (
    <div className="stack loose">
      <div className="session-top">
        <a className="icon-btn plain" href="#/words" aria-label="Close"><IconClose /></a>
        <div className="grow center small muted">{total > 1 ? `Word ${index + 1} of ${total}` : existing ? 'Edit word' : 'New word'} · {cat?.native}</div>
        <span style={{ width: 40 }} />
      </div>

      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="flash" style={{ border: 0, boxShadow: 'none', padding: 0, background: 'transparent' }}>
          <CardImage image={image} fx={g ? s.settings.gender[g].effect : null} fxKey={fx} />
          <div className="word"><GenderWord word={w.word} article={article} gender={w.gender} fem={w.fem} /></div>
          <div className="ipa">[{ipa}]</div>
          <div className="row"><AudioButton text={w.word} url={audio.url} auto />{g && <GenderTag gender={w.gender} />}</div>
        </div>
        {showEn ? <div className="faint small">Concept: {w.en}</div> : <button className="btn small ghost" onClick={() => setShowEn(true)}>What does it mean?</button>}
        {(w.genderNote || w.note) && (
          <div className="notice" style={{ textAlign: 'left', width: '100%' }}>
            {w.genderNote && <div>⚧ {w.genderNote}</div>}
            {w.note && <div>💡 {w.note}</div>}
          </div>
        )}
      </div>

      <section className="stack">
        <h2>1 · Hear it</h2>
        <p className="small muted" style={{ margin: 0 }}>Listen three times and say it out loud. Choose the voice your cards will use.</p>
        <Recordings word={w.word} value={audio.url} onChange={r => setAudio({ url: r?.url, credit: r?.credit })} />
      </section>

      <section className="stack">
        <h2>2 · Choose a picture</h2>
        <ImagePicker query={w.search ?? w.en} alternatives={[w.word, w.en]} value={image} fallback={fallback}
          onChange={(img, cr) => { setImage(img); setCredit(cr); if (g) setFx(f => f + 1); }} />
      </section>

      {g && (
        <section className="stack">
          <h2>3 · The gender trick</h2>
          <div className="card tint stack">
            <div style={{ fontSize: 18 }}>
              Picture <b>{article} {w.word}</b> — <b style={{ color: `var(--${g})` }}>it {s.settings.gender[g].action} {s.settings.gender[g].emoji}</b>.
              Make it loud, vivid and a little absurd.
            </div>
            <button className="btn small" style={{ alignSelf: 'flex-start' }} onClick={() => setFx(f => f + 1)}>Play it again</button>
            <textarea className="textarea" style={{ minHeight: 70 }} value={mnemonic} onChange={e => setMnemonic(e.target.value)} placeholder="What did you see? (optional)" />
          </div>
        </section>
      )}

      <section className="stack">
        <h2>{g ? '4' : '3'} · Make it personal</h2>
        <p className="small muted" style={{ margin: 0 }}>{(cat?.prompt ?? 'What does {w} remind you of?').replace(/\{w\}/g, w.word)}</p>
        <textarea className="textarea" style={{ minHeight: 70 }} value={personal} onChange={e => setPersonal(e.target.value)} placeholder="A memory, a place, a person (optional, any language)" />
      </section>

      <section className="stack">
        <h2>{g ? '5' : '4'} · Cards</h2>
        <div className="card flat">
          {([
            ['recall', 'Picture → word', 'See the picture, say the word (and its gender).'],
            ['recognize', 'Word → picture', 'Hear and read the word, picture what it means.'],
            ['spell', 'Spelling', 'See the picture and hear it, type the spelling.'],
          ] as [Template, string, string][]).map(([t, label, help]) => (
            <div className="setting" key={t}>
              <div className="text"><b>{label}</b><small>{help}</small></div>
              <Switch checked={tmpls.includes(t)} onChange={() => toggle(t)} label={label} />
            </div>
          ))}
        </div>
      </section>

      <div className="stack tight" style={{ position: 'sticky', bottom: 0, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', paddingTop: 10, background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}>
        <button className="btn primary big block" onClick={save}>{existing ? 'Save changes' : total > 1 && index + 1 < total ? 'Save & next word' : 'Save'}</button>
        {!existing && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn small ghost" onClick={onSkip}>Skip for today</button>
            <button className="btn small ghost" onClick={onExclude}>I don’t need this word</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function MakeWords({ only }: { only?: string }) {
  const s = useStore();
  const pack = s.pack;
  const [made, setMade] = useState(0);

  const queue = useMemo(() => {
    if (only) return pack.words.filter(w => w.id === only);
    const done = new Set(s.liveNotes('word').map(n => n.ref));
    const excluded = new Set(excludedWords(s));
    const skipped = skippedToday(s);
    return pack.words.filter(w => !done.has(w.id) && !excluded.has(w.id) && !skipped.has(w.id));
    // Fixed for the session, so the list doesn't shift while you work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only]);
  const [pos, setPos] = useState(0);
  const [goal, setGoal] = useState(() => (only ? 1 : Math.max(wordsTarget(s) - (s.day().made.word ?? 0), 0) || 10));

  const w = queue[pos];
  const finished = !w || made >= goal;

  if (finished) {
    return (
      <div className="stack loose" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 56 }}>{queue.length ? '✨' : '🏁'}</div>
        <h2>{queue.length ? `${made} new word${made === 1 ? '' : 's'} made` : 'Every base word is in your deck'}</h2>
        <p className="muted">Their cards are waiting in today’s review.</p>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <a className="btn primary" href="#/review">Review now</a>
          {w && <button className="btn" onClick={() => setGoal(g => g + 5)}>Make 5 more</button>}
          <a className="btn ghost" href="#/today">Back to today</a>
        </div>
      </div>
    );
  }

  const next = () => {
    if (only) return go('#/words');
    setMade(m => m + 1);
    setPos(p => p + 1);
    window.scrollTo(0, 0);
  };
  const skip = () => {
    const m = s.get<Record<string, string>>(skipKey(s)) ?? {};
    s.set(skipKey(s), { ...m, [w.id]: s.today() });
    setPos(p => p + 1);
    window.scrollTo(0, 0);
  };
  const exclude = () => {
    s.set(`words:excluded:${s.settings.lang}`, [...new Set([...excludedWords(s), w.id])]);
    toast(`“${w.word}” left out. You can add it back from the word list.`);
    setPos(p => p + 1);
    window.scrollTo(0, 0);
  };

  return <MakeOne key={w.id} w={w} index={made} total={goal} onDone={next} onSkip={skip} onExclude={exclude} />;
}
