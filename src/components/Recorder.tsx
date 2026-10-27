import { useEffect, useRef, useState } from 'react';
import { sayWord } from '../lib/audio';
import { IconMic, IconPlay, IconStop } from './icons';

/** Record yourself and compare with the native speaker, the book's pronunciation habit. */
export function Recorder({ word, url }: { word: string; url?: string }) {
  const [state, setState] = useState<'idle' | 'rec' | 'ready' | 'blocked'>('idle');
  const [clip, setClip] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip); }, [clip]);

  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = e => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        setClip(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        setState('ready');
      };
      rec.current = r;
      r.start();
      setState('rec');
      setTimeout(() => r.state === 'recording' && r.stop(), 6000);
    } catch {
      setState('blocked');
    }
  };
  const stop = () => rec.current?.state === 'recording' && rec.current.stop();
  const mine = () => clip && new Audio(clip).play();
  const compare = async () => {
    await sayWord(word, url);
    setTimeout(() => mine(), 1400);
  };

  return (
    <div className="row wrap" style={{ gap: 6 }}>
      {state === 'rec' ? (
        <button type="button" className="btn small" style={{ color: 'var(--bad)' }} onClick={stop}><IconStop width={16} /> Stop</button>
      ) : (
        <button type="button" className="btn small" onClick={start}><IconMic width={16} /> {clip ? 'Record again' : 'Record yourself'}</button>
      )}
      {clip && state !== 'rec' && (
        <>
          <button type="button" className="btn small" onClick={mine}><IconPlay width={16} /> You</button>
          <button type="button" className="btn small" onClick={compare}>Native, then you</button>
        </>
      )}
      {state === 'blocked' && <span className="faint small">Microphone access was blocked.</span>}
    </div>
  );
}
