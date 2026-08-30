import { unlockedCategories, availableQuestions, newSession, pickNextQuestion, recordSessionAnswer } from '../src/lib/drillEngine';
import { QUESTIONS, Question } from '../src/content/questions';

describe('unlockedCategories', () => {
  it('restricts free users to strategy-id only', () => {
    expect(unlockedCategories(false)).toEqual(['strategy-id']);
  });

  it('gives Pro users both categories', () => {
    expect(unlockedCategories(true)).toEqual(['strategy-id', 'payoff-reading']);
  });
});

describe('availableQuestions', () => {
  it('never returns a payoff-reading question to a free user', () => {
    const questions = availableQuestions(false);
    expect(questions.every((q) => q.category === 'strategy-id')).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('includes both categories for Pro users', () => {
    const categories = new Set(availableQuestions(true).map((q) => q.category));
    expect(categories.has('strategy-id')).toBe(true);
    expect(categories.has('payoff-reading')).toBe(true);
  });
});

describe('pickNextQuestion', () => {
  const pool: Question[] = QUESTIONS.slice(0, 3);

  it('never repeats a question while unseen ones remain', () => {
    let session = newSession();
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const q = pickNextQuestion(pool, session);
      expect(q).not.toBeNull();
      expect(seen.has(q!.id)).toBe(false);
      seen.add(q!.id);
      session = recordSessionAnswer(session, q!, true);
    }
  });

  it('falls back to a missed question once the pool is exhausted', () => {
    let session = newSession();
    // Answer the first question wrong, the rest right.
    for (let i = 0; i < pool.length; i++) {
      const q = pickNextQuestion(pool, session)!;
      session = recordSessionAnswer(session, q, i !== 0);
    }
    const next = pickNextQuestion(pool, session);
    expect(next!.id).toBe(pool[0].id);
  });

  it('returns null for an empty pool', () => {
    expect(pickNextQuestion([], newSession())).toBeNull();
  });
});
