import { useMemo } from 'react';
import { useStore } from '../lib/hooks';
import { planCounts } from '../lib/progress';
import { buildQueue } from '../lib/queue';
import { phases } from '../lib/plan';

function Tile({ href, emoji, title, text, right }: { href: string; emoji: string; title: string; text: string; right?: React.ReactNode }) {
  return (
    <a className="card link tile" href={href}>
      <div className="emoji" aria-hidden="true">{emoji}</div>
      <div className="grow">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {right}
    </a>
  );
}

export function Study() {
  const s = useStore();
  const q = useMemo(() => buildQueue(s), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const c = useMemo(() => planCounts(s), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const ph = phases(s.pack, s.settings, c);
  const pack = s.pack;
  const sentences = pack.grammar.reduce((n, t) => n + t.sentences.length, 0);
  const on = (id: string) => ph.find(p => p.id === id);
  const tag = (id: string) => {
    const p = on(id);
    return p?.done ? <span className="badge ok">Done</span> : p?.active ? <span className="badge accent">Now</span> : null;
  };

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Study</h1>
      <div className="stack">
        <a className="card link tile" href="#/review" style={{ borderColor: 'var(--accent)' }}>
          <div className="emoji">🔁</div>
          <div className="grow">
            <h3>Review flashcards</h3>
            <p>Spaced repetition: each card returns just before you’d forget it.</p>
          </div>
          <span className="counts"><span className="l">{q.learning.length}</span><span className="r">{q.review.length}</span><span className="n">{q.fresh.length}</span></span>
        </a>

        <div className="section-title">The method, in order</div>
        <Tile href="#/sounds" emoji="👂" title="1 · Pronunciation" text={`Ear training with minimal pairs, and how each sound is spelled. ${c.soundsMade}/${pack.sounds.length} sounds.`} right={tag('sounds')} />
        <Tile href="#/words" emoji="🖼️" title="2 · Base words (“Your first 625”)" text={`Pictures, real audio and the gender trick. ${c.wordsMade}/${pack.words.length} words.`} right={tag('words')} />
        <Tile href="#/grammar" emoji="🧩" title="3 · Grammar through sentences" text={`${pack.grammar.length} topics, ${sentences} example sentences to turn into cards. ${c.sentencesMade} made.`} right={tag('grammar')} />
        <Tile href="#/vocab" emoji="📖" title="4 · Vocabulary expansion" text={`Frequent and abstract words with Spanish definitions. ${c.vocabMade}/${pack.vocab.length}.`} right={tag('vocab')} />

        <div className="section-title">Output and your own material</div>
        <Tile href="#/write" emoji="✍️" title="Writing journal" text="Write, get corrected, turn the corrections into cards." />
        <Tile href="#/inbox" emoji="📥" title="Word inbox" text={`Words you meet with tutors, in books and on TV. ${c.inboxOpen} waiting.`} />
        <Tile href="#/sounds/drill" emoji="🎧" title="Ear training drill" text="Twenty quick rounds of minimal pairs." />
        <Tile href="#/browse" emoji="🗂️" title="Browse your cards" text="Search, edit pictures and memories, suspend or reset cards." />
      </div>
    </div>
  );
}
