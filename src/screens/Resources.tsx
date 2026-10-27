import { useState } from 'react';
import { IconExternal, IconStar } from '../components/icons';
import { COMING, PACKS } from '../content';
import type { Resource, ResourceCategory } from '../content/types';
import { useStore } from '../lib/hooks';

const CAT: Record<ResourceCategory, string> = {
  pronunciation: 'Pronunciation', dictionary: 'Dictionaries', grammar: 'Grammar', vocabulary: 'Word lists', images: 'Pictures',
  srs: 'Flashcard apps', tutors: 'Tutors', exchange: 'Language exchange', corrections: 'Corrections', podcasts: 'Podcasts',
  youtube: 'YouTube', tv: 'TV & film', reading: 'Reading', news: 'News', tools: 'Tools', courses: 'Courses',
};
const ACCENT: Record<string, string> = { spain: '🇪🇸 Spain', latam: '🌎 Latin America', mixed: 'Mixed accents', neutral: 'Any accent' };

function Item({ r, starred, onStar }: { r: Resource; starred: boolean; onStar: () => void }) {
  return (
    <div className="card stack tight">
      <div className="row between top">
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="grow" style={{ color: 'inherit' }}>
          <b style={{ fontSize: 17 }}>{r.name}</b> <IconExternal width={14} height={14} style={{ verticalAlign: '-2px', color: 'var(--ink-3)' }} />
        </a>
        <button className="icon-btn plain" onClick={onStar} aria-pressed={starred} aria-label={starred ? 'Unmark as one you use' : 'Mark as one you use'}
          style={{ color: starred ? 'var(--warn)' : 'var(--ink-3)' }}>
          <IconStar fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className={`badge ${r.cost === 'free' ? 'ok' : r.cost === 'paid' ? 'warn' : 'info'}`}>{r.cost}</span>
        {r.accent && <span className="badge">{ACCENT[r.accent]}</span>}
        {r.level && <span className="badge">{r.level}</span>}
        {r.core && <span className="badge accent">Core kit</span>}
      </div>
      <div className="small">{r.description}</div>
      {r.howTo && <div className="small muted">↳ {r.howTo}</div>}
    </div>
  );
}

export function Resources() {
  const s = useStore();
  const [lang, setLang] = useState(s.settings.lang);
  const pack = PACKS[lang] ?? s.pack;
  const [cat, setCat] = useState<ResourceCategory | 'all' | 'mine'>('all');
  const [free, setFree] = useState(false);
  const [spain, setSpain] = useState(false);
  const starKey = `res:starred:${pack.code}`;
  const starred = new Set(s.get<string[]>(starKey) ?? []);
  const toggle = (id: string) => {
    const next = new Set(starred);
    if (next.has(id)) next.delete(id); else next.add(id);
    s.set(starKey, [...next]);
  };

  const cats = [...new Set(pack.resources.map(r => r.category))];
  const list = pack.resources.filter(r =>
    (cat === 'all' || (cat === 'mine' ? starred.has(r.id) : r.category === cat)) &&
    (!free || r.cost !== 'paid') &&
    (!spain || r.accent === 'spain' || r.accent === 'neutral'));
  const core = list.filter(r => r.core);

  return (
    <div className="stack loose">
      <h1>Resources</h1>
      <div className="chips">
        {Object.values(PACKS).map(p => <button key={p.code} className={`chip${lang === p.code ? ' on' : ''}`} onClick={() => setLang(p.code)}>{p.flag} {p.name}</button>)}
        {COMING.map(c => <span key={c.code} className="chip" style={{ opacity: 0.5, cursor: 'default' }} title="Coming later">{c.flag} {c.name}</span>)}
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Everything you need outside the app to learn {pack.name} the Fluent Forever way. The daily plan links to these — this is the full
        shelf. Star the ones you use.
      </p>

      <div className="stack tight">
        <div className="chips">
          <button className={`chip${cat === 'all' ? ' on' : ''}`} onClick={() => setCat('all')}>All</button>
          <button className={`chip${cat === 'mine' ? ' on' : ''}`} onClick={() => setCat('mine')}>★ Mine ({starred.size})</button>
          {cats.map(c => <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{CAT[c]}</button>)}
        </div>
        <div className="chips">
          <button className={`chip${free ? ' on' : ''}`} onClick={() => setFree(v => !v)}>Free or freemium</button>
          <button className={`chip${spain ? ' on' : ''}`} onClick={() => setSpain(v => !v)}>Spain accent</button>
        </div>
      </div>

      {cat === 'all' && core.length > 0 && (
        <section className="stack">
          <div className="section-title">The core kit</div>
          {core.map(r => <Item key={r.id} r={r} starred={starred.has(r.id)} onStar={() => toggle(r.id)} />)}
        </section>
      )}

      {(cat === 'all' ? cats : [null]).map(c => {
        const items = list.filter(r => (c ? r.category === c : true) && (cat !== 'all' || !r.core));
        if (!items.length) return null;
        return (
          <section key={c ?? 'x'} className="stack">
            {c && <div className="section-title">{CAT[c]}</div>}
            {items.map(r => <Item key={r.id} r={r} starred={starred.has(r.id)} onStar={() => toggle(r.id)} />)}
          </section>
        );
      })}
      {list.length === 0 && <div className="empty">Nothing matches these filters.</div>}
    </div>
  );
}
