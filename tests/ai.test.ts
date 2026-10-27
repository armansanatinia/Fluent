import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { AI_MODEL, runAi } from '../src/shared/ai';

function fakeClient(reply: Record<string, unknown>) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    beta: {
      messages: {
        parse: async (p: Record<string, unknown>) => { calls.push(p); return { stop_reason: 'end_turn', parsed_output: reply }; },
        create: async (p: Record<string, unknown>) => { calls.push(p); return { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Porque es un estado.' }] }; },
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

describe('AI helper', () => {
  it('asks for structured corrections with server-side fallback', async () => {
    const reply = { corrected: 'Hoy he comido paella.', summary: 'Bien.', fixes: [], cards: [] };
    const { client, calls } = fakeClient(reply);
    const res = await runAi(client, { task: 'correct', text: 'Hoy he comer paella.', level: 'A2', language: 'Spanish (Spain)' });
    expect(res).toEqual({ task: 'correct', result: reply });
    expect(calls[0].model).toBe(AI_MODEL);
    expect(calls[0].fallbacks).toBe('default');
    expect(calls[0].betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(JSON.stringify(calls[0].messages)).toContain('Hoy he comer paella.');
  });
  it('answers grammar questions as text', async () => {
    const { client } = fakeClient({});
    const res = await runAi(client, { task: 'explain', question: '¿Por qué estoy cansado?', language: 'Spanish (Spain)' });
    expect(res).toEqual({ task: 'explain', result: { answer: 'Porque es un estado.' } });
  });
  it('reports a refusal instead of returning nothing', async () => {
    const client = { beta: { messages: { parse: async () => ({ stop_reason: 'refusal', parsed_output: null }) } } } as unknown as Anthropic;
    await expect(runAi(client, { task: 'word', word: 'madrugar', language: 'Spanish (Spain)' })).rejects.toThrow();
  });
});
