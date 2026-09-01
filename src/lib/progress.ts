import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionCategory } from '../content/questions';

export const DAILY_FREE_DRILLS = 5;
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
  return { ...state, streak, lastActiveDate: today };
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
    const parsed = JSON.parse(raw) as ProgressState;
    return applyDailyReset(parsed, todayKey());
  } catch {
    return emptyProgress(todayKey());
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
