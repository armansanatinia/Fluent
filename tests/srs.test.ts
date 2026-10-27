import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHED, State, newSched, preview, retrievability, schedule, type Rating, type Sched } from '../src/lib/srs';
import { DAY, MIN } from '../src/lib/time';

const T0 = Date.UTC(2026, 9, 27, 10);
const fsrs = { ...DEFAULT_SCHED, fuzz: false };
const sm2 = { ...DEFAULT_SCHED, algorithm: 'sm2' as const, fuzz: false };

function run(cfg: typeof fsrs, ratings: [Rating, number][]): Sched {
  let s = newSched(T0);
  let now = T0;
  for (const [r, advance] of ratings) {
    now += advance;
    s = schedule(s, r, now, cfg).sched;
  }
  return s;
}

describe('learning steps', () => {
  it('new card: Again → 1m, Good → 10m, Easy graduates', () => {
    const s = newSched(T0);
    expect(schedule(s, 1, T0, fsrs).wait).toBe(1 * MIN);
    expect(schedule(s, 3, T0, fsrs).wait).toBe(10 * MIN);
    expect(schedule(s, 3, T0, fsrs).sched.state).toBe(State.Learning);
    const easy = schedule(s, 4, T0, fsrs).sched;
    expect(easy.state).toBe(State.Review);
    expect(easy.ivl).toBeGreaterThanOrEqual(2);
  });
  it('Good, Good graduates to a review card', () => {
    const s = run(fsrs, [[3, 0], [3, 10 * MIN]]);
    expect(s.state).toBe(State.Review);
    expect(s.ivl).toBeGreaterThanOrEqual(1);
  });
  it('sm2 graduates with 1 day, easy with 4', () => {
    expect(run(sm2, [[3, 0], [3, 10 * MIN]]).ivl).toBe(1);
    expect(run(sm2, [[4, 0]]).ivl).toBe(4);
  });
});

describe('reviews', () => {
  it('intervals grow with successful reviews', () => {
    for (const cfg of [fsrs, sm2]) {
      let s = run(cfg, [[3, 0], [3, 10 * MIN]]);
      let now = T0 + 10 * MIN;
      const ivls: number[] = [];
      for (let i = 0; i < 5; i++) {
        now = s.due;
        s = schedule(s, 3, now, cfg).sched;
        ivls.push(s.ivl);
      }
      for (let i = 1; i < ivls.length; i++) expect(ivls[i]).toBeGreaterThan(ivls[i - 1]);
    }
  });
  it('button order is Again < Hard ≤ Good < Easy', () => {
    for (const cfg of [fsrs, sm2]) {
      let s = run(cfg, [[3, 0], [3, 10 * MIN]]);
      s = schedule(s, 3, s.due, cfg).sched;
      const p = preview(s, s.due, cfg);
      expect(p[1]).toBeLessThan(p[2]);
      expect(p[2]).toBeLessThan(p[3]);
      expect(p[3]).toBeLessThan(p[4]);
    }
  });
  it('a lapse goes to relearning and counts', () => {
    let s = run(fsrs, [[3, 0], [3, 10 * MIN]]);
    s = schedule(s, 3, s.due, fsrs).sched;
    const before = s.stability;
    s = schedule(s, 1, s.due, fsrs).sched;
    expect(s.state).toBe(State.Relearning);
    expect(s.lapses).toBe(1);
    expect(s.stability).toBeLessThan(before);
    s = schedule(s, 3, s.due, fsrs).sched;
    expect(s.state).toBe(State.Review);
  });
  it('FSRS schedules at ~90% retention', () => {
    let s = run(fsrs, [[3, 0], [3, 10 * MIN]]);
    s = schedule(s, 3, s.due, fsrs).sched;
    const r = retrievability(s.ivl, s.stability);
    expect(r).toBeGreaterThan(0.88);
    expect(r).toBeLessThan(0.92);
  });
  it('fuzz keeps intervals near the target', () => {
    const cfg = { ...DEFAULT_SCHED, algorithm: 'sm2' as const };
    let s = run(cfg, [[3, 0], [3, 10 * MIN]]);
    for (let i = 0; i < 4; i++) s = schedule(s, 3, s.due, cfg, 42).sched;
    expect(s.ivl).toBeGreaterThan(20);
    expect(s.due - (s.last)).toBe(s.ivl * DAY);
  });
});
