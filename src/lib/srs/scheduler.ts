// Spaced repetition. Two interchangeable algorithms behind one function:
//  - FSRS-5 (default): models how stable each memory is and schedules the next
//    review for when you'd have a `retention` chance of still remembering it.
//  - SM-2: Anki's classic algorithm, the one the book was written around.
// Both share Anki-style learning steps for new and forgotten cards, and both
// keep the other's memory fields current, so you can switch at any time.

import { DAY, MIN } from '../time';
import { State, type Outcome, type Rating, type Sched, type SchedulerSettings } from './types';

/** FSRS-5 default parameters (trained on hundreds of millions of Anki reviews). */
export const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
  1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];
const DECAY = -0.5;
const FACTOR = 19 / 81;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Chance of recalling a card `elapsedDays` after its last review. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

function fsrsIvl(stability: number, retention: number, maxIvl: number): number {
  const ivl = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return clamp(Math.round(ivl), 1, maxIvl);
}

const initS = (r: Rating) => Math.max(W[r - 1], 0.1);
const initD = (r: Rating) => clamp(W[4] - Math.exp(W[5] * (r - 1)) + 1, 1, 10);

function nextD(d: number, r: Rating): number {
  const delta = -W[6] * (r - 3);
  const damped = d + (delta * (10 - d)) / 9;
  return clamp(W[7] * initD(4) + (1 - W[7]) * damped, 1, 10);
}

function recallS(d: number, s: number, rr: number, r: Rating): number {
  const hard = r === 2 ? W[15] : 1;
  const easy = r === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - rr) * W[10]) - 1) * hard * easy);
}

function forgetS(d: number, s: number, rr: number): number {
  const f = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - rr) * W[14]);
  return Math.min(f, s);
}

const shortTermS = (s: number, r: Rating) => s * Math.exp(W[17] * (r - 3 + W[18]));

/** New FSRS memory state after a review. */
function fsrsMemory(prev: Sched, r: Rating, elapsedDays: number): { stability: number; difficulty: number } {
  if (prev.state === State.New || prev.stability <= 0) return { stability: initS(r), difficulty: initD(r) };
  const d = nextD(prev.difficulty, r);
  if (elapsedDays < 1) return { stability: Math.max(0.01, shortTermS(prev.stability, r)), difficulty: d };
  const rr = retrievability(elapsedDays, prev.stability);
  return { stability: Math.max(0.01, r === 1 ? forgetS(prev.difficulty, prev.stability, rr) : recallS(prev.difficulty, prev.stability, rr, r)), difficulty: d };
}

/** Deterministic 0..1 from a seed, so previews match what actually happens. */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function fuzz(ivl: number, seed: number, cfg: SchedulerSettings): number {
  if (!cfg.fuzz || ivl < 2.5) return ivl;
  const spread = ivl < 7 ? 1 : ivl < 20 ? Math.max(2, ivl * 0.15) : Math.max(3, ivl * 0.05);
  const lo = Math.max(2, Math.round(ivl - spread));
  const hi = Math.round(ivl + spread);
  return Math.min(cfg.maxInterval, lo + Math.floor(rand(seed) * (hi - lo + 1)));
}

/** The four intervals (days) a review card would get, kept in order Hard ≤ Good < Easy. */
function reviewIntervals(prev: Sched, now: number, cfg: SchedulerSettings): { hard: number; good: number; easy: number; again: number } {
  const elapsed = prev.last ? (now - prev.last) / DAY : prev.ivl;
  if (cfg.algorithm === 'fsrs') {
    const S = prev.stability > 0 ? prev.stability : Math.max(prev.ivl, 1);
    const D = prev.difficulty > 0 ? prev.difficulty : 5;
    const rr = retrievability(elapsed, S);
    const at = (r: Rating) => fsrsIvl(r === 1 ? forgetS(D, S, rr) : recallS(D, S, rr, r), cfg.retention, cfg.maxInterval);
    let hard = at(2);
    let good = at(3);
    let easy = at(4);
    hard = Math.min(hard, good);
    good = Math.max(good, hard + 1);
    easy = Math.max(easy, good + 1);
    return { again: at(1), hard, good, easy };
  }
  const ivl = Math.max(prev.ivl, 1);
  const ease = prev.ease || cfg.startEase;
  const late = Math.max(0, elapsed - ivl);
  const hard = Math.max(Math.round(ivl * 1.2), ivl + 1);
  const good = Math.max(Math.round((ivl + late / 2) * ease), hard + 1);
  const easy = Math.max(Math.round((ivl + late) * ease * 1.3), good + 1);
  return { again: 1, hard, good, easy };
}

