// Fluent — one worker: serves the built app and answers /api/*.
//
//   GET  /api/health         what this server can do
//   POST /api/push           store changed records from a device
//   GET  /api/pull?since=N   records changed after sequence N
//   POST /api/ai             the AI helper (needs ANTHROPIC_API_KEY)
//   GET  /api/img?u=URL      fetch a picture for a card (sidesteps CORS)
//   GET  /api/proxy?u=URL    picture and recording search, if a browser blocks it

import Anthropic from '@anthropic-ai/sdk';
import { runAi, type AiTask } from '../src/shared/ai';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SYNC_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;
}

const STORES = new Set(['notes', 'cards', 'revlog', 'days', 'journal', 'inbox', 'kv', 'settings']);
const RASTER = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp']);
const ROWS_PER_INSERT = 16; // 6 bound values per row; D1 allows 100 per statement

const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...CORS } });

/** Compare secrets without leaking their length or content through timing. */
async function sameSecret(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const ua = new Uint8Array(x);
  const ub = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

function isLocal(url: URL) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

interface Wire {
  store: string;
  id: string;
  updated: number;
  deleted?: boolean;
  data: unknown;
}

async function push(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { records?: Wire[] } | null;
  const records = body?.records;
  if (!Array.isArray(records) || records.length > 500) return json({ error: 'Send up to 500 records.' }, 400);
  const rows: (string | number)[][] = [];
  for (const r of records) {
    if (!r || !STORES.has(r.store) || typeof r.id !== 'string' || r.id.length > 300 || typeof r.updated !== 'number') {
      return json({ error: 'Malformed record.' }, 400);
    }
    const data = JSON.stringify(r.data ?? null);
    if (data.length > 1_800_000) return json({ error: `Record ${r.id} is too large.` }, 413);
    rows.push([r.store, r.id, data, Math.floor(r.updated), r.deleted ? 1 : 0]);
  }
  if (!rows.length) return json({ ok: true, stored: 0 });

  // One transaction: number each row from the shared counter, then advance it.
  const stmts: D1PreparedStatement[] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
    const slice = rows.slice(i, i + ROWS_PER_INSERT);
    const values = slice.map(() => `(?, ?, ?, ?, ?, (SELECT v FROM meta WHERE k = 'seq') + ?)`).join(', ');
    const binds = slice.flatMap((row, k) => [...row, i + k + 1]);
    stmts.push(
      env.DB.prepare(
        `INSERT INTO records (store, id, data, updated, deleted, seq) VALUES ${values}
         ON CONFLICT (store, id) DO UPDATE SET data = excluded.data, updated = excluded.updated,
           deleted = excluded.deleted, seq = excluded.seq
         WHERE excluded.updated >= records.updated`,
      ).bind(...binds),
    );
  }
  stmts.push(env.DB.prepare(`UPDATE meta SET v = v + ? WHERE k = 'seq'`).bind(rows.length));
  await env.DB.batch(stmts);
  return json({ ok: true, stored: rows.length });
}

async function pull(url: URL, env: Env): Promise<Response> {
  const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit')) || 200));
  const { results } = await env.DB.prepare(
    `SELECT store, id, data, updated, deleted, seq FROM records WHERE seq > ? ORDER BY seq LIMIT ?`,
  ).bind(since, limit).all<{ store: string; id: string; data: string; updated: number; deleted: number; seq: number }>();
  const rows = results ?? [];
  return json({
    records: rows.map(r => ({ store: r.store, id: r.id, updated: r.updated, deleted: !!r.deleted, data: JSON.parse(r.data) })),
    cursor: rows.length ? rows[rows.length - 1].seq : since,
    more: rows.length === limit,
  });
}

async function ai(req: Request, env: Env): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'The AI helper is not set up on this server (ANTHROPIC_API_KEY).' }, 501);
  const task = (await req.json().catch(() => null)) as AiTask | null;
  if (!task || !['correct', 'word', 'explain'].includes(task.task)) return json({ error: 'Unknown AI task.' }, 400);
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return json(await runAi(client, task, env.AI_MODEL || undefined));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'The AI helper is busy. Try again in a minute.' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'The server’s Anthropic API key was rejected.' }, 502);
    if (e instanceof Anthropic.APIError) return json({ error: `AI request failed (${e.status ?? 'network'}).` }, 502);
    return json({ error: e instanceof Error ? e.message : 'AI request failed.' }, 500);
  }
}

async function image(url: URL): Promise<Response> {
  const target = url.searchParams.get('u') ?? '';
  let parsed: URL;
  try { parsed = new URL(target); } catch { return json({ error: 'Bad image URL.' }, 400); }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return json({ error: 'Bad image URL.' }, 400);
  const res = await fetch(parsed.toString(), {
    headers: { 'user-agent': 'FluentApp/1.0 (flashcard image fetch)', accept: 'image/*' },
    redirect: 'follow',
    cf: { cacheTtl: 86400 },
  });
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const size = Number(res.headers.get('content-length') ?? 0);
  // Photos only: no SVG or HTML, which could run script on this site.
  if (!res.ok || !RASTER.has(type)) return json({ error: 'That link is not a photo.' }, 415);
  if (size > 10_000_000) return json({ error: 'Image too large.' }, 413);
  return new Response(res.body, {
    headers: {
      'content-type': type, 'cache-control': 'public, max-age=86400',
      'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", ...CORS,
    },
  });
}

// Only the open APIs the app searches; nothing else goes through the proxy.
const PROXY_HOSTS = new Set(['api.openverse.org', 'commons.wikimedia.org']);

async function proxy(url: URL): Promise<Response> {
  let target: URL;
  try { target = new URL(url.searchParams.get('u') ?? ''); } catch { return json({ error: 'Bad URL.' }, 400); }
  if (target.protocol !== 'https:' || !PROXY_HOSTS.has(target.hostname)) return json({ error: 'Host not allowed.' }, 403);
  const res = await fetch(target.toString(), {
    headers: { 'user-agent': 'FluentApp/1.0 (language-learning flashcards)', accept: 'application/json' },
    redirect: 'manual', // a redirect could leave the allowed hosts
    cf: { cacheTtl: 3600 },
  });
  if (res.status >= 300 && res.status < 400) return json({ error: 'Redirects are not followed.' }, 502);
  return new Response(res.body, {
    status: res.status,
    headers: { 'content-type': 'application/json', 'x-content-type-options': 'nosniff', 'cache-control': 'public, max-age=3600', ...CORS },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const given = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    const authed = env.SYNC_TOKEN ? await sameSecret(given, env.SYNC_TOKEN) : isLocal(url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, sync: true, ai: !!env.ANTHROPIC_API_KEY && !!env.SYNC_TOKEN, locked: !!env.SYNC_TOKEN, authed });
    }
    if (!authed) {
      return json({ error: env.SYNC_TOKEN ? 'Wrong sync password.' : 'Set SYNC_TOKEN on the server first (npx wrangler secret put SYNC_TOKEN).' }, 401);
    }
    try {
      if (url.pathname === '/api/push' && req.method === 'POST') return await push(req, env);
      if (url.pathname === '/api/pull' && req.method === 'GET') return await pull(url, env);
      if (url.pathname === '/api/img' && req.method === 'GET') return await image(url);
      if (url.pathname === '/api/proxy' && req.method === 'GET') return await proxy(url);
      if (url.pathname === '/api/ai' && req.method === 'POST') {
        if (!env.SYNC_TOKEN) return json({ error: 'Set SYNC_TOKEN before using the AI helper.' }, 401);
        return await ai(req, env);
      }
      return json({ error: 'Not found.' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'Server error.' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
