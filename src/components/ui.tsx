import { useEffect, useState, type ReactNode } from 'react';
import { IconBack, IconClose, IconExternal } from './icons';

export function TopBar({ title, back, right }: { title: ReactNode; back?: string | (() => void); right?: ReactNode }) {
  const onBack = () => {
    if (typeof back === 'function') back();
    else if (back) location.hash = back;
    else history.back();
  };
  return (
    <div className="topbar">
      {back !== undefined && (
        <button className="back" onClick={onBack} aria-label="Back">
          <IconBack width={24} height={24} />
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </div>
  );
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="grab" />
        {title && (
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2>{title}</h2>
            <button className="icon-btn plain" onClick={onClose} aria-label="Close"><IconClose /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ---- toasts -------------------------------------------------------------------

let toastListeners: ((msg: string) => void)[] = [];
export function toast(msg: string) {
  toastListeners.forEach(l => l(msg));
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (m: string) => {
      setMsg(m);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2600);
    };
    toastListeners.push(on);
    return () => { toastListeners = toastListeners.filter(l => l !== on); };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

// ---- controls -------------------------------------------------------------------

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
      <span />
    </label>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Bar({ value, ok }: { value: number; ok?: boolean }) {
  return (
    <div className={`bar${ok ? ' ok' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Ring({ value, label, size = 76 }: { value: number; label: ReactNode; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v >= 1 ? 'var(--ok)' : 'var(--accent)'} strokeWidth={8}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <b>{label}</b>
    </div>
  );
}

export function Ext({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} <IconExternal width={14} height={14} style={{ verticalAlign: '-2px' }} />
    </a>
  );
}

export function Spinner() {
  return <div className="spinner" aria-label="Loading" />;
}

/** Paragraphs from plain text; lines starting with two spaces or containing ' · ' render as table lines. */
export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split(/\n\s*\n/).map((para, i) => {
        const lines = para.split('\n');
        if (lines.length > 1 && lines.every(l => /·|\||^\s{2}|→|=/.test(l) || l.trim() === '')) {
          return <div key={i} style={{ margin: '0 0 12px' }}>{lines.map((l, j) => <span key={j} className="table-line">{l.trim()}</span>)}</div>;
        }
        return <p key={i}>{lines.map((l, j) => (j ? [<br key={j} />, l] : l))}</p>;
      })}
    </div>
  );
}

export function confirmAction(msg: string): boolean {
  return window.confirm(msg);
}
