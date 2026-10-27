import { useEffect, useMemo, useState } from 'react';
import { IconClose, IconPlay } from '../components/icons';
import { Bar } from '../components/ui';
import { sayWord } from '../lib/audio';
import { useKeys, useStore } from '../lib/hooks';
import type { MinimalPairSet } from '../content/types';

const ROUNDS = 20;

interface Round {
  pair: [string, string];
  target: 0 | 1;
}

function makeRounds(set: MinimalPairSet): Round[] {
  return Array.from({ length: ROUNDS }, () => ({
    pair: set.pairs[Math.floor(Math.random() * set.pairs.length)],
    target: (Math.random() < 0.5 ? 0 : 1) as 0 | 1,
  }));
}

export function Drill({ setId }: { setId?: string }) {
  const s = useStore();
  const pack = s.pack;
  const statsKey = (id: string) => `drill:${pack.code}:${id}`;

  // Without a set chosen, drill the weakest set among the sounds you've learned.
  const set = useMemo(() => {
    if (setId) return pack.pairs.find(p => p.id === setId) ?? pack.pairs[0];
    const learned = new Set(s.liveNotes('sound').map(n => n.ref));
    const pool = pack.pairs.filter(p => p.lessons.some(l => learned.has(l)));
    const list = pool.length ? pool : pack.pairs;
    const score = (p: MinimalPairSet) => {
      const st = s.get<{ n: number; ok: number }>(statsKey(p.id));
      return st ? st.ok / st.n + Math.min(st.n, 200) / 2000 : -1 + Math.random() * 0.1;
    };
    return [...list].sort((a, b) => score(a) - score(b))[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const [rounds, setRounds] = useState(() => makeRounds(set));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const round = rounds[i];
  const finished = i >= rounds.length;

  useEffect(() => {
    if (round) sayWord(round.pair[round.target]);
  }, [i, round]);

  useEffect(() => {
    if (!finished) return;
    const prev = s.get<{ n: number; ok: number }>(statsKey(set.id)) ?? { n: 0, ok: 0 };
    s.set(statsKey(set.id), { n: prev.n + rounds.length, ok: prev.ok + right });
    s.bump('drill');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const choose = (k: number) => {
    if (picked !== null || !round) return;
    setPicked(k);
    if (k === round.target) setRight(r => r + 1);
  };
  const next = () => {
    setPicked(null);
    setI(n => n + 1);
  };

  useKeys({
    '1': () => choose(0), '2': () => choose(1), ArrowLeft: () => choose(0), ArrowRight: () => choose(1),
    Space: () => (picked !== null ? next() : round && sayWord(round.pair[round.target])),
    Enter: () => picked !== null && next(),
  }, !finished);

  if (finished) {
    const pct = Math.round((right / rounds.length) * 100);
    return (
      <div className="session">
        <div className="session-top"><a className="icon-btn plain" href="#/sounds" aria-label="Close"><IconClose /></a></div>
        <div className="flash" style={{ justifyContent: 'center' }}>
          <div style={{ fontSize: 56 }}>{pct >= 90 ? '🎯' : pct >= 70 ? '👂' : '🌱'}</div>
          <h2>{right} of {rounds.length} right</h2>
          <p className="muted" style={{ maxWidth: '36ch' }}>
            {pct >= 90 ? 'Your ears hear this difference now. Move on to the next contrast.' : pct >= 70 ? 'Getting there. Do this drill again tomorrow.' : 'This is normal at first — your ears are being retrained. Short daily drills work best.'}
          </p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={() => { setRounds(makeRounds(set)); setI(0); setRight(0); }}>Again</button>
            <a className="btn" href="#/sounds">Other drills</a>
            <a className="btn ghost" href="#/today">Today</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session">
      <div className="session-top">
        <a className="icon-btn plain" href="#/sounds" aria-label="Close"><IconClose /></a>
        <div className="grow"><Bar value={i / rounds.length} /></div>
        <span className="small muted nowrap">{i + 1}/{rounds.length}</span>
      </div>
      <div className="flash" style={{ justifyContent: 'center' }}>
        <div className="prompt">{set.contrast}</div>
        <h2>Which word do you hear?</h2>
        <button className="play round" onClick={() => sayWord(round.pair[round.target])} aria-label="Play again"><IconPlay /></button>
        <div className="choices">
          {round.pair.map((w, k) => (
            <button key={k} className={`choice${picked === null ? '' : k === round.target ? ' right' : k === picked ? ' wrong' : ''}`} onClick={() => choose(k)}>{w}</button>
          ))}
        </div>
        {picked !== null && (
          <>
            <div className={`badge ${picked === round.target ? 'ok' : 'bad'}`}>{picked === round.target ? '¡Sí!' : `It was “${round.pair[round.target]}”`}</div>
            <div className="row">
              {round.pair.map((w, k) => <button key={k} className="btn small" onClick={() => sayWord(w)}><IconPlay width={16} /> {w}</button>)}
            </div>
          </>
        )}
      </div>
      {picked !== null && <button className="btn primary big block reveal-btn" onClick={next}>Next</button>}
      <p className="faint small center" style={{ marginTop: 10 }}>Score so far: {right}/{i + (picked !== null ? 1 : 0)}</p>
    </div>
  );
}
