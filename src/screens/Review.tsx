import { useEffect, useMemo, useRef, useState } from 'react';
import { IconClose, IconEdit, IconPlay, IconUndo } from '../components/icons';
import { AudioButton, CardImage, GenderTag, GenderWord } from '../components/media';
import { check, diff, VERDICT_TEXT, type Verdict } from '../lib/answer';
import { sayWord, speak, stopAudio } from '../lib/audio';
import { parseCloze, plainText, splitExample } from '../lib/cloze';
import { go, useKeys, useNow, useStore } from '../lib/hooks';
import type { Card, Note } from '../lib/model';
import { buildQueue, nextCard } from '../lib/queue';
import { preview, seedOf, State, type Rating } from '../lib/srs';
import { formatInterval } from '../lib/time';

function promptFor(note: Note): string {
  switch (note.pos) {
    case 'noun': return '¿Qué es? ¿el o la?';
    case 'verb': return '¿Qué acción es?';
    case 'adj': return '¿Cómo es?';
    case 'num': return '¿Qué número es?';
    default: return '¿Qué palabra es?';
  }
}

function fullWord(note: Note) {
  return note.article && note.pos === 'noun' && !note.article.includes('/') ? `${note.article} ${note.word}` : note.word;
}

function Cloze({ text, n, revealed }: { text: string; n: number; revealed: boolean }) {
  return (
    <div className="sentence">
      {parseCloze(text).map((p, i) => {
        if (p.t === 'text') return <span key={i}>{p.text}</span>;
        if (p.n !== n) return <span key={i}>{p.answer}</span>;
        return revealed ? <span key={i} className="filled">{p.answer}</span> : <span key={i} className="blank">{p.hint ?? '…'}</span>;
      })}
    </div>
  );
}

function Memory({ note }: { note: Note }) {
  if (!note.personal && !note.mnemonic) return null;
  return (
    <div className="memory">
      {note.mnemonic && <div>🎬 {note.mnemonic}</div>}
      {note.personal && <div>💭 {note.personal}</div>}
    </div>
  );
}

function EnglishPeek({ text }: { text?: string }) {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return show ? <div className="faint small">{text}</div> : <button className="btn small ghost" onClick={() => setShow(true)}>Show English</button>;
}

interface FaceProps {
  note: Note;
  card: Card;
  revealed: boolean;
  fxKey: number;
  typed: string;
  setTyped: (s: string) => void;
  verdict: Verdict | null;
  onSubmit: () => void;
  pair: { target: number; picked: number | null };
  onPick: (i: number) => void;
}

