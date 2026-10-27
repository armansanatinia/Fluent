import { useMemo, useState } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { IconCheck, IconTrash } from '../components/icons';
import { AudioButton, GenderWord } from '../components/media';
import { Recordings } from '../components/Recordings';
import { Ext, Seg, Sheet, Spinner, Switch, toast, TopBar } from '../components/ui';
import { transcribe } from '../content';
import { askAi, aiReady } from '../lib/ai';
import { googleImages } from '../lib/images';
import { useStore } from '../lib/hooks';
import type { InboxItem, Note, Template } from '../lib/model';
import { buildCustom } from '../lib/notes';

const SOURCES = ['Tutor', 'TV', 'Book', 'Podcast', 'Conversation', 'Other'];

export function lookups(word: string) {
  const w = encodeURIComponent(word.trim());
  return [
    { name: 'RAE', url: `https://dle.rae.es/${w}` },
    { name: 'WordReference', url: `https://www.wordreference.com/es/en/translation.asp?spen=${w}` },
    { name: 'Forvo', url: `https://forvo.com/word/${w}/#es` },
    { name: 'Images', url: googleImages(word) },
  ];
}

function CustomMaker({ item, onDone }: { item: InboxItem; onDone: () => void }) {
  const s = useStore();
  const pack = s.pack;
  const [word, setWord] = useState(item.text.trim());
  const [gender, setGender] = useState<'none' | 'm' | 'f' | 'mf'>('none');
  const [def, setDef] = useState('');
  const [example, setExample] = useState(item.context ?? '');
  const [en, setEn] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [credit, setCredit] = useState<string | undefined>();
  const [audio, setAudio] = useState<{ url?: string; credit?: string }>({});
  const [personal, setPersonal] = useState(item.source ? `From ${item.source.toLowerCase()}` : '');
  const [busy, setBusy] = useState(false);
  const [usePic, setUsePic] = useState(true);
  const [spell, setSpell] = useState(false);

  const article = gender === 'm' ? pack.genders.m.article : gender === 'f' ? pack.genders.f.article : gender === 'mf' ? `${pack.genders.m.article}/${pack.genders.f.article}` : undefined;

  const fill = async () => {
    setBusy(true);
    try {
      const res = await askAi({ task: 'word', word, context: item.context });
      if (res.task !== 'word') return;
      const r = res.result;
      setWord(r.word || word);
      setGender(r.gender === 'none' ? 'none' : r.gender);
      setDef(r.definition);
      if (!example.trim() || !example.includes('[[')) setExample(r.examples[0]?.text ?? example);
      setEn(r.en + (r.note ? ` — ${r.note}` : ''));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'The AI helper failed.');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!word.trim()) return;
    const tmpls: Template[] = [];
    if (usePic && image) tmpls.push('recall');
    tmpls.push('recognize');
    if (def.trim()) tmpls.push('define');
    if (spell) tmpls.push('spell');
    let ex = example.trim();
    if (ex && !ex.includes('[[')) {
      const k = ex.toLowerCase().indexOf(word.trim().toLowerCase());
      ex = k >= 0 ? `${ex.slice(0, k)}[[${ex.slice(k, k + word.trim().length)}]]${ex.slice(k + word.trim().length)}` : ex;
    }
    const built = buildCustom(pack.code, {
      word: word.trim(), article, gender: gender === 'none' ? undefined : gender, en: en.trim() || undefined, def: def.trim() || undefined,
      example: ex || undefined, ipa: transcribe(pack.code, word), image: usePic ? image : undefined, imageCredit: credit,
      audio: audio.url, audioCredit: audio.credit, personal: personal.trim() || undefined,
    }, tmpls, s.now(), s.nextOrder());
    s.addBuilt(built, 'custom');
    s.updateInbox(item.id, { done: true });
    toast('Card made.');
    onDone();
  };

  return (
    <div className="stack">
      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 30, fontWeight: 600 }}><GenderWord word={word} article={article} gender={gender === 'none' ? undefined : gender} /></div>
        <div className="row"><AudioButton text={word} url={audio.url} /><span className="faint small" style={{ fontFamily: 'var(--mono)' }}>[{transcribe(pack.code, word)}]</span></div>
        <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>{lookups(word).map(l => <Ext key={l.name} href={l.url} className="chip">{l.name}</Ext>)}</div>
      </div>
      {aiReady() && <button className="btn" onClick={fill} disabled={busy}>{busy ? <Spinner /> : '✨ Fill in definition and example with AI'}</button>}
      <label className="field"><span>Dictionary form</span><input className="input" value={word} onChange={e => setWord(e.target.value)} /></label>
      <div className="field"><span>Gender (nouns)</span>
        <Seg value={gender} onChange={setGender} options={[{ value: 'none', label: 'Not a noun' }, { value: 'm', label: pack.genders.m.article }, { value: 'f', label: pack.genders.f.article }, { value: 'mf', label: 'both' }]} />
      </div>
      <label className="field"><span>Definition in Spanish (from RAE, or your tutor)</span><textarea className="textarea" style={{ minHeight: 60 }} value={def} onChange={e => setDef(e.target.value)} /></label>
      <label className="field"><span>Example sentence (wrap the word in [[ ]] or it’s found automatically)</span><textarea className="textarea" style={{ minHeight: 60 }} value={example} onChange={e => setExample(e.target.value)} /></label>
      <label className="field"><span>English (optional, hidden)</span><input className="input" value={en} onChange={e => setEn(e.target.value)} /></label>
      <div className="field"><span>Voice</span><Recordings word={word} value={audio.url} onChange={r => setAudio({ url: r?.url, credit: r?.credit })} /></div>
      <div className="setting"><div className="text"><b>Picture</b><small>Concrete words deserve one.</small></div><Switch checked={usePic} onChange={setUsePic} /></div>
      {usePic && <ImagePicker query={en.split(/[—,;(]/)[0].trim() || word} alternatives={[word]} value={image} onChange={(img, cr) => { setImage(img); setCredit(cr); }} />}
      <label className="field"><span>Personal connection</span><input className="input" value={personal} onChange={e => setPersonal(e.target.value)} /></label>
      <div className="setting"><div className="text"><b>Spelling card too</b></div><Switch checked={spell} onChange={setSpell} /></div>
      <button className="btn primary big" onClick={save}>Make cards</button>
    </div>
  );
}

