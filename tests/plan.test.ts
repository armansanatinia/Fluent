import { describe, expect, it } from 'vitest';
import { spanish } from '../src/content/es';
import { defaultSettings, emptyDay } from '../src/lib/model';
import { buildPlan, phases, type PlanCounts } from '../src/lib/plan';

const base: PlanCounts = { wordsMade: 0, sentencesMade: 0, vocabMade: 0, soundsMade: 0, pairsMade: 0, due: 0, fresh: 0, inboxOpen: 0, wroteToday: false };
const settings = { ...defaultSettings('2026-10-26'), updated: 1 };
const tuesday = '2026-10-27';
const saturday = '2026-10-31';

describe('phases', () => {
  it('starts with pronunciation and base words together', () => {
    const ph = phases(spanish, settings, base);
    expect(ph.find(p => p.id === 'sounds')!.active).toBe(true);
    expect(ph.find(p => p.id === 'words')!.active).toBe(true);
    expect(ph.find(p => p.id === 'grammar')!.active).toBe(false);
  });
  it('adds grammar after the start threshold', () => {
    const ph = phases(spanish, settings, { ...base, wordsMade: 300, soundsMade: 30 });
    expect(ph.find(p => p.id === 'sounds')!.done).toBe(true);
    expect(ph.find(p => p.id === 'grammar')!.active).toBe(true);
  });
});

describe('daily plan', () => {
  it('fits the first day around an hour', () => {
    const plan = buildPlan(spanish, settings, base, emptyDay(tuesday));
    const ids = plan.items.map(i => i.id);
    expect(ids).toEqual(expect.arrayContaining(['reviews', 'sounds', 'ear', 'words']));
    expect(ids).not.toContain('grammar');
    expect(plan.items.find(i => i.id === 'words')!.progress!.total).toBe(9); // 15 a day, 60% during pronunciation
    expect(plan.items.some(i => i.section === 'outside' && i.url)).toBe(true);
    expect(plan.minutes).toBeGreaterThan(25);
    expect(plan.minutes).toBeLessThan(90);
  });
  it('schedules the tutor on the right day', () => {
    expect(buildPlan(spanish, settings, base, emptyDay(saturday)).items.some(i => i.id === 'act:tutor')).toBe(true);
    expect(buildPlan(spanish, settings, base, emptyDay(tuesday)).items.some(i => i.id === 'act:tutor')).toBe(false);
  });
  it('shrinks new work on heavy review days', () => {
    const light = buildPlan(spanish, settings, { ...base, wordsMade: 100, soundsMade: 30, due: 50 }, emptyDay(tuesday));
    const heavy = buildPlan(spanish, settings, { ...base, wordsMade: 100, soundsMade: 30, due: 350 }, emptyDay(tuesday));
    const words = (p: typeof light) => p.items.find(i => i.id === 'words')?.progress?.total ?? 0;
    expect(words(heavy)).toBeLessThan(words(light));
    expect(heavy.note).toBeTruthy();
  });
  it('counts what was made and honours manual ticks', () => {
    const day = { ...emptyDay(tuesday), made: { word: 9, sound: 3, drill: 1 }, checks: { 'act:x': true } };
    const plan = buildPlan(spanish, settings, base, day);
    expect(plan.items.find(i => i.id === 'words')!.done).toBe(true);
    expect(plan.items.find(i => i.id === 'sounds')!.done).toBe(true);
    expect(plan.items.find(i => i.id === 'ear')!.done).toBe(true);
  });
  it('adds writing and sentences in the grammar phase', () => {
    const plan = buildPlan(spanish, settings, { ...base, wordsMade: 400, soundsMade: 30 }, emptyDay(tuesday));
    expect(plan.items.map(i => i.id)).toEqual(expect.arrayContaining(['grammar', 'write']));
  });
});
