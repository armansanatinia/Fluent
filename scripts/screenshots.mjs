// Walk through the app at phone size and save screenshots to .shots/.
// Usage: npm run dev (in another terminal), then: node scripts/screenshots.mjs [baseUrl]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = new URL('../.shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: process.env.DARK ? 'dark' : 'light' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(`console: ${m.text()}`); });

const shot = async (name, full = true) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
  console.log('shot', name);
};
const go = async hash => { await page.goto(`${BASE}/${hash}`); await page.waitForTimeout(600); };

await go('#/today');
await page.waitForSelector('text=Spanish, the Fluent Forever way');
await shot('01-welcome');
await page.click('text=Set up my plan');
await shot('02-setup');
await page.click('text=Next: the gender trick');
await shot('03-gender', false);
await page.click('text=Start learning');
await page.waitForSelector('text=Review your flashcards');
await shot('04-today');

// Pronunciation: learn a sound, drill.
await go('#/sounds');
await shot('05-sounds');
await page.click('a:has-text("Next:")');
await shot('06-sound-lesson');
await page.click('text=Add this sound to my cards');
await page.waitForTimeout(300);
await go('#/sounds/drill');
await page.locator('.choice').first().click();
await shot('07-drill', false);

// Make two word cards.
await go('#/words');
await shot('08-words');
await page.click('a:has-text("Make the next")');
await page.waitForSelector('text=1 · Hear it');
await shot('09-make-word');
await page.click('button:has-text("Save & next word")');
await page.waitForTimeout(300);
await page.click('button:has-text("Save & next word")');
await page.waitForTimeout(300);

// Review.
await go('#/review');
await shot('10-review-front', false);
await page.click('button:has-text("Show answer")').catch(async () => { await page.locator('.choice').first().click(); });
await page.waitForTimeout(500);
await shot('11-review-back', false);
for (let i = 0; i < 6; i++) {
  if (await page.locator('.grade.g3').count()) await page.click('.grade.g3');
  else if (await page.locator('button:has-text("Show answer")').count()) await page.click('button:has-text("Show answer")');
  else if (await page.locator('.choice').count()) await page.locator('.choice').first().click();
  await page.waitForTimeout(250);
}
await shot('12-review-more', false);

await go('#/grammar');
await shot('13-grammar');
await go('#/grammar/demonstratives');
await shot('14-grammar-topic');
await page.click('text=Make cards, one sentence at a time');
await page.waitForTimeout(400);
await shot('15-sentence-maker', false);
await page.keyboard.press('Escape');

await go('#/vocab');
await shot('16-vocab');
await go('#/write');
await page.fill('textarea', 'Hoy he comido paella con mi familia. Me gusta mucho.');
await shot('17-write');
await go('#/inbox');
await page.fill('input[placeholder="Word or phrase"]', 'madrugar');
await page.click('text=Save to inbox');
await shot('18-inbox');
await go('#/today');
await shot('19-today-after');
await go('#/progress');
await shot('20-progress');
await go('#/resources');
await shot('21-resources');
await go('#/settings');
await shot('22-settings');
await go('#/browse');
await shot('23-browse');
await go('#/study');
await shot('24-study');

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