export function Inbox() {
  const s = useStore();
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [source, setSource] = useState('Tutor');
  const [open, setOpen] = useState<string | null>(null);
  const items = useMemo(() => [...s.inbox.values()].filter(i => !i.deleted && i.lang === s.settings.lang).sort((a, b) => b.created - a.created), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const waiting = items.filter(i => !i.done);
  const done = items.filter(i => i.done);
  const mine: Note[] = s.liveNotes('custom');
  const item = items.find(i => i.id === open);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    s.addInbox(text.trim(), context.trim() || undefined, source);
    setText('');
    setContext('');
  };

  return (
    <div className="stack loose">
      <TopBar title="Word inbox" back="#/study" />
      <div className="card tint small muted">
        Met a word with your tutor, in a show or a book? Drop it here in a second, with the sentence you saw it in. Later, turn it into
        cards — that’s how your deck grows beyond the lists, exactly as the book suggests.
      </div>
      <form className="card stack" onSubmit={add}>
        <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Word or phrase" lang={s.pack.ttsLang} />
        <input className="input" value={context} onChange={e => setContext(e.target.value)} placeholder="The sentence where you met it (optional)" lang={s.pack.ttsLang} />
        <div className="chips">{SOURCES.map(x => <button type="button" key={x} className={`chip${source === x ? ' on' : ''}`} onClick={() => setSource(x)}>{x}</button>)}</div>
        <button className="btn primary" disabled={!text.trim()}>Save to inbox</button>
      </form>

      <section className="stack">
        <h2>Waiting ({waiting.length})</h2>
        {waiting.length === 0 && <div className="faint small">Nothing waiting.</div>}
        {waiting.map(i => (
          <div key={i.id} className="card stack tight">
            <div className="row between top">
              <div className="grow">
                <div className="serif" style={{ fontSize: 20, fontWeight: 600 }}>{i.text}</div>
                {i.context && <div className="small muted">“{i.context}”</div>}
                {i.source && <span className="badge" style={{ marginTop: 4 }}>{i.source}</span>}
              </div>
              <button className="icon-btn plain" onClick={() => s.updateInbox(i.id, { deleted: true })} aria-label="Delete"><IconTrash /></button>
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              <button className="btn small primary" onClick={() => setOpen(i.id)}>Make card</button>
              <button className="btn small" onClick={() => s.updateInbox(i.id, { done: true })}><IconCheck width={16} /> Done</button>
              {lookups(i.text).map(l => <Ext key={l.name} href={l.url} className="btn small ghost">{l.name}</Ext>)}
            </div>
          </div>
        ))}
      </section>

      {(done.length > 0 || mine.length > 0) && (
        <section className="stack">
          <h2>Your own cards ({mine.length})</h2>
          <div className="chips">
            {mine.slice(-60).reverse().map(n => <a key={n.id} className="chip" href={`#/browse/${encodeURIComponent(n.id)}`}>{n.article ? `${n.article} ` : ''}{n.word}</a>)}
          </div>
        </section>
      )}

      <Sheet open={!!item} onClose={() => setOpen(null)} title="Make cards">
        {item && <CustomMaker key={item.id} item={item} onDone={() => setOpen(null)} />}
      </Sheet>
    </div>
  );
}
