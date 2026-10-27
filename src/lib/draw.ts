// Simple drawn pictures for words a photo shows badly: colours, numbers,
// days, months, directions and clock times. No letters that give the answer.

const INK = '#1f1d1a';
const MUTED = '#d9d3c7';
const ACCENT = '#e8590c';
const BG = '#fbf8f3';

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="24" fill="${BG}"/>${body}</svg>`;

function swatch(color: string) {
  return svg(`<rect x="40" y="40" width="160" height="160" rx="28" fill="${color}" stroke="${MUTED}" stroke-width="3"/>`);
}

function text(t: string) {
  const size = t.length <= 2 ? 120 : t.length <= 4 ? 80 : t.length <= 7 ? 50 : 34;
  const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return svg(`<text x="120" y="122" font-family="ui-rounded, system-ui, sans-serif" font-weight="700" font-size="${size}" fill="${INK}" text-anchor="middle" dominant-baseline="central">${esc}</text>`);
}

function week(n: number) {
  // A month grid that starts on Monday; the day's whole column lights up.
  let cells = '';
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 7; c++) {
      const on = c === n - 1;
      cells += `<rect x="${22 + c * 28}" y="${60 + r * 30}" width="24" height="24" rx="5" fill="${on ? ACCENT : MUTED}" opacity="${on ? 1 : 0.6}"/>`;
    }
  return svg(`<rect x="22" y="30" width="192" height="18" rx="5" fill="${INK}"/>${cells}`);
}

function month(n: number) {
  let cells = '';
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(i / 4);
    const c = i % 4;
    const on = i === n - 1;
    cells += `<rect x="${24 + c * 50}" y="${40 + r * 56}" width="42" height="46" rx="8" fill="${on ? ACCENT : MUTED}" opacity="${on ? 1 : 0.6}"/>`;
  }
  return svg(cells);
}

function arrow(dir: string) {
  const rot = { up: -90, down: 90, left: 180, right: 0, straight: -90 }[dir] ?? 0;
  const road = dir === 'straight' ? `<rect x="95" y="20" width="50" height="200" fill="${MUTED}"/>` : '';
  return svg(`${road}<g transform="rotate(${rot} 120 120)"><path d="M50 105h90V70l55 50-55 50v-35H50z" fill="${ACCENT}"/></g>`);
}

function compass(d: string) {
  const rot = { n: 0, e: 90, s: 180, w: 270 }[d] ?? 0;
  return svg(
    `<circle cx="120" cy="120" r="88" fill="none" stroke="${MUTED}" stroke-width="6"/>` +
      [0, 90, 180, 270].map(a => `<line x1="120" y1="40" x2="120" y2="54" stroke="${INK}" stroke-width="5" transform="rotate(${a} 120 120)"/>`).join('') +
      `<g transform="rotate(${rot} 120 120)"><path d="M120 44l22 76h-44z" fill="${ACCENT}"/><path d="M120 196l22-76h-44z" fill="${MUTED}"/></g><circle cx="120" cy="120" r="7" fill="${INK}"/>`,
  );
}

function clock(hm: string) {
  const [h, m] = hm.split(':').map(Number);
  const ma = (m / 60) * 360;
  const ha = (((h % 12) + m / 60) / 12) * 360;
  const ticks = Array.from({ length: 12 }, (_, i) => `<line x1="120" y1="36" x2="120" y2="48" stroke="${INK}" stroke-width="4" transform="rotate(${i * 30} 120 120)"/>`).join('');
  return svg(
    `<circle cx="120" cy="120" r="92" fill="#fff" stroke="${INK}" stroke-width="6"/>${ticks}` +
      `<line x1="120" y1="120" x2="120" y2="72" stroke="${INK}" stroke-width="9" stroke-linecap="round" transform="rotate(${ha} 120 120)"/>` +
      `<line x1="120" y1="120" x2="120" y2="48" stroke="${ACCENT}" stroke-width="5" stroke-linecap="round" transform="rotate(${ma} 120 120)"/><circle cx="120" cy="120" r="7" fill="${INK}"/>`,
  );
}

export function drawSvg(spec: string): string {
  const i = spec.indexOf(':');
  const kind = spec.slice(0, i);
  const arg = spec.slice(i + 1);
  switch (kind) {
    case 'swatch': return swatch(arg);
    case 'text': return text(arg);
    case 'week': return week(Number(arg));
    case 'month': return month(Number(arg));
    case 'arrow': return arrow(arg);
    case 'compass': return compass(arg);
    case 'clock': return clock(arg);
    default: return text('?');
  }
}

export function drawUrl(spec: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(drawSvg(spec))}`;
}

/** Resolve a note's image field to something an <img> can show, or an emoji. */
export function imageSource(image?: string): { src?: string; emoji?: string } {
  if (!image) return {};
  if (image.startsWith('emoji:')) return { emoji: image.slice(6) };
  if (image.startsWith('draw:')) return { src: drawUrl(image.slice(5)) };
  return { src: image };
}