function Face({ note, card, revealed, fxKey, typed, setTyped, verdict, onSubmit, pair, onPick }: FaceProps) {
  const s = useStore();
  const g = note.gender === 'm' || note.gender === 'f' ? note.gender : null;
  const effect = g && revealed ? s.settings.gender[g].effect : null;
  const ipa = s.settings.showIpa && note.ipa ? <div className="ipa">[{note.ipa}]</div> : null;
  const typeBox = (placeholder: string) => (
    <form className="stack tight" style={{ width: '100%', maxWidth: 360 }} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      <input className="input big" value={typed} onChange={e => setTyped(e.target.value)} placeholder={placeholder} autoFocus
        autoCapitalize="off" autoCorrect="off" spellCheck={false} lang={s.pack.ttsLang} disabled={revealed} />
    </form>
  );
  const typedResult = revealed && verdict && verdict !== 'empty' && (
    <div className="stack tight" style={{ alignItems: 'center' }}>
      <div className={`badge ${verdict === 'exact' ? 'ok' : verdict === 'wrong' ? 'bad' : 'warn'}`}>{VERDICT_TEXT[verdict]}</div>
      {verdict !== 'exact' && (
        <div className="diff">{diff(typed, card.tmpl === 'recall' ? fullWord(note) : note.word).map((p, i) => <span key={i} className={p.kind}>{p.text}</span>)}</div>
      )}
    </div>
  );

  switch (card.tmpl) {
    case 'recall':
      return (
        <>
          <div className="prompt">{revealed ? '' : promptFor(note)}</div>
          <CardImage image={note.image} fx={effect} fxKey={revealed ? fxKey : 0} alt="" />
          {!revealed && s.settings.typeRecall && typeBox('Type it')}
          {revealed && (
            <>
              <div className="word"><GenderWord word={note.word} article={note.article} gender={note.gender} fem={note.fem} /></div>
              {ipa}
              <div className="row"><AudioButton text={note.word} url={note.audio} auto /><GenderTag gender={note.gender} /></div>
              {typedResult}
              <Memory note={note} />
            </>
          )}
        </>
      );
    case 'recognize':
      return (
        <>
          <div className="prompt">{revealed ? '' : 'What is it? Picture it before you look.'}</div>
          <div className="word"><GenderWord word={note.word} article={note.article} gender={note.gender} fem={note.fem} /></div>
          {ipa}
          <AudioButton text={note.word} url={note.audio} auto />
          {revealed && (
            <>
              <CardImage image={note.image} fx={effect} fxKey={fxKey} />
              <Memory note={note} />
              <EnglishPeek text={note.en} />
            </>
          )}
        </>
      );
    case 'spell':
      return (
        <>
          <div className="prompt">How is it spelled?</div>
          <CardImage image={note.image} size="md" fx={effect} fxKey={revealed ? fxKey : 0} />
          <AudioButton text={note.word} url={note.audio} auto size="round" />
          {typeBox('Spell it')}
          {revealed && (
            <>
              <div className="word l"><GenderWord word={note.word} article={note.article} gender={note.gender} /></div>
              {typedResult}
            </>
          )}
        </>
      );
    case 'cloze1':
    case 'cloze2':
    case 'cloze3': {
      const n = Number(card.tmpl.slice(5));
      return (
        <>
          {note.image && <CardImage image={note.image} size="md" />}
          <Cloze text={note.word} n={n} revealed={revealed} />
          {!revealed && typeBox('Fill the blank (optional)')}
          {revealed && (
            <>
              {typedResult}
              <AudioButton text={plainText(note.word)} sentence auto label="Listen to the sentence" />
              {note.extra && <div className="small muted" style={{ maxWidth: '36ch' }}>{note.extra}</div>}
              <Memory note={note} />
              <EnglishPeek text={note.en} />
            </>
          )}
        </>
      );
    }
    case 'define': {
      const ex = splitExample(note.example ?? '');
      return (
        <>
          <div className="prompt">¿Qué palabra es?</div>
          {note.image && <CardImage image={note.image} size="md" fx={effect} fxKey={revealed ? fxKey : 0} />}
          <div className="def serif">{note.def}</div>
          {note.example && (
            <div className="muted" style={{ maxWidth: '36ch' }}>
              {ex.before}{revealed ? <span className="filled">{ex.target}</span> : <span className="blank">…</span>}{ex.after}
            </div>
          )}
          {revealed && (
            <>
              <div className="word l"><GenderWord word={note.word} article={note.article} gender={note.gender} fem={note.fem} /></div>
              {ipa}
              <AudioButton text={note.word} url={note.audio} auto />
              <Memory note={note} />
              <EnglishPeek text={note.en} />
            </>
          )}
        </>
      );
    }
    case 'pair': {
      const words = note.word.split('|');
      const play = (i: number) => sayWord(words[i]);
      return (
        <>
          <div className="prompt">Which word did you hear?</div>
          <button className="play round" onClick={() => play(pair.target)} aria-label="Play again"><IconPlay /></button>
          <div className="choices">
            {words.map((w, i) => {
              const cls = pair.picked === null ? '' : i === pair.target ? ' right' : i === pair.picked ? ' wrong' : '';
              return <button key={i} className={`choice${cls}`} onClick={() => pair.picked === null && onPick(i)}>{w}</button>;
            })}
          </div>
          {revealed && (
            <>
              <div className={`badge ${pair.picked === pair.target ? 'ok' : 'bad'}`}>{pair.picked === pair.target ? '¡Eso es!' : `It was “${words[pair.target]}”`}</div>
              <div className="row">
                {words.map((w, i) => <button key={i} className="btn small" onClick={() => play(i)}><IconPlay width={16} /> {w}</button>)}
              </div>
              <div className="faint small">{note.extra}</div>
            </>
          )}
        </>
      );
    }
    case 'sound':
    case 'spelling': {
      const lesson = s.pack.sounds.find(l => l.id === note.ref);
      const ex = lesson?.examples[(card.reps + 1) % Math.max(1, lesson.examples.length)];
      const marked = ex ? (() => {
        const k = ex.word.indexOf(ex.mark);
        return k < 0 ? ex.word : <>{ex.word.slice(0, k)}<span className="mark">{ex.mark}</span>{ex.word.slice(k + ex.mark.length)}</>;
      })() : null;
      const soundSide = (
        <>
          <div className="word">{lesson?.ipa ?? note.ipa}</div>
          {ex && <AudioButton text={ex.word} auto={card.tmpl === 'spelling' || revealed} label={card.tmpl === 'spelling' ? 'Hear it in a word' : ex.word} />}
        </>
      );
      const spellSide = (
        <>
          <div className="chips" style={{ justifyContent: 'center' }}>{(lesson?.spellings ?? []).map(sp => <span key={sp} className="chip">{sp}</span>)}</div>
          {ex && <div className="word l">{marked}</div>}
        </>
      );
      return (
        <>
          <div className="prompt">{card.tmpl === 'sound' ? 'How do these letters sound?' : 'Which letters spell this sound?'}</div>
          {card.tmpl === 'sound' ? spellSide : soundSide}
          {revealed && (
            <>
              <div className="divider" />
              {card.tmpl === 'sound' ? soundSide : spellSide}
              {lesson && <div className="small muted" style={{ maxWidth: '40ch', textAlign: 'left' }}>{lesson.english}</div>}
              <div className="faint tiny">{note.word}</div>
            </>
          )}
        </>
      );
    }
  }
}

