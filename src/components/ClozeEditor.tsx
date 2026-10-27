import { useMemo, useState } from 'react';
import { makeCloze, sentenceWords } from '../lib/cloze';

/**
 * Turn a sentence into a fill-in-the-blank card: tap the word(s) that are new
 * to you — a new word, a new form, a new word order — and give each a hint.
 */
export function ClozeEditor({ initial = '', initialEn = '', onSave, saveLabel = 'Make card' }: { initial?: string; initialEn?: string; onSave: (cloze: string, en: string) => void; saveLabel?: string }) {
  const [text, setText] = useState(initial);
  const [en, setEn] = useState(initialEn);
  const [picks, setPicks] = useState<Map<number, { n: number; hint?: string }>>(new Map());
  const [together, setTogether] = useState(false);
  const words = useMemo(() => sentenceWords(text), [text]);

  const toggle = (i: number) => {
    setPicks(prev => {
      const next = new Map(prev);
      if (next.has(i)) next.delete(i);
      else {
        const used = new Set([...next.values()].map(p => p.n));
        const n = together ? 1 : [1, 2, 3].find(k => !used.has(k));
        if (!n) return prev;
        next.set(i, { n });
      }
      return next;
    });
  };
  const setHint = (i: number, hint: string) => setPicks(prev => new Map(prev).set(i, { ...prev.get(i)!, hint: hint || undefined }));

  const effective = useMemo(() => {
    if (!together) return picks;
    return new Map([...picks].map(([k, v]) => [k, { ...v, n: 1 }]));
  }, [picks, together]);

  const save = () => {
    if (!effective.size) return;
    onSave(makeCloze(text.trim(), effective), en.trim());
    setPicks(new Map());
    setText('');
    setEn('');
  };

  return (
    <div className="stack">
      <label className="field"><span>Sentence</span>
        <textarea className="textarea" style={{ minHeight: 70 }} value={text} onChange={e => { setText(e.target.value); setPicks(new Map()); }} placeholder="Ayer fuimos a la playa con mis primos." />
      </label>
      {words.length > 0 && (
        <>
          <div className="small muted">Tap what’s new for you. Each blank becomes a card (up to three).</div>
          <div className="chips">
            {words.map((w, i) => (
              <button key={i} type="button" className={`chip${picks.has(i) ? ' on' : ''}`} onClick={() => toggle(i)}>
                {w}{picks.has(i) && !together ? <sup style={{ marginLeft: 2 }}>{picks.get(i)!.n}</sup> : null}
              </button>
            ))}
          </div>
          <label className="row small muted" style={{ gap: 8 }}>
            <input type="checkbox" checked={together} onChange={e => setTogether(e.target.checked)} /> All blanks on one card (for a phrase)
          </label>
          {[...picks.keys()].sort((a, b) => a - b).map(i => (
            <label key={i} className="field"><span>Hint for “{words[i]}” (base form or a cue)</span>
              <input className="input" value={picks.get(i)?.hint ?? ''} onChange={e => setHint(i, e.target.value)} placeholder="e.g. ir, pasado" />
            </label>
          ))}
        </>
      )}
      <label className="field"><span>Meaning in English (optional, hidden on the card)</span>
        <input className="input" value={en} onChange={e => setEn(e.target.value)} />
      </label>
      <button type="button" className="btn primary" disabled={!effective.size} onClick={save}>{saveLabel}</button>
    </div>
  );
}
