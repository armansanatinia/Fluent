// The optional AI helper. Shared by the browser (when you paste your own API
// key) and the worker (when the key is stored as a server secret).
//
// It never replaces native speakers, which the book insists on; it fills the
// gaps between tutor sessions: correcting journal entries, explaining grammar,
// and drafting definitions and example sentences for words you collected.

import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';

export const AI_MODEL = 'claude-opus-5-5';

export const Correction = z.object({
  corrected: z.string(),
  summary: z.string(),
  fixes: z.array(z.object({ original: z.string(), corrected: z.string(), why: z.string() })),
  cards: z.array(z.object({ text: z.string(), en: z.string() })),
});
export type Correction = z.infer<typeof Correction>;

export const WordHelp = z.object({
  word: z.string(),
  pos: z.enum(['noun', 'verb', 'adj', 'adv', 'pron', 'num', 'other']),
  gender: z.enum(['m', 'f', 'mf', 'none']),
  article: z.string(),
  definition: z.string(),
  examples: z.array(z.object({ text: z.string(), en: z.string() })),
  en: z.string(),
  note: z.string(),
});
export type WordHelp = z.infer<typeof WordHelp>;

export type AiTask =
  | { task: 'correct'; text: string; level: string; prompt?: string; language: string }
  | { task: 'word'; word: string; context?: string; language: string }
  | { task: 'explain'; question: string; context?: string; language: string };

export type AiResult =
  | { task: 'correct'; result: Correction }
  | { task: 'word'; result: WordHelp }
  | { task: 'explain'; result: { answer: string } };

const LIMIT = 6000;

function system(language: string) {
  return `You are a warm, precise ${language} teacher helping an English-speaking adult who learns with Gabriel Wyner's Fluent Forever method: pictures instead of translations, spaced-repetition flashcards they make themselves, and corrections from native speakers turned into fill-in-the-blank cards. Teach the variety named here exactly (for Spanish (Spain): Castilian usage, vosotros, Spain vocabulary, pretérito perfecto for recent past). Be concise.`;
}

const FALLBACK = { betas: ['server-side-fallback-2026-07-01'] as Anthropic.Beta.AnthropicBeta[], fallbacks: 'default' as const };

export async function runAi(client: Anthropic, t: AiTask, model = AI_MODEL): Promise<AiResult> {
  if (t.task === 'correct') {
    const res = await client.beta.messages.parse({
      model, max_tokens: 16000, ...FALLBACK,
      output_config: { effort: 'medium', format: betaZodOutputFormat(Correction) },
      system: system(t.language),
      messages: [{
        role: 'user',
        content:
          `Correct this journal entry by a learner at about ${t.level} level.${t.prompt ? ` The prompt was: "${t.prompt}".` : ''}\n\n` +
          `Rules: keep their meaning and voice; fix errors and anything a native speaker from Spain would find unnatural, but don't polish style for its own sake. ` +
          `"corrected" is the full corrected text. "fixes" lists each change: the original fragment, the corrected fragment, and a one-sentence English explanation. ` +
          `"summary" is one or two encouraging English sentences naming the main thing to work on. ` +
          `"cards": for the most useful fixes (at most 6), a short corrected sentence from the text with the corrected part written as a cloze {{c1::answer::hint}} (hint = base form, infinitive or a short cue), plus its English meaning in "en". If the text is already correct, return it unchanged with no fixes and no cards.\n\n` +
          `<entry>\n${t.text.slice(0, LIMIT)}\n</entry>`,
      }],
    } as Parameters<typeof client.beta.messages.parse>[0]);
    if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error('The AI helper could not correct this entry.');
    return { task: 'correct', result: res.parsed_output as Correction };
  }
  if (t.task === 'word') {
    const res = await client.beta.messages.parse({
      model, max_tokens: 8000, ...FALLBACK,
      output_config: { effort: 'low', format: betaZodOutputFormat(WordHelp) },
      system: system(t.language),
      messages: [{
        role: 'user',
        content:
          `A learner collected this word or phrase${t.context ? ' in this context' : ''}. Help them make a flashcard.\n` +
          `"word": the dictionary form (infinitive, masculine singular, singular noun). "pos", "gender" ('none' if not a noun), "article" (el/la/los/las, or '' if not a noun). ` +
          `"definition": a simple definition in the target language, at most 15 words, that does not use the word itself. ` +
          `"examples": two short natural sentences using it, with the word as used wrapped in [[ ]]. "en": a concise English gloss. "note": register, regional use or a false-friend warning, or ''.\n\n` +
          `<word>${t.word.slice(0, 200)}</word>${t.context ? `\n<context>${t.context.slice(0, 1000)}</context>` : ''}`,
      }],
    } as Parameters<typeof client.beta.messages.parse>[0]);
    if (res.stop_reason === 'refusal' || !res.parsed_output) throw new Error('The AI helper could not help with this word.');
    return { task: 'word', result: res.parsed_output as WordHelp };
  }
  const res = await client.beta.messages.create({
    model, max_tokens: 8000, ...FALLBACK,
    output_config: { effort: 'low' },
    system: system(t.language),
    messages: [{
      role: 'user',
      content: `Answer this question in English, with short ${t.language} examples, in under 200 words.${t.context ? `\n\n<context>${t.context.slice(0, 2000)}</context>` : ''}\n\n<question>${t.question.slice(0, 2000)}</question>`,
    }],
  });
  if (res.stop_reason === 'refusal') throw new Error('The AI helper declined this question.');
  const answer = res.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
  return { task: 'explain', result: { answer } };
}
