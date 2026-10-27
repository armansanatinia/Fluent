import { useMemo, useState } from 'react';
import { ImagePicker } from '../components/ImagePicker';
import { AudioButton, CardImage, GenderWord } from '../components/media';
import { Recordings } from '../components/Recordings';
import { confirmAction, Sheet, toast, TopBar } from '../components/ui';
import { plainText } from '../lib/cloze';
import { go, useStore } from '../lib/hooks';
import { TEMPLATE_LABEL, type Note } from '../lib/model';
import { State } from '../lib/srs';
import { formatInterval } from '../lib/time';

const KINDS: { id: Note['kind'] | 'all' | 'trouble'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'trouble', label: 'Trouble cards' }, { id: 'word', label: 'Base words' }, { id: 'sentence', label: 'Sentences' },
  { id: 'vocab', label: 'Vocabulary' }, { id: 'custom', label: 'Your words' }, { id: 'sound', label: 'Sounds' }, { id: 'pair', label: 'Pairs' },
];

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function title(n: Note) {
  if (n.kind === 'sentence') return plainText(n.word);
  if (n.kind === 'pair') return n.word.replace('|', ' / ');
  return n.word;
}

function NoteEditor({ id }: { id: string }) {
  const s = useStore();
  const note = s.notes.get(id);
  const [picking, setPicking] = useState(false);
  if (!note || note.deleted) return <div><TopBar title="Card not found" back="#/browse" /><p className="muted">It may have been deleted.</p></div>;
  const cards = s.cardsOf(note.id);
  const now = s.now();
  const field = (key: 'personal' | 'mnemonic' | 'extra' | 'en', label: string, ph = '') => (
    <label className="field"><span>{label}</span>
      <textarea className="textarea" style={{ minHeight: 56 }} defaultValue={note[key] ?? ''} placeholder={ph}
        onBlur={e => e.target.value !== (note[key] ?? '') && s.updateNote(note.id, { [key]: e.target.value.trim() || undefined })} />
    </label>
  );
  const remake = note.kind === 'word' && note.ref ? `#/words/make/${note.ref}` : note.kind === 'vocab' && note.ref ? `#/vocab/make/${note.ref}` : null;

  return (
    <div className="stack loose">
      <TopBar title="Edit card" back={() => history.back()} />
      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        {note.kind !== 'pair' && note.kind !== 'sound' && <CardImage image={note.image} size="md" />}
        <div className="serif" style={{ fontSize: note.kind === 'sentence' ? 20 : 30, fontWeight: 600 }}>
          {note.kind === 'sentence' ? title(note) : <GenderWord word={title(note)} article={note.article} gender={note.gender} fem={note.fem} />}
        </div>
        {note.ipa && <div className="faint" style={{ fontFamily: 'var(--mono)' }}>[{note.ipa}]</div>}
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          {note.kind !== 'pair' && note.kind !== 'sound' && <AudioButton text={note.kind === 'sentence' ? plainText(note.word) : note.word} url={note.audio} sentence={note.kind === 'sentence'} />}
          {note.kind !== 'pair' && note.kind !== 'sound' && <button className="btn small" onClick={() => setPicking(true)}>Change picture</button>}
          {remake && <a className="btn small" href={remake}>Open in the maker</a>}
        </div>
        {note.imageCredit && <div className="faint tiny">Picture: {note.imageCredit}</div>}
      </div>

      {(note.kind === 'word' || note.kind === 'vocab' || note.kind === 'custom') && (
        <div className="field"><span>Voice</span><Recordings word={note.word} value={note.audio} onChange={r => s.updateNote(note.id, { audio: r?.url, audioCredit: r?.credit })} /></div>
      )}
      {note.kind !== 'pair' && note.kind !== 'sound' && field('personal', 'Personal connection', 'A memory tied to this')}
      {note.gender && (note.gender === 'm' || note.gender === 'f') && field('mnemonic', 'Gender image', `It ${s.settings.gender[note.gender].action}…`)}
      {note.kind !== 'pair' && note.kind !== 'sound' && field('en', 'English (hidden on cards)')}
      {field('extra', 'Notes')}

      <section className="stack">
        <h2>Cards</h2>
        <div className="list card flat" style={{ padding: '0 14px' }}>
          {cards.map(c => (
            <div key={c.id} className="item row">
              <div className="grow">
                <b>{TEMPLATE_LABEL[c.tmpl]}</b>
                <div className="faint small">
                  {c.suspended ? 'Suspended' : c.state === State.New ? 'New' : c.state === State.Review ? `Every ${formatInterval(c.ivl * 86_400_000)} · due ${c.due <= now ? 'now' : `in ${formatInterval(c.due - now)}`}` : 'Learning'}
                  {c.reps ? ` · ${c.reps} reviews` : ''}{c.lapses ? ` · forgot ${c.lapses}×` : ''}
                </div>
              </div>
              <button className="btn small ghost" onClick={() => s.setSuspended(c.id, !c.suspended)}>{c.suspended ? 'Unsuspend' : 'Suspend'}</button>
              <button className="btn small ghost" onClick={() => confirmAction('Forget this card’s history and learn it again?') && s.resetCard(c.id)}>Reset</button>
            </div>
          ))}
        </div>
      </section>

      <button className="btn danger" onClick={() => { if (confirmAction('Delete this note and its cards?')) { s.deleteNote(note.id); toast('Deleted.'); go('#/browse'); } }}>Delete note and cards</button>

      <Sheet open={picking} onClose={() => setPicking(false)} title="Change picture">
        <ImagePicker query={note.en?.split(/[—,;(]/)[0].trim() || plainText(note.word)} alternatives={[plainText(note.word)]} value={note.image}
          onChange={(img, cr) => { s.updateNote(note.id, { image: img, imageCredit: cr }); setPicking(false); }} />
      </Sheet>
    </div>
  );
}

export function Browse({ noteId }: { noteId?: string }) {
  const s = useStore();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Note['kind'] | 'all' | 'trouble'>('all');
  const notes = useMemo(() => s.liveNotes().sort((a, b) => b.created - a.created), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  if (noteId) return <NoteEditor id={noteId} />;
  const f = fold(q.trim());
  const trouble = (n: Note) => s.cardsOf(n.id).some(c => c.lapses >= 4);
  const shown = notes.filter(n => (kind === 'all' || (kind === 'trouble' ? trouble(n) : n.kind === kind)) && (!f || fold(`${title(n)} ${n.en ?? ''} ${n.personal ?? ''}`).includes(f)));

  return (
    <div className="stack">
      <TopBar title="Your cards" back="#/study" />
      <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search words, sentences, memories" />
      <div className="chips">{KINDS.map(k => <button key={k.id} className={`chip${kind === k.id ? ' on' : ''}`} onClick={() => setKind(k.id)}>{k.label}</button>)}</div>
      <div className="faint small">{shown.length} notes</div>
      {shown.length === 0 && <div className="empty"><div className="big">🗂️</div>No cards yet. Make some from the Study tab.</div>}
      <div className="list">
        {shown.slice(0, 200).map(n => (
          <a key={n.id} className="item row" href={`#/browse/${encodeURIComponent(n.id)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {n.kind !== 'pair' && n.kind !== 'sound' ? <CardImage image={n.image} size="xs" /> : <span className="pic xs"><span className="emo">{n.kind === 'pair' ? '👂' : '🔤'}</span></span>}
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="serif" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.kind === 'sentence' ? title(n) : <GenderWord word={title(n)} article={n.article} gender={n.gender} />}
              </div>
              {n.personal && <div className="faint small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>💭 {n.personal}</div>}
            </div>
            <span className="badge">{KINDS.find(k => k.id === n.kind)?.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
