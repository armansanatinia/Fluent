// Deploy from your own computer instead of from GitHub (optional; see README).
// Run from the repo folder:  npm run setup
// Logs in, deploys (the first deploy creates the database), and sets the sync
// password and, optionally, the AI helper key. Safe to run again.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const say = msg => console.log(`\n▸ ${msg}`);
const wrangler = (args, input) => spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', input, stdio: [input === undefined ? 'inherit' : 'pipe', 'pipe', 'pipe'] });

say('Checking your Cloudflare login…');
let who = wrangler(['whoami']);
if (/not authenticated|You are not/i.test(who.stdout + who.stderr)) {
  say('Opening the browser so you can log in to Cloudflare.');
  spawnSync('npx', ['wrangler', 'login'], { stdio: 'inherit' });
  who = wrangler(['whoami']);
}

say('Building and deploying…');
const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
if (build.status !== 0) throw new Error('The build failed.');
const dep = wrangler(['deploy']);
process.stdout.write(dep.stdout);
if (dep.status !== 0) {
  console.error(dep.stderr);
  if (/zone|domain/i.test(dep.stderr)) console.error('\nIs armansanatinia.com added to this Cloudflare account and Active? See the README.');
  throw new Error('Deploy failed.');
}
const url = (dep.stdout.match(/https:\/\/[^\s]+\.workers\.dev/) || [])[0];

const hasToken = /SYNC_TOKEN/.test(wrangler(['secret', 'list']).stdout);
let token = '';
const answer = (await rl.question(hasToken
  ? '\nA sync password is already set. Press Enter to keep it, or type "new" to make a new one: '
  : '\nChoose a sync password (or press Enter to generate a strong one): ')).trim();
if (!hasToken || answer) {
  token = !answer || answer === 'new' ? randomBytes(18).toString('base64url') : answer;
  const put = wrangler(['secret', 'put', 'SYNC_TOKEN'], `${token}\n`);
  if (put.status !== 0) { console.error(put.stdout + put.stderr); throw new Error('Could not save the sync password.'); }
}

const key = (await rl.question('\nOptional: paste an Anthropic API key to turn on the AI helper (Enter to skip): ')).trim();
if (key) {
  const put = wrangler(['secret', 'put', 'ANTHROPIC_API_KEY'], `${key}\n`);
  console.log(put.status === 0 ? '  AI helper key saved.' : `  Could not save the key: ${put.stderr}`);
}
rl.close();

console.log('\n────────────────────────────────────────');
console.log('Your app: https://fluent.armansanatinia.com' + (url ? `  (also ${url})` : ''));
if (token) console.log(`Sync password: ${token}   ← type this into Settings → Sync on each device`);
console.log('On iPhone: open the link in Safari → Share → Add to Home Screen.');
console.log('────────────────────────────────────────\n');
