import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionCategory } from '../content/questions';

export const DAILY_FREE_DRILLS = 5;
/** How many days of activity history to keep — only ever rendered as a
 * 7-day strip, so a small buffer beyond that is plenty. */
export const HISTORY_DAYS = 30;
const STORAGE_KEY = 'strikecoach.progress.v1';

export interface CategoryStats {
  attempts: number;
  correct: number;
}

export interface ProgressState {
  streak: number;
  /** YYYY-MM-DD of the last calendar day the user completed at least one drill. */
  lastActiveDate: string | null;
  /** YYYY-MM-DD this dailyDrillsUsed count applies to. */
  dailyResetDate: string;
  dailyDrillsUsed: number;
  categoryStats: Record<QuestionCategory, CategoryStats>;
  /** Every YYYY-MM-DD the user drilled on, oldest first, capped to
   * HISTORY_DAYS. Powers the dashboard's activity strip. */
  activeDates: string[];
}

export function emptyProgress(today: string): ProgressState {
  return {
    streak: 0,
    lastActiveDate: null,
    dailyResetDate: today,
    dailyDrillsUsed: 0,
    categoryStats: {
      'strategy-id': { attempts: 0, correct: 0 },
      'payoff-reading': { attempts: 0, correct: 0 },
    },
    activeDates: [],
  };
}

/**
 * Coerce a parsed blob into a complete ProgressState. Persisted progress from
 * an earlier build won't have fields added since — reading one straight back
 * would leave `activeDates` undefined and crash the first `.map` over it. This
 * fills any missing/!wrong-typed field from a fresh default rather than
 * trusting the shape on disk.
 */
export function normalizeProgress(parsed: Partial<ProgressState> | null, today: string): ProgressState {
  const base = emptyProgress(today);
  if (!parsed || typeof parsed !== 'object') return base;
  const stats = parsed.categoryStats ?? base.categoryStats;
  const statFor = (k: QuestionCategory): CategoryStats => {
    const s = stats?.[k];
    return s && typeof s.attempts === 'number' && typeof s.correct === 'number' ? s : { attempts: 0, correct: 0 };
  };
  return {
    streak: typeof parsed.streak === 'number' ? parsed.streak : base.streak,
    lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : base.lastActiveDate,
    dailyResetDate: typeof parsed.dailyResetDate === 'string' ? parsed.dailyResetDate : base.dailyResetDate,
    dailyDrillsUsed: typeof parsed.dailyDrillsUsed === 'number' ? parsed.dailyDrillsUsed : base.dailyDrillsUsed,
    categoryStats: {
      'strategy-id': statFor('strategy-id'),
      'payoff-reading': statFor('payoff-reading'),
    },
    activeDates: Array.isArray(parsed.activeDates)
      ? parsed.activeDates.filter((d): d is string => typeof d === 'string')
      : base.activeDates,
  };
}

/** Local-date key (not UTC) so a day boundary matches what the user actually sees. */
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Roll the daily free-drill counter over if the stored reset date isn't today.
 * Pure function — no I/O — so it's directly unit-testable. */
export function applyDailyReset(state: ProgressState, today: string): ProgressState {
  if (state.dailyResetDate === today) return state;
  return { ...state, dailyResetDate: today, dailyDrillsUsed: 0 };
}

/** Recompute the streak as of completing the FIRST drill of a (possibly new) day.
 * - Same day as last activity: streak unchanged.
 * - Exactly one day after last activity: streak + 1.
 * - Any bigger gap (or first-ever drill): streak resets to 1.
 * Pure function, directly unit-testable. */
export function applyStreakForNewDay(state: ProgressState, today: string): ProgressState {
  if (state.lastActiveDate === today) return state;
  const gap = state.lastActiveDate ? daysBetween(state.lastActiveDate, today) : null;
  const streak = gap === 1 ? state.streak + 1 : 1;
  // This branch is exactly "first drill of a new day", so it's also where the
  // activity history gains an entry.
  const activeDates = [...state.activeDates.filter((d) => d !== today), today].slice(-HISTORY_DAYS);
  return { ...state, streak, lastActiveDate: today, activeDates };
}

export interface ActivityDay {
  date: string;
  /** Single-letter weekday label (S M T W T F S), for the strip's axis. */
  label: string;
  active: boolean;
  isToday: boolean;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The last `days` calendar days ending today, oldest first, each flagged with
 * whether the user drilled that day. Pure — the caller supplies "today". */
export function recentActivity(state: ProgressState, today: string = todayKey(), days = 7): ActivityDay[] {
  const seen = new Set(state.activeDates);
  const end = new Date(`${today}T00:00:00`);
  const out: ActivityDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86_400_000);
    const key = todayKey(d);
    out.push({
      date: key,
      label: WEEKDAY_LETTERS[d.getDay()],
      active: seen.has(key),
      isToday: key === today,
    });
  }
  return out;
}

/** Record one answered drill. Pure function — combines the daily-reset and streak
 * rules above with the per-category accuracy bookkeeping. */
export function recordAnswer(
  state: ProgressState,
  category: QuestionCategory,
  correct: boolean,
  today: string = todayKey()
): ProgressState {
  let next = applyDailyReset(state, today);
  next = applyStreakForNewDay(next, today);
  const prevStats = next.categoryStats[category];
  return {
    ...next,
    dailyDrillsUsed: next.dailyDrillsUsed + 1,
    categoryStats: {
      ...next.categoryStats,
      [category]: {
        attempts: prevStats.attempts + 1,
        correct: prevStats.correct + (correct ? 1 : 0),
      },
    },
  };
}

export function drillsRemainingToday(state: ProgressState, isPro: boolean, today: string = todayKey()): number {
  if (isPro) return Infinity;
  const reset = applyDailyReset(state, today);
  return Math.max(0, DAILY_FREE_DRILLS - reset.dailyDrillsUsed);
}

export async function loadProgress(): Promise<ProgressState> {
  // The read itself (not just JSON.parse) can throw on rare storage failures
  // (corrupted native storage, some Android edge cases) — falling back to
  // fresh progress beats crashing on launch over what's just local stats.
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[progress] AsyncStorage read failed, starting fresh', err);
    return emptyProgress(todayKey());
  }
  if (!raw) return emptyProgress(todayKey());
  try {
    const today = todayKey();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return applyDailyReset(normalizeProgress(parsed, today), today);
  } catch {
    return emptyProgress(todayKey());
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
