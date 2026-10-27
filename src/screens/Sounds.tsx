import { useMemo } from 'react';
import { AudioButton } from '../components/media';
import { Recorder } from '../components/Recorder';
import { Bar, toast, TopBar } from '../components/ui';
import { transcribe } from '../content';
import { useStore } from '../lib/hooks';
import { buildPair, buildSound } from '../lib/notes';

export function Sounds() {
  const s = useStore();
  const pack = s.pack;
  const done = useMemo(() => new Set(s.liveNotes('sound').map(n => n.ref)), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = pack.sounds.find(l => !done.has(l.id));
  const stats = (id: string) => s.get<{ n: number; ok: number }>(`drill:${pack.code}:${id}`);

  return (
    <div>
      <TopBar title="Pronunciation" back="#/study" />
      <div className="card stack">
        <div className="row between">
          <div><span className="big-num">{done.size}</span> <span className="muted">of {pack.sounds.length} sounds learned</span></div>
        </div>
        <Bar value={done.size / pack.sounds.length} />
        <div className="row wrap">
          {next && <a className="btn primary" href={`#/sounds/${next.id}`}>Next: {next.title}</a>}
          <a className="btn" href="#/sounds/drill">Ear training drill</a>
        </div>
      </div>

      <div className="card tint" style={{ marginTop: 14 }}>
        <p className="small muted" style={{ margin: 0 }}>
          <b>Why first?</b> If you can’t hear a difference, you can’t remember it. Minimal pairs (pero / perro) retrain your ears in a few
          weeks; then you learn how each sound is spelled, so every word after this arrives with its pronunciation built in.
        </p>
      </div>

      <div className="section-title">Sounds</div>
      <div className="stack tight">
        {pack.sounds.map(l => (
          <a key={l.id} className="card link row" href={`#/sounds/${l.id}`} style={{ padding: '12px 14px' }}>
            <span className={`badge ${done.has(l.id) ? 'ok' : ''}`} style={{ minWidth: 30, justifyContent: 'center' }}>{done.has(l.id) ? '✓' : l.order}</span>
            <div className="grow">
              <div style={{ fontWeight: 650 }}>{l.title}</div>
              <div className="faint small">{l.spellings.join(' · ')}</div>
            </div>
            <span className="ipa" style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>{l.ipa}</span>
          </a>
        ))}
      </div>

      <div className="section-title">Minimal pairs</div>
      <div className="stack tight">
        {pack.pairs.map(p => {
          const st = stats(p.id);
          return (
            <a key={p.id} className="card link row" href={`#/sounds/drill/${p.id}`} style={{ padding: '12px 14px' }}>
              <div className="grow">
                <div style={{ fontWeight: 650 }}>{p.contrast}</div>
                <div className="faint small">{p.pairs.slice(0, 3).map(x => x.join(' / ')).join(' · ')}</div>
              </div>
              {st && <span className={`badge ${st.ok / st.n >= 0.9 ? 'ok' : st.ok / st.n >= 0.7 ? 'warn' : 'bad'}`}>{Math.round((st.ok / st.n) * 100)}%</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Marked({ word, mark }: { word: string; mark: string }) {
  const k = word.indexOf(mark);
  if (k < 0) return <>{word}</>;
  return <>{word.slice(0, k)}<span className="mark">{mark}</span>{word.slice(k + mark.length)}</>;
}

export function SoundLessonView({ id }: { id: string }) {
  const s = useStore();
  const pack = s.pack;
  const lesson = pack.sounds.find(l => l.id === id);
  if (!lesson) return <div><TopBar title="Not found" back="#/sounds" /></div>;
  const added = !!s.noteByRef('sound', lesson.id);
  const sets = pack.pairs.filter(p => p.lessons.includes(lesson.id));
  const next = pack.sounds.find(l => l.order > lesson.order && !s.noteByRef('sound', l.id));

  const add = () => {
    const now = s.now();
    s.addBuilt(buildSound(pack, lesson, now, s.nextOrder()), 'sound');
    let n = 0;
    for (const set of sets) {
      set.pairs.forEach((_, i) => {
        if (!s.noteByRef('pair', `${set.id}.${i}`)) {
          s.addBuilt(buildPair(pack, set, i, now, s.nextOrder()));
          n++;
        }
      });
    }
    toast(`Added: 2 sound cards${n ? ` and ${n} minimal-pair cards` : ''}.`);
  };

  return (
    <div className="stack loose">
      <TopBar title={lesson.title} back="#/sounds" right={<span className="badge">{lesson.order}/{pack.sounds.length}</span>} />

      <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="word serif" style={{ fontSize: 48, fontWeight: 600 }}>{lesson.ipa}</div>
        <div className="chips" style={{ justifyContent: 'center' }}>{lesson.spellings.map(sp => <span key={sp} className="chip">{sp}</span>)}</div>
      </div>

      <section className="stack">
        <h2>Compared with English</h2>
        <p style={{ margin: 0 }}>{lesson.english}</p>
      </section>
      <section className="stack">
        <h2>How to make it</h2>
        <p style={{ margin: 0 }}>{lesson.howTo}</p>
        {lesson.pitfalls && <div className="notice warn"><b>Watch out:</b> {lesson.pitfalls}</div>}
      </section>

      <section className="stack">
        <h2>Listen and repeat</h2>
        <p className="small muted" style={{ margin: 0 }}>Play each word, say it out loud, then record yourself and compare.</p>
        <div className="list card flat" style={{ padding: '0 14px' }}>
          {lesson.examples.map(e => (
            <div key={e.word} className="item stack tight">
              <div className="row">
                <AudioButton text={e.word} size="mini" />
                <div className="grow serif" style={{ fontSize: 22, fontWeight: 600 }}><Marked word={e.word} mark={e.mark} /></div>
                <span className="faint small" style={{ fontFamily: 'var(--mono)' }}>[{transcribe(pack.code, e.word)}]</span>
              </div>
              <Recorder word={e.word} />
            </div>
          ))}
        </div>
      </section>

      {sets.length > 0 && (
        <section className="stack">
          <h2>Train your ears</h2>
          {sets.map(set => (
            <a key={set.id} className="card link row" href={`#/sounds/drill/${set.id}`}>
              <div className="grow">
                <b>{set.contrast}</b>
                <div className="faint small">{set.pairs.slice(0, 4).map(p => p.join(' / ')).join(' · ')}</div>
                {set.note && <div className="small muted" style={{ marginTop: 4 }}>{set.note}</div>}
              </div>
              <span className="btn small">Drill</span>
            </a>
          ))}
        </section>
      )}

      <div className="stack tight">
        {added ? (
          <>
            <div className="notice ok">These sounds are in your deck. They’ll come back in your reviews.</div>
            {next && <a className="btn primary big block" href={`#/sounds/${next.id}`}>Next sound: {next.title}</a>}
          </>
        ) : (
          <button className="btn primary big block" onClick={add}>Add this sound to my cards</button>
        )}
      </div>
    </div>
  );
}
