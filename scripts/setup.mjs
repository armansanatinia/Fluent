// One-time setup on Cloudflare: database, deploy, sync password, optional AI key.
// Run from the fluent/ folder:  npm run setup
// Safe to run again: it reuses the database and keeps your existing password
// unless you choose a new one.
import { execSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const CONFIG = new URL('../wrangler.jsonc', import.meta.url).pathname;
const rl = createInterface({ input: process.stdin, output: process.stdout });
const say = msg => console.log(`\n▸ ${msg}`);
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
const wrangler = (args, input) => spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', input, stdio: [input === undefined ? 'inherit' : 'pipe', 'pipe', 'pipe'] });

// 1. Logged in?
say('Checking your Cloudflare login…');
let who = wrangler(['whoami']);
if (/not authenticated|You are not/i.test(who.stdout + who.stderr)) {
  say('Opening the browser so you can log in to Cloudflare.');
  spawnSync('npx', ['wrangler', 'login'], { stdio: 'inherit' });
  who = wrangler(['whoami']);
}
console.log((who.stdout.match(/associated with the email (\S+)/) || [])[1] ? `  Logged in as ${who.stdout.match(/associated with the email (\S+)/)[1]}` : '  Logged in.');

// 2. Database.
let config = readFileSync(CONFIG, 'utf8');
if (/"database_id":\s*"local"/.test(config)) {
  say('Creating the sync database…');
  const created = wrangler(['d1', 'create', 'fluent']);
  let id = (created.stdout.match(/"?database_id"?\s*[:=]\s*"([0-9a-f-]{36})"/) || [])[1];
  if (!id) {
    const list = wrangler(['d1', 'list', '--json']);
    try { id = JSON.parse(list.stdout).find(d => d.name === 'fluent')?.uuid; } catch { /* fall through */ }
  }
  if (!id) {
    console.error(created.stdout + created.stderr);
    throw new Error('Could not create or find the "fluent" database. Run `npx wrangler d1 create fluent` and paste its id into wrangler.jsonc.');
  }
  config = config.replace(/"database_id":\s*"local"/, `"database_id": "${id}"`);
  writeFileSync(CONFIG, config);
  console.log(`  Database id ${id} saved in wrangler.jsonc.`);
} else {
  console.log('  Database already set in wrangler.jsonc.');
}
say('Creating the table (safe to repeat)…');
const schema = wrangler(['d1', 'execute', 'fluent', '--remote', '--file=./schema.sql', '--yes']);
if (schema.status !== 0) { console.error(schema.stdout + schema.stderr); throw new Error('Could not create the table.'); }

// 3. Deploy.
say('Building and deploying the app…');
run('npm run build', { stdio: 'inherit' });
const dep = wrangler(['deploy']);
process.stdout.write(dep.stdout);
if (dep.status !== 0) { console.error(dep.stderr); throw new Error('Deploy failed.'); }
const url = (dep.stdout.match(/https:\/\/[^\s]+\.workers\.dev/) || [])[0];

// 4. Sync password.
const existing = wrangler(['secret', 'list']);
const hasToken = /SYNC_TOKEN/.test(existing.stdout);
let token = '';
const answer = (await rl.question(hasToken
  ? '\nA sync password is already set. Press Enter to keep it, or type "new" to make a new one: '
  : '\nChoose a sync password (or press Enter to generate a strong one): ')).trim();
if (!hasToken || answer) {
  token = !answer || answer === 'new' ? randomBytes(18).toString('base64url') : answer;
  const put = wrangler(['secret', 'put', 'SYNC_TOKEN'], `${token}\n`);
  if (put.status !== 0) { console.error(put.stdout + put.stderr); throw new Error('Could not save the sync password.'); }
}

// 5. Optional AI helper.
const key = (await rl.question('\nOptional: paste an Anthropic API key to turn on the AI helper for all your devices (Enter to skip): ')).trim();
if (key) {
  const put = wrangler(['secret', 'put', 'ANTHROPIC_API_KEY'], `${key}\n`);
  console.log(put.status === 0 ? '  AI helper key saved.' : `  Could not save the key: ${put.stderr}`);
}
rl.close();

console.log('\n────────────────────────────────────────');
console.log(`Your app: ${url ?? '(see the deploy output above)'}`);
if (token) console.log(`Sync password: ${token}   ← type this into Settings → Sync on each device`);
console.log('On iPhone: open the link in Safari → Share → Add to Home Screen.');
console.log('────────────────────────────────────────\n');
