export const State = { New: 0, Learning: 1, Review: 2, Relearning: 3 } as const;
export type State = (typeof State)[keyof typeof State];

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const RATING_LABEL: Record<Rating, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

/** The scheduling part of a card. Both schedulers read and write these fields. */
export interface Sched {
  state: State;
  /** When the card is next due (ms epoch). */
  due: number;
  /** Index into the learning or relearning steps. */
  step: number;
  /** FSRS memory stability, in days. */
  stability: number;
  /** FSRS difficulty, 1–10. */
  difficulty: number;
  /** SM-2 ease factor (2.5 = 250%). */
  ease: number;
  /** Current interval in days (0 while learning). */
  ivl: number;
  reps: number;
  lapses: number;
  /** Last review (ms epoch), 0 if never. */
  last: number;
}

export interface SchedulerSettings {
  algorithm: 'fsrs' | 'sm2';
  /** FSRS: target probability of remembering a card when it comes due. */
  retention: number;
  /** Learning steps for new cards, minutes. */
  learnSteps: number[];
  /** Relearning steps after a lapse, minutes. */
  relearnSteps: number[];
  maxInterval: number; // days
  /** SM-2 */
  startEase: number;
  graduatingIvl: number; // days
  easyIvl: number; // days
  /** Randomise review intervals slightly so cards don't clump. */
  fuzz: boolean;
}

export const DEFAULT_SCHED: SchedulerSettings = {
  algorithm: 'fsrs',
  retention: 0.9,
  learnSteps: [1, 10],
  relearnSteps: [10],
  maxInterval: 36500,
  startEase: 2.5,
  graduatingIvl: 1,
  easyIvl: 4,
  fuzz: true,
};

export function newSched(now: number): Sched {
  return { state: State.New, due: now, step: 0, stability: 0, difficulty: 0, ease: 0, ivl: 0, reps: 0, lapses: 0, last: 0 };
}

export interface Outcome {
  sched: Sched;
  /** Time until due, ms. */
  wait: number;
}
