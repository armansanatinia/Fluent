import { useEffect, useState } from 'react';
import { findRecordings, playUrl, speak, type Recording } from '../lib/audio';
import { store } from '../lib/store';
import { IconPlay } from './icons';
import { Ext } from './ui';

/** Native recordings of a word, to choose the one used on its cards. */
export function Recordings({ word, value, onChange }: { word: string; value?: string; onChange: (r: Recording | null) => void }) {
  const [list, setList] = useState<Recording[] | null>(null);
  useEffect(() => {
    let live = true;
    setList(null);
    if (word.includes(' ')) { setList([]); return; }
    findRecordings(word).then(l => {
      if (!live) return;
      setList(l);
      if (!value && l[0]) onChange(l[0]);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const prefs = store.get<{ prefer: string[]; avoid: string[] }>('audio:speakers') ?? { prefer: [], avoid: [] };
  const avoid = (r: Recording) => {
    store.set('audio:speakers', { prefer: prefs.prefer.filter(p => p !== r.speaker), avoid: [...new Set([...prefs.avoid, r.speaker])] });
    const rest = (list ?? []).filter(x => x.speaker !== r.speaker);
    setList(rest);
    onChange(rest[0] ?? null);
  };

  return (
    <div className="stack tight">
      <div className="row wrap" style={{ gap: 6 }}>
        {list === null && <span className="faint small">Looking for native recordings…</span>}
        {list?.map(r => (
          <button key={r.file} type="button" className={`chip${value === r.url ? ' on' : ''}`} onClick={() => { onChange(r); playUrl(r.url); }}>
            <IconPlay width={14} /> {r.speaker}
          </button>
        ))}
        <button type="button" className={`chip${!value && list !== null ? ' on' : ''}`} onClick={() => { onChange(null); speak(word); }}>
          <IconPlay width={14} /> Device voice
        </button>
      </div>
      {list && list.length === 0 && <div className="faint small">No native recording found, so the device’s Spanish voice is used. Check it on <Ext href={`https://forvo.com/word/${encodeURIComponent(word)}/#es`}>Forvo</Ext>.</div>}
      {list && list.length > 0 && value && (
        <div className="faint tiny">
          Recordings from Lingua Libre (CC BY-SA). Not from Spain or sounds off?{' '}
          <button type="button" className="btn small ghost" style={{ minHeight: 24, padding: '0 6px' }} onClick={() => { const r = list.find(x => x.url === value); if (r) avoid(r); }}>Skip this speaker</button>
        </div>
      )}
    </div>
  );
}