/** Schedule a card after answering it with `r`. */
export function schedule(prev: Sched, r: Rating, now: number, cfg: SchedulerSettings, seed = 0): Outcome {
  const elapsedDays = prev.last ? (now - prev.last) / DAY : 0;
  const mem = fsrsMemory(prev, r, elapsedDays);
  const s: Sched = { ...prev, ...mem, reps: prev.reps + 1, last: now };
  if (!s.ease) s.ease = cfg.startEase;
  const fz = seed * 31 + prev.reps;

  const toReview = (days: number) => {
    const ivl = Math.min(cfg.maxInterval, fuzz(days, fz, cfg));
    s.state = State.Review;
    s.step = 0;
    s.ivl = ivl;
    s.due = now + ivl * DAY;
  };

  if (prev.state === State.Review) {
    const iv = reviewIntervals(prev, now, cfg);
    if (r === 1) {
      s.lapses = prev.lapses + 1;
      s.ease = Math.max(1.3, s.ease - 0.2);
      s.ivl = cfg.algorithm === 'fsrs' ? iv.again : 1;
      if (cfg.relearnSteps.length) {
        s.state = State.Relearning;
        s.step = 0;
        s.due = now + cfg.relearnSteps[0] * MIN;
      } else toReview(s.ivl);
    } else {
      if (r === 2) s.ease = Math.max(1.3, s.ease - 0.15);
      if (r === 4) s.ease = s.ease + 0.15;
      toReview(r === 2 ? iv.hard : r === 3 ? iv.good : iv.easy);
    }
    return { sched: s, wait: s.due - now };
  }

  // New, Learning, Relearning: walk through the steps.
  const relearning = prev.state === State.Relearning;
  const steps = relearning ? cfg.relearnSteps : cfg.learnSteps;
  const step = prev.state === State.New ? 0 : Math.min(prev.step, Math.max(0, steps.length - 1));
  const learnState = relearning ? State.Relearning : State.Learning;

  const graduate = (rating: Rating) => {
    if (relearning) {
      const days = cfg.algorithm === 'fsrs' ? fsrsIvl(s.stability, cfg.retention, cfg.maxInterval) : Math.max(1, prev.ivl);
      toReview(rating === 4 ? days + 1 : days);
      return;
    }
    if (cfg.algorithm === 'fsrs') {
      const days = fsrsIvl(s.stability, cfg.retention, cfg.maxInterval);
      toReview(rating === 4 ? Math.max(days, 2) : days);
    } else {
      s.ease = cfg.startEase;
      toReview(rating === 4 ? cfg.easyIvl : cfg.graduatingIvl);
    }
  };

  if (!steps.length || r === 4) graduate(r === 4 ? 4 : 3);
  else if (r === 1) {
    s.state = learnState;
    s.step = 0;
    s.due = now + steps[0] * MIN;
  } else if (r === 2) {
    s.state = learnState;
    s.step = step;
    const delay = step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : step === 0 ? Math.min(steps[0] * 1.5, steps[0] + 1440) : steps[step];
    s.due = now + delay * MIN;
  } else {
    const next = prev.state === State.New ? 1 : step + 1;
    if (next >= steps.length) graduate(3);
    else {
      s.state = learnState;
      s.step = next;
      s.due = now + steps[next] * MIN;
    }
  }
  return { sched: s, wait: s.due - now };
}

/** What each answer button would do, for labelling the buttons. */
export function preview(prev: Sched, now: number, cfg: SchedulerSettings, seed = 0): Record<Rating, number> {
  return {
    1: schedule(prev, 1, now, cfg, seed).wait,
    2: schedule(prev, 2, now, cfg, seed).wait,
    3: schedule(prev, 3, now, cfg, seed).wait,
    4: schedule(prev, 4, now, cfg, seed).wait,
  };
}

/** Stable numeric seed from a card id. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}
