import { useEffect, useRef, useState } from 'react';

export interface Bar {
  label: string;
  value: number;
}

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** One series of columns: 4px rounded caps, hairline grid, hover/tap for values, table view. */
export function BarChart({ data, unit, height = 150, highlightLast }: { data: Bar[]; unit: string; height?: number; highlightLast?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  // Draw at the real pixel width so labels stay readable on a phone.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const left = 34;
  const bottom = 22;
  const top = 8;
  const max = niceMax(Math.max(1, ...data.map(d => d.value)));
  const band = (W - left) / data.length;
  const bw = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const shown = active ?? (highlightLast ? data.length - 1 : null);

  return (
    <div className="chart-box" ref={box}>
      <div className="chart-tip">{shown !== null ? <><b>{data[shown].value}</b> {unit} · {data[shown].label}</> : 'Tap a column for its value'}</div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} per day`} onPointerLeave={() => setActive(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line className="grid" x1={left} x2={W} y1={y(t)} y2={y(t)} />
            <text x={left - 6} y={y(t) + 4} textAnchor="end">{t >= 1000 ? `${t / 1000}K` : t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = left + i * band + (band - bw) / 2;
          const h = Math.max(0, H - bottom - y(d.value));
          const r = Math.min(4, h);
          const yb = H - bottom;
          return (
            <g key={i}>
              {h > 0 && (
                <path className={`barmark${shown !== null && shown !== i ? ' dim' : ''}`}
                  d={`M${x},${yb} V${yb - h + r} Q${x},${yb - h} ${x + r},${yb - h} H${x + bw - r} Q${x + bw},${yb - h} ${x + bw},${yb - h + r} V${yb} Z`} />
              )}
              <rect className="hit" x={left + i * band} y={top} width={band} height={H - top - bottom}
                onPointerEnter={() => setActive(i)} onClick={() => setActive(i)} />
            </g>
          );
        })}
        {[0, Math.floor(data.length / 2), data.length - 1].map(i => (
          <text key={i} x={left + i * band + band / 2} y={H - 6} textAnchor="middle">{data[i]?.label.split(' · ')[0]}</text>
        ))}
      </svg>
      <details className="small" style={{ marginTop: 6 }}>
        <summary className="faint">Show as table</summary>
        <table className="data-table"><tbody>{data.map((d, i) => <tr key={i}><td>{d.label}</td><td>{d.value} {unit}</td></tr>)}</tbody></table>
      </details>
    </div>
  );
}
