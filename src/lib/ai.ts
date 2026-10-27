// Browser side of the AI helper: either the app's server (key kept as a
// secret there) or your own key stored on this device only.

import type { AiResult, AiTask } from '../shared/ai';
import { store } from './store';

export function aiReady(): boolean {
  const d = store.device;
  return (d.aiMode === 'key' && !!d.aiKey) || (d.aiMode === 'server' && !!d.syncToken);
}

type Task = AiTask extends infer T ? (T extends AiTask ? Omit<T, 'language'> : never) : never;

export async function askAi(task: Task): Promise<AiResult> {
  const d = store.device;
  const full = { ...task, language: store.pack.name } as AiTask;
  if (d.aiMode === 'key' && d.aiKey) {
    const [{ default: Anthropic }, { runAi }] = await Promise.all([import('@anthropic-ai/sdk'), import('../shared/ai')]);
    const client = new Anthropic({ apiKey: d.aiKey, dangerouslyAllowBrowser: true });
    return runAi(client, full, d.aiModel || undefined);
  }
  if (d.aiMode === 'server') {
    const res = await fetch(`${(d.syncUrl || '').replace(/\/$/, '')}/api/ai`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${d.syncToken}` },
      body: JSON.stringify(full),
    });
    const body = (await res.json().catch(() => ({}))) as AiResult & { error?: string };
    if (!res.ok) throw new Error(body.error || `AI helper failed (${res.status}).`);
    return body;
  }
  throw new Error('Turn on the AI helper in Settings first.');
}
