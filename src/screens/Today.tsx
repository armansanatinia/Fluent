import { useMemo, useState } from 'react';
import { IconExternal, IconNext, IconPlus, IconTrash } from '../components/icons';
import { Bar, Ring } from '../components/ui';
import { useStore } from '../lib/hooks';
import type { PlanItem } from '../lib/plan';
import { todayPlan } from '../lib/progress';
import { streak } from '../lib/stats';
import { prettyDate } from '../lib/time';

function needsBackup(s: ReturnType<typeof useStore>): boolean {
  if (s.device.syncToken) return false;
  if (s.notes.size < 30) return false;
  let last = 0;
  try { last = Number(localStorage.getItem('fluent.lastBackup')) || 0; } catch { /* ignore */ }
  return Date.now() - last > 7 * 86_400_000;
}

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

function Task({ item }: { item: PlanItem }) {
  const s = useStore();
  const manual = !!s.day().checks[item.id];
  const lockedDone = item.auto && item.done && !manual;
  return (
    <div className={`task${item.done ? ' done' : ''}`}>
      <input
        type="checkbox"
        className="check"
        checked={item.done}
        disabled={lockedDone}
        title={lockedDone ? 'Done — ticked automatically' : item.auto ? 'Tick if you did this another way' : 'Tick when done'}
        onChange={() => s.setCheck(item.id, !manual)}
        aria-label={item.title}
      />
      <div className="task-body">
        <div className="task-title">{item.title}</div>
        {item.detail && <div className="task-detail">{item.detail}</div>}
        {item.progress && item.progress.total > 0 && !item.done && <Bar value={item.progress.done / item.progress.total} />}
        <div className="task-meta">
          {item.minutes > 0 && <span className="badge">~{item.minutes} min</span>}
          {item.section === 'outside' && <span className="badge info">Outside the app</span>}
          {item.progress && item.progress.total > 0 && <span className="badge">{item.progress.done}/{item.progress.total}</span>}
        </div>
      </div>
      {item.route && (
        <a className="icon-btn go" href={item.route} aria-label={`Open ${item.title}`}><IconNext /></a>
      )}
      {item.url && (
        <a className="icon-btn go" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} in a new tab`}><IconExternal /></a>
      )}
      {item.section === 'custom' && (
        <button className="icon-btn plain go" onClick={() => s.removeCustomItem(item.id)} aria-label="Remove"><IconTrash /></button>
      )}
    </div>
  );
}

export function Today() {
  const s = useStore();
  const plan = useMemo(() => todayPlan(s), [s, s.version]);
  const st = useMemo(() => streak(s), [s, s.version]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const total = plan.items.length;
  const done = plan.items.filter(i => i.done).length;
  const share = plan.minutes ? (plan.minutes - plan.minutesLeft) / plan.minutes : total ? done / total : 0;
  const next = plan.items.find(i => !i.done && (i.route || i.url));
  const studiedMin = Math.round(s.day().ms / 60000);
  const sections: [PlanItem['section'], string][] = [['app', 'In the app'], ['outside', 'Outside the app'], ['weekly', 'This week'], ['custom', 'Your extras']];
  const active = plan.phases.filter(p => p.active);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const link = url.trim() && !/^https?:\/\//.test(url.trim()) ? `https://${url.trim()}` : url.trim();
    s.addCustomItem(title.trim(), link || undefined);
    setTitle('');
    setUrl('');
    setAdding(false);
  };

  return (
    <div>
      <div className="hero">
        <Ring value={share} label={done === total && total ? '✓' : `${Math.round(share * 100)}%`} />
        <div className="grow">
          <div className="faint small">{prettyDate(plan.day)}</div>
          <h1>{greeting()}</h1>
          <div className="muted small">
            {plan.minutesLeft > 0 ? `About ${plan.minutesLeft} minutes left today` : 'Everything for today is done. ¡Muy bien!'}
          </div>
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <span className="stat-pill">🔥 {st.current} day{st.current === 1 ? '' : 's'}</span>
        <span className="stat-pill">⏱ {studiedMin} min studied</span>
        {active.map(p => <a key={p.id} className="stat-pill" href="#/progress">{p.title}</a>)}
      </div>

      {plan.note && <div className="notice warn" style={{ marginBottom: 14 }}>{plan.note}</div>}
      {needsBackup(s) && (
        <div className="notice" style={{ marginBottom: 14 }}>
          Your cards live only on this device. <a href="#/settings">Set up sync</a> or export a backup in Settings, so nothing is lost.
        </div>
      )}

      {next && (
        next.route ? (
          <a className="btn primary big block" href={next.route} style={{ marginBottom: 18 }}>Start: {next.title}</a>
        ) : (
          <a className="btn primary big block" href={next.url} target="_blank" rel="noopener noreferrer" style={{ marginBottom: 18 }}>Next: {next.title}</a>
        )
      )}

      {sections.map(([sec, label]) => {
        const items = plan.items.filter(i => i.section === sec);
        if (!items.length) return null;
        return (
          <section key={sec}>
            <div className="section-title">{label}</div>
            {items.map(i => <Task key={i.id} item={i} />)}
          </section>
        );
      })}

      <div style={{ marginTop: 14 }}>
        {adding ? (
          <form className="card stack" onSubmit={add}>
            <label className="field"><span>Add something for today</span>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Watch an episode of El Ministerio del Tiempo" autoFocus />
            </label>
            <label className="field"><span>Link (optional)</span>
              <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
            </label>
            <div className="row">
              <button className="btn primary">Add</button>
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="btn ghost" onClick={() => setAdding(true)}><IconPlus width={18} /> Add your own task</button>
        )}
      </div>

      <div className="card tint" style={{ marginTop: 24 }}>
        <div className="small muted">
          <b>How today was built.</b> Reviews first — they protect everything you’ve learned. Then new material for your current phase
          ({active.map(p => p.title.toLowerCase()).join(', ') || 'fluency'}), sized for about {s.settings.minutes} minutes, plus one thing
          outside the app. Change the pace in <a href="#/settings">Settings</a>, or read <a href="#/guide">how to do each part well</a>.
        </div>
      </div>
    </div>
  );
}
