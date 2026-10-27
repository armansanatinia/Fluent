import { useEffect, useRef, useState } from 'react';
import { fileToImage, googleImages, keepImage, pasteImage, searchImages, type ImageHit } from '../lib/images';
import { IconClipboard, IconSearch, IconUpload } from './icons';
import { CardImage } from './media';
import { Ext, Spinner, toast } from './ui';

const memo = new Map<string, ImageHit[]>();

interface Props {
  /** Starting search, usually the English concept. */
  query: string;
  /** Other searches offered as chips (e.g. the Spanish word). */
  alternatives?: string[];
  value?: string;
  /** The built-in picture (emoji or drawing), offered as a choice. */
  fallback?: string;
  onChange: (image: string | undefined, credit?: string) => void;
}

export function ImagePicker({ query, alternatives = [], value, fallback, onChange }: Props) {
  const [q, setQ] = useState(query);
  const [hits, setHits] = useState<ImageHit[]>([]);
  const [page, setPage] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [saving, setSaving] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (text: string, p = 1) => {
    const t = text.trim();
    if (!t) return;
    const key = `${t}#${p}`;
    setState('loading');
    try {
      const res = memo.get(key) ?? (await searchImages(t, p));
      memo.set(key, res);
      setHits(prev => (p === 1 ? res : [...prev, ...res]));
      setPage(p);
      setState('idle');
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    setQ(query);
    setHits([]);
    run(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pick = async (h: ImageHit) => {
    setSaving(h.id);
    const img = await keepImage(h.full).catch(() => h.full);
    setSaving(null);
    onChange(img, h.credit);
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    try {
      onChange(await fileToImage(f), 'Your picture');
    } catch {
      toast('That file could not be read as a picture.');
    }
  };

  const onPaste = async () => {
    const img = await pasteImage();
    if (img) onChange(img, 'Pasted');
    else toast('Copy a picture (or its address) first, then tap Paste.');
  };

  return (
    <div className="stack">
      <div className="row top">
        <CardImage image={value} size="md" alt="Chosen picture" />
        <div className="stack tight grow">
          <div className="small muted">Pick the picture that means the most to you. The book says your own choice is what makes it stick.</div>
          <div className="row wrap" style={{ gap: 6 }}>
            <button type="button" className="btn small" onClick={() => fileRef.current?.click()}><IconUpload width={16} /> Upload</button>
            <button type="button" className="btn small" onClick={onPaste}><IconClipboard width={16} /> Paste</button>
            {fallback && value !== fallback && <button type="button" className="btn small" onClick={() => onChange(fallback)}>Use default</button>}
            {value && <button type="button" className="btn small ghost" onClick={() => onChange(undefined)}>Remove</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0])} />
        </div>
      </div>

      <form className="row" onSubmit={e => { e.preventDefault(); run(q); }}>
        <input className="input grow" value={q} onChange={e => setQ(e.target.value)} placeholder="Search pictures" aria-label="Search pictures" />
        <button className="icon-btn" aria-label="Search"><IconSearch /></button>
      </form>
      <div className="chips">
        {[query, ...alternatives].filter((x, i, a) => x && a.indexOf(x) === i).map(a => (
          <button type="button" key={a} className={`chip${a === q ? ' on' : ''}`} onClick={() => { setQ(a); run(a); }}>{a}</button>
        ))}
        <Ext href={googleImages(alternatives[0] ?? q)} className="chip">Google Images</Ext>
      </div>

      {state === 'error' && <div className="notice warn">Picture search isn’t reachable right now. Upload or paste a picture instead, or try again later.</div>}
      <div className="picker-grid">
        {hits.map(h => (
          <button type="button" key={h.id} onClick={() => pick(h)} title={h.credit || h.title} className={saving === h.id ? 'on' : ''}>
            <img src={h.thumb} alt={h.title} loading="lazy" referrerPolicy="no-referrer" />
            {saving === h.id && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.6)' }}><Spinner /></div>}
          </button>
        ))}
      </div>
      {state === 'loading' && <div className="row" style={{ justifyContent: 'center' }}><Spinner /></div>}
      {state === 'idle' && hits.length > 0 && (
        <button type="button" className="btn small ghost" onClick={() => run(q, page + 1)}>More pictures</button>
      )}
      {state === 'idle' && hits.length === 0 && <div className="faint small center">No pictures yet — search, upload or paste one.</div>}
    </div>
  );
}