export function Review() {
  const s = useStore();
  const now = useNow(10_000);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [served, setServed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fxKey, setFxKey] = useState(0);
  const [pair, setPair] = useState<{ target: number; picked: number | null }>({ target: 0, picked: null });
  const shownAt = useRef(Date.now());
  const lastAnswered = useRef<string | undefined>(undefined);

  const queue = useMemo(() => buildQueue(s, s.now()), [s, s.version, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = { l: queue.learning.filter(c => c.due <= s.now() + 20 * 60_000).length, r: queue.review.length, n: queue.fresh.length };

  // Choose the next card whenever there's none on screen.
  const pickNext = (skip?: string) => {
    const q = buildQueue(s, s.now());
    const { card } = nextCard(q, s.now(), served, skip);
    setCurrentId(card?.id ?? null);
    setRevealed(false);
    setTyped('');
    setVerdict(null);
    setPair({ target: Math.random() < 0.5 ? 0 : 1, picked: null });
    shownAt.current = Date.now();
  };
  useEffect(() => {
    if (!currentId) pickNext(lastAnswered.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, now]);
  useEffect(() => () => stopAudio(), []);

  const card = currentId ? s.cards.get(currentId) : undefined;
  const note = card ? s.notes.get(card.noteId) : undefined;

  // Minimal pairs: play the mystery word as soon as the card appears.
  useEffect(() => {
    if (card?.tmpl === 'pair' && note) sayWord(note.word.split('|')[pair.target]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const intervals = useMemo(() => (card ? preview(card, s.now(), s.settings.sched, seedOf(card.id)) : null), [card, s]);

  const reveal = () => {
    if (!card || !note || revealed) return;
    if (card.tmpl === 'spell' || card.tmpl.startsWith('cloze') || (card.tmpl === 'recall' && s.settings.typeRecall)) {
      const expected = card.tmpl === 'recall' ? fullWord(note) : card.tmpl === 'spell' ? note.word : parseCloze(note.word).filter(p => p.t === 'cloze' && p.n === Number(card.tmpl.slice(5))).map(p => (p as { answer: string }).answer).join(' ');
      setVerdict(typed.trim() ? check(typed, expected) : 'empty');
    }
    setRevealed(true);
    setFxKey(k => k + 1);
  };

  const answer = (r: Rating) => {
    if (!card || !revealed) return;
    s.answer(card.id, r, Date.now() - shownAt.current);
    lastAnswered.current = card.id;
    setServed(n => n + 1);
    setCurrentId(null);
    stopAudio();
  };

  const onPick = (i: number) => {
    setPair(p => ({ ...p, picked: i }));
    setRevealed(true);
  };

  const undo = () => {
    const c = s.undo();
    if (c) {
      setCurrentId(c.id);
      setRevealed(false);
      setTyped('');
      setVerdict(null);
      shownAt.current = Date.now();
    }
  };

  const suggested: Rating | null = card?.tmpl === 'pair' && revealed ? (pair.picked === pair.target ? 3 : 1)
    : verdict === 'wrong' ? 1 : verdict === 'accents' || verdict === 'close' ? 2 : null;

  useKeys({
    Space: () => (revealed ? answer(suggested ?? 3) : reveal()),
    Enter: () => (revealed ? answer(suggested ?? 3) : reveal()),
    '1': () => answer(1), '2': () => answer(2), '3': () => answer(3), '4': () => answer(4),
    z: undo,
    Escape: () => go('#/today'),
  });

  const header = (
    <div className="session-top">
      <a className="icon-btn plain" href="#/today" aria-label="Close"><IconClose /></a>
      <div className="grow center">
        <span className="counts"><span className="l">{counts.l}</span><span className="r">{counts.r}</span><span className="n">{counts.n}</span></span>
      </div>
      <button className="icon-btn plain" onClick={undo} disabled={!s.canUndo} aria-label="Undo last answer"><IconUndo /></button>
      {note && <a className="icon-btn plain" href={`#/browse/${encodeURIComponent(note.id)}`} aria-label="Edit this card"><IconEdit /></a>}
    </div>
  );

  if (!card || !note) {
    const waiting = queue.learning[0];
    const today = s.day();
    return (
      <div className="session">
        {header}
        <div className="flash" style={{ justifyContent: 'center' }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2>{waiting ? 'Done for now' : 'All caught up'}</h2>
          <p className="muted">
            {today.reviews + today.newCards} cards today
            {waiting ? ` · ${queue.learning.length} still learning, next in ${formatInterval(Math.max(60_000, waiting.due - s.now()))}` : ''}
          </p>
          {waiting && <button className="btn" onClick={() => pickNext()}>Study the learning cards now</button>}
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <a className="btn primary" href="#/today">Back to today</a>
            <a className="btn" href="#/study">Make more cards</a>
          </div>
        </div>
      </div>
    );
  }

  const isPair = card.tmpl === 'pair';
  return (
    <div className="session">
      {header}
      <div className="flash" onClick={() => !revealed && !isPair && !card.tmpl.startsWith('cloze') && card.tmpl !== 'spell' && !s.settings.typeRecall && reveal()}>
        {card.state === State.New && <span className="badge info">New</span>}
        <Face note={note} card={card} revealed={revealed} fxKey={fxKey} typed={typed} setTyped={setTyped} verdict={verdict}
          onSubmit={reveal} pair={pair} onPick={onPick} />
      </div>
      {!revealed ? (
        !isPair && <button className="btn primary big block reveal-btn" onClick={reveal}>Show answer <span className="kbd" style={{ marginLeft: 6 }}>space</span></button>
      ) : (
        <div className="answer-bar">
          {([1, 2, 3, 4] as Rating[]).map(r => (
            <button key={r} className={`grade g${r}`} onClick={() => answer(r)} style={suggested === r ? { outline: '3px solid currentColor' } : undefined}>
              {['Again', 'Hard', 'Good', 'Easy'][r - 1]}
              <small>{intervals ? formatInterval(intervals[r]) : ''}</small>
            </button>
          ))}
        </div>
      )}
      {card.tmpl.startsWith('cloze') && revealed && <button className="btn small ghost" style={{ marginTop: 8 }} onClick={() => speak(plainText(note.word), 0.75)}>Slower</button>}
    </div>
  );
}
