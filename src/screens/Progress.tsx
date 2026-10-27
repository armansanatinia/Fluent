import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '../components/BarChart';
import { Bar } from '../components/ui';
import { useStore } from '../lib/hooks';
import { answered, type ReviewLog } from '../lib/model';
import { phases } from '../lib/plan';
import { planCounts } from '../lib/progress';
import { cardCounts, forecast, lastDays, retention, streak, totalMinutes } from '../lib/stats';
import { addDays, DAY, weekday } from '../lib/time';

const short = (key: string) => {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}`;
};

export function Progress() {
  const s = useStore();
  const pack = s.pack;
  const [logs, setLogs] = useState<ReviewLog[] | null>(s.revlog);
  useEffect(() => { s.loadRevlog().then(l => setLogs([...l])); }, [s, s.version]);

  const c = useMemo(() => planCounts(s), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const ph = phases(pack, s.settings, c);
  const cards = useMemo(() => cardCounts(s), [s, s.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const st = streak(s);
  const days = lastDays(s, 30);
  const fc = forecast(s, 14);
  const ret = logs ? retention(logs, s.now() - 30 * DAY) : null;
  const minutes = totalMinutes(s);
  const today = s.today();

  // Heatmap: 18 weeks, Monday-first columns.
  const heat = useMemo(() => {
    const end = today;
    const offset = (weekday(end) + 6) % 7; // days since Monday
    const start = addDays(end, -(17 * 7 + offset));
    const out: { day: string; n: number }[] = [];
    for (let i = 0; i < 18 * 7; i++) {
      const day = addDays(start, i);
      const d = s.days.get(day);
      out.push({ day, n: day > end ? -1 : answered(d) });
    }
    return out;
  }, [s, s.version, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const level = (n: number) => (n < 0 ? undefined : n === 0 ? '0' : n < 20 ? '1' : n < 60 ? '2' : n < 120 ? '3' : '4');

  return (
    <div className="stack loose">
      <h1>Progress</h1>

      <div className="kpis">
        <div className="kpi"><small>Streak</small><div className="big-num">{st.current}<span className="small faint"> day{st.current === 1 ? '' : 's'}</span></div><div className="faint tiny">Best {st.best}</div></div>
        <div className="kpi"><small>Known well</small><div className="big-num">{cards.mature}</div><div className="faint tiny">cards ≥ 3 weeks apart</div></div>
        <div className="kpi"><small>Remembered</small><div className="big-num">{ret?.rate != null ? `${Math.round(ret.rate * 100)}%` : '—'}</div><div className="faint tiny">reviews, last 30 days</div></div>
        <div className="kpi"><small>Time</small><div className="big-num">{minutes >= 120 ? `${Math.round(minutes / 60)}h` : `${minutes}m`}</div><div className="faint tiny">in flashcards</div></div>
      </div>

      <section className="card">
        <h2 style={{ marginBottom: 6 }}>Your roadmap</h2>
        <p className="small muted">The book’s order. Phases overlap: base words start during pronunciation, and grammar joins after {s.settings.grammarStartAt} words.</p>
        {ph.map((p, i) => (
          <div key={p.id} className={`phase${p.active ? ' active' : ''}${p.done ? ' done' : ''}`}>
            <div className="n">{p.done ? '✓' : i + 1}</div>
            <div className="grow stack tight">
              <div className="row between"><b>{p.title}</b>{p.active && <span className="badge accent">Now</span>}</div>
              <div className="small muted">{p.blurb}</div>
              <Bar value={p.progress} ok={p.done} />
              <div className="faint small">{p.detail}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Cards studied per day</h2>
        <p className="faint small" style={{ margin: '2px 0 8px' }}>Last 30 days, reviews plus new cards</p>
        <BarChart data={days.map(d => ({ label: short(d.day), value: d.reviews }))} unit="cards" highlightLast />
      </section>

      <section className="card">
        <h2>Coming up</h2>
        <p className="faint small" style={{ margin: '2px 0 8px' }}>Cards due over the next two weeks</p>
        <BarChart data={fc.map((n, i) => ({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : short(addDays(today, i)), value: n }))} unit="due" />
      </section>

      <section className="card">
        <h2>Study calendar</h2>
        <p className="faint small" style={{ margin: '2px 0 10px' }}>Each square is a day; darker means more cards.</p>
        <div className="heat" style={{ gridTemplateColumns: 'repeat(18, 1fr)' }}>
          {heat.map(h => <i key={h.day} data-l={level(h.n)} title={h.n >= 0 ? `${short(h.day)}: ${h.n} cards` : ''} style={h.n < 0 ? { visibility: 'hidden' } : undefined} />)}
        </div>
      </section>

      <section className="card">
        <h2>Your deck</h2>
        <div className="list" style={{ marginTop: 6 }}>
          {[
            ['New, not yet studied', cards.new], ['Learning', cards.learning], ['Young (under 3 weeks)', cards.young],
            ['Mature (3 weeks +)', cards.mature], ['Suspended', cards.suspended],
          ].map(([l, n]) => (
            <div key={l as string} className="item row between"><span>{l}</span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</b></div>
          ))}
        </div>
        <div className="faint small" style={{ marginTop: 8 }}>
          {c.wordsMade} base words · {c.sentencesMade} grammar sentences · {c.vocabMade} vocabulary words · {s.liveNotes('custom').length} of your own
        </div>
      </section>
    </div>
  );
}
