// Picture search for flashcards. The book says to pick your own image — one
// that means something to you — so the app searches open image libraries,
// and you can also paste or upload anything (Google Images, your camera roll).
// Chosen pictures are shrunk and stored inside the card, so they work offline
// and sync with it.

import { store } from './store';

export interface ImageHit {
  id: string;
  thumb: string;
  full: string;
  title: string;
  credit: string;
  page: string;
  source: 'openverse' | 'commons';
}

const MAX_SIDE = 480;

async function openverse(q: string, page: number): Promise<ImageHit[]> {
  const params = new URLSearchParams({ q, page_size: '20', page: String(page), mature: 'false' });
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`);
  if (!res.ok) throw new Error(`openverse ${res.status}`);
  const data = (await res.json()) as {
    results: { id: string; title?: string; url: string; thumbnail?: string; creator?: string; license?: string; license_version?: string; foreign_landing_url?: string }[];
  };
  return data.results.map(r => ({
    id: `ov:${r.id}`,
    thumb: r.thumbnail || r.url,
    full: r.url,
    title: r.title ?? '',
    credit: [r.creator, r.license && `CC ${r.license.toUpperCase()} ${r.license_version ?? ''}`.trim()].filter(Boolean).join(' · '),
    page: r.foreign_landing_url ?? r.url,
    source: 'openverse' as const,
  }));
}

async function commons(q: string, page: number): Promise<ImageHit[]> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6',
    gsrsearch: `${q} filetype:bitmap`, gsrlimit: '20', gsroffset: String((page - 1) * 20),
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '360',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!res.ok) throw new Error(`commons ${res.status}`);
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { pageid: number; title: string; index?: number; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }> };
  };
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages.flatMap(p => {
    const ii = p.imageinfo?.[0];
    if (!ii) return [];
    const artist = (ii.extmetadata?.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim();
    const lic = ii.extmetadata?.LicenseShortName?.value ?? '';
    return [{
      id: `wc:${p.pageid}`,
      thumb: ii.thumburl ?? ii.url,
      full: ii.thumburl ?? ii.url,
      title: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
      credit: [artist.slice(0, 60), lic].filter(Boolean).join(' · '),
      page: ii.descriptionurl,
      source: 'commons' as const,
    }];
  });
}

/** Search both libraries and interleave the results. */
export async function searchImages(q: string, page = 1): Promise<ImageHit[]> {
  const [a, b] = await Promise.allSettled([openverse(q, page), commons(q, page)]);
  const ov = a.status === 'fulfilled' ? a.value : [];
  const wc = b.status === 'fulfilled' ? b.value : [];
  if (a.status === 'rejected' && b.status === 'rejected') throw new Error('Image search is unavailable right now.');
  const out: ImageHit[] = [];
  for (let i = 0; i < Math.max(ov.length, wc.length); i++) {
    if (ov[i]) out.push(ov[i]);
    if (wc[i]) out.push(wc[i]);
  }
  return out;
}

export const googleImages = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

/** Shrink an image to fit MAX_SIDE and return a JPEG data URL. */
export async function shrink(blob: Blob, max = MAX_SIDE): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return canvas.toDataURL('image/jpeg', 0.82);
}

function apiBase(): string {
  return (store.device.syncUrl || '').replace(/\/$/, '');
}

/**
 * Turn a picked web image into something stored with the card. Tries a direct
 * download, then the app's own server, and falls back to linking the image.
 */
export async function keepImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return await shrink(await res.blob());
  } catch { /* blocked by CORS, try the proxy */ }
  try {
    const headers: Record<string, string> = {};
    if (store.device.syncToken) headers.authorization = `Bearer ${store.device.syncToken}`;
    const res = await fetch(`${apiBase()}/api/img?u=${encodeURIComponent(url)}`, { headers });
    if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) return await shrink(await res.blob());
  } catch { /* no server */ }
  return url;
}

export async function fileToImage(file: Blob): Promise<string> {
  return shrink(file);
}

/** Read an image from the clipboard, if the browser allows it. */
export async function pasteImage(): Promise<string | null> {
  const clip = navigator.clipboard as Clipboard & { read?: () => Promise<ClipboardItem[]> };
  if (clip?.read) {
    try {
      for (const item of await clip.read()) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) return shrink(await item.getType(type));
      }
    } catch { /* permission denied */ }
  }
  try {
    const text = (await navigator.clipboard.readText()).trim();
    if (/^https?:\/\/\S+$/.test(text)) return keepImage(text);
  } catch { /* nothing usable */ }
  return null;
}
