import { useEffect, useMemo, useRef, useState } from 'react';
import type { Gender } from '../content/types';
import { sayWord, speak } from '../lib/audio';
import { imageSource } from '../lib/draw';
import type { Effect } from '../lib/model';
import { store } from '../lib/store';
import { IconPlay } from './icons';

// ---- pictures -------------------------------------------------------------

export function CardImage({ image, size, fx, fxKey, alt = '' }: { image?: string; size?: 'xs' | 'sm' | 'md'; fx?: Effect | null; fxKey?: number; alt?: string }) {
  const { src, emoji } = imageSource(image);
  const cls = `pic${size ? ` ${size}` : ''}${!src && !emoji ? ' empty' : ''}${fx && fxKey ? ` fx-${fx}` : ''}`;
  return (
    <div className={cls} key={fx && fxKey ? `fx${fxKey}` : undefined}>
      {src ? <img src={src} alt={alt} loading="lazy" draggable={false} /> : emoji ? <span className="emo" role="img" aria-label={alt}>{emoji}</span> : size ? null : <span>No picture</span>}
      {fx && fxKey ? <GenderFx effect={fx} key={fxKey} /> : null}
    </div>
  );
}

function rnd(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** The gender trick made visible: the picture explodes, burns, freezes… */
export function GenderFx({ effect }: { effect: Effect }) {
  const parts = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ a: rnd(i + 1) * Math.PI * 2, d: 90 + rnd(i + 40) * 140, s: rnd(i + 80) })), []);
  if (!store.settings.animations || effect === 'none') return null;
  switch (effect) {
    case 'explode':
      return (
        <div className="fx" aria-hidden="true">
          <div className="flash" />
          {parts.map((p, i) => (
            <i key={i} className="spark" style={{ ['--dx' as string]: `${Math.cos(p.a) * p.d}px`, ['--dy' as string]: `${Math.sin(p.a) * p.d}px`, animationDelay: `${p.s * 0.12}s`, width: 8 + p.s * 14, height: 8 + p.s * 14 }} />
          ))}
        </div>
      );
    case 'fire':
      return (
        <div className="fx" aria-hidden="true">
          <div className="glow" />
          {parts.slice(0, 9).map((p, i) => (
            <i key={i} className="flame" style={{ left: `${i * 10 + p.s * 6 - 4}%`, animationDelay: `${p.s * 0.35}s`, ['--r' as string]: `${(p.s - 0.5) * 16}deg`, width: `${20 + p.s * 14}%` }} />
          ))}
        </div>
      );
    case 'ice':
      return (
        <div className="fx" aria-hidden="true">
          <div className="frost" />
          {parts.slice(0, 8).map((p, i) => (
            <i key={i} className="crystal" style={{ left: `${10 + p.s * 75}%`, top: `${8 + rnd(i + 7) * 75}%`, animationDelay: `${p.s * 0.3}s` }}>❄</i>
          ))}
        </div>
      );
    case 'shatter':
      return (
        <div className="fx" aria-hidden="true">
          {parts.slice(0, 12).map((p, i) => (
            <i key={i} className="shard" style={{ left: `${(i % 4) * 25}%`, top: `${Math.floor(i / 4) * 33}%`, ['--dx' as string]: `${Math.cos(p.a) * p.d}px`, ['--dy' as string]: `${Math.sin(p.a) * p.d + 80}px`, animationDelay: `${0.15 + p.s * 0.1}s` }} />
          ))}
        </div>
      );
    case 'electric':
      return (
        <div className="fx" aria-hidden="true">
          <svg className="bolt" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M55 0 L35 45 L52 45 L30 100 L75 38 L56 38 L72 0 Z" fill="#ffe94d" stroke="#fff" strokeWidth="1.5" opacity=".95" />
          </svg>
        </div>
      );
    case 'melt':
      return (
        <div className="fx" aria-hidden="true" style={{ color: 'var(--f)' }}>
          {parts.slice(0, 7).map((p, i) => (
            <i key={i} className="drip" style={{ left: `${8 + i * 13}%`, animationDelay: `${p.s * 0.4}s` }} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

// ---- words ----------------------------------------------------------------

export function GenderWord({ word, article, gender, fem, className = '' }: { word: string; article?: string; gender?: Gender; fem?: string; className?: string }) {
  const g = gender === 'm' || gender === 'f' ? gender : '';
  return (
    <span className={`gword ${g} ${className}`}>
      {article && <span className="art">{article}</span>}
      <span className="w">{word}</span>
      {fem && <span className="faint" style={{ fontSize: '0.55em', fontWeight: 500 }}>· {fem}</span>}
    </span>
  );
}

export function GenderTag({ gender }: { gender?: Gender }) {
  if (gender !== 'm' && gender !== 'f') return null;
  const g = store.settings.gender[gender];
  const label = store.pack.genders[gender].label;
  return <span className={`gender-tag ${gender}`}>{g.emoji} {label} · {g.action}</span>;
}

// ---- audio ------------------------------------------------------------------

export function AudioButton({ text, url, sentence, auto, size, label }: { text: string; url?: string; sentence?: boolean; auto?: boolean; size?: 'round' | 'mini'; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string>('');
  const played = useRef('');
  const play = async () => {
    setBusy(true);
    try {
      if (sentence) {
        await speak(text);
        setSource('voice');
      } else {
        const how = await sayWord(text, url);
        setSource(how === 'recording' ? 'native' : how === 'tts' ? 'voice' : '');
      }
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (auto && store.settings.autoplay && played.current !== text) {
      played.current = text;
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, text]);
  return (
    <button type="button" className={`play${size ? ` ${size}` : ''}${busy ? ' busy' : ''}`} onClick={e => { e.stopPropagation(); play(); }} aria-label={`Play ${text}`} title={source === 'native' ? 'Native recording' : source === 'voice' ? 'Device voice' : 'Play'}>
      <IconPlay />
      {!size && <span>{label ?? 'Listen'}</span>}
    </button>
  );
}
