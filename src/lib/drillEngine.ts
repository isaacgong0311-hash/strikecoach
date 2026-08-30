import { Question, QuestionCategory, QUESTIONS } from '../content/questions';

/** Free users only get the Strategy ID category; Payoff Reading is a Pro unlock. */
const FREE_CATEGORIES: QuestionCategory[] = ['strategy-id'];
const ALL_CATEGORIES: QuestionCategory[] = ['strategy-id', 'payoff-reading'];

export function unlockedCategories(isPro: boolean): QuestionCategory[] {
  return isPro ? ALL_CATEGORIES : FREE_CATEGORIES;
}

export function availableQuestions(isPro: boolean): Question[] {
  const categories = unlockedCategories(isPro);
  return QUESTIONS.filter((q) => categories.includes(q.category));
}

export interface DrillSessionState {
  /** Question ids seen so far this session, in order. */
  seenIds: string[];
  /** Question ids the user answered incorrectly this session, for spaced-repetition fallback. */
  missedIds: string[];
}

export function newSession(): DrillSessionState {
  return { seenIds: [], missedIds: [] };
}

/**
 * Pick the next question for the session. Prefers unseen questions (in stable
 * content order); once the pool is exhausted, falls back to re-serving missed
 * questions so a bad answer doesn't just disappear; if nothing was missed either,
 * cycles from the top of the pool. Returns null only if the pool itself is empty.
 */
export function pickNextQuestion(pool: Question[], session: DrillSessionState): Question | null {
  if (pool.length === 0) return null;

  const unseen = pool.filter((q) => !session.seenIds.includes(q.id));
  if (unseen.length > 0) return unseen[0];

  const missedPool = pool.filter((q) => session.missedIds.includes(q.id));
  if (missedPool.length > 0) return missedPool[0];

  return pool[session.seenIds.length % pool.length];
}

export function recordSessionAnswer(session: DrillSessionState, question: Question, correct: boolean): DrillSessionState {
  return {
    seenIds: [...session.seenIds, question.id],
    missedIds: correct ? session.missedIds.filter((id) => id !== question.id) : [...session.missedIds, question.id],
  };
}
