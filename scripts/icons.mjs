// Render public/icons/icon.svg to the PNG sizes the manifest and iOS need.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const dir = new URL('../public/icons/', import.meta.url).pathname;
const svg = readFileSync(`${dir}icon.svg`, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [
  ['apple-touch-icon.png', 180, false],
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
];
for (const [name, size, maskable] of out) {
  await page.setViewportSize({ width: size, height: size });
  // iOS rounds the corners itself, so the touch icon and maskable icon are full-bleed squares.
  const body = maskable || name.startsWith('apple')
    ? `<div style="width:${size}px;height:${size}px;background:#e8590c;display:grid;place-items:center"><div style="width:${size * (maskable ? 0.72 : 0.9)}px;height:${size * (maskable ? 0.72 : 0.9)}px">${svg.replace('rx="112"', 'rx="0"')}</div></div>`
    : `<div style="width:${size}px;height:${size}px">${svg}</div>`;
  await page.setContent(`<html><body style="margin:0;background:transparent">${body}<style>svg{width:100%;height:100%;display:block}</style></body></html>`);
  await page.screenshot({ path: `${dir}${name}`, omitBackground: true });
  console.log('wrote', name);
}
await browser.close();
