import { QUESTIONS } from '../src/content/questions';

/**
 * A regression guard over the whole generated content bank, not just the
 * math primitives it's built from. This is an education app — a broken
 * question (duplicate choices, a correct index that doesn't match the
 * explanation) is a credibility problem, not just a bug. This test would
 * catch a bad content-generator change even if the underlying payoff math
 * it's built on is individually correct.
 */
describe('content integrity — every generated question', () => {
  it('has exactly 4 unique choices', () => {
    for (const q of QUESTIONS) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
    }
  });

  it('has a correctIndex that actually points at one of its choices', () => {
    for (const q of QUESTIONS) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
    }
  });

  it('has a non-empty prompt and explanation', () => {
    for (const q of QUESTIONS) {
      expect(q.prompt.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it('strategy-id questions: the correct choice is the strategy the explanation describes', () => {
    const strategyIdQs = QUESTIONS.filter((q) => q.category === 'strategy-id');
    expect(strategyIdQs.length).toBeGreaterThan(0);
    for (const q of strategyIdQs) {
      const correctChoice = q.choices[q.correctIndex];
      // describeStrategy() always opens with "<Strategy Name>: max profit ..."
      expect(q.explanation.startsWith(correctChoice)).toBe(true);
    }
  });

  it('has a non-trivial, roughly balanced number of questions in both categories', () => {
    const byCategory = QUESTIONS.reduce<Record<string, number>>((acc, q) => {
      acc[q.category] = (acc[q.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(byCategory['strategy-id']).toBeGreaterThan(10);
    expect(byCategory['payoff-reading']).toBeGreaterThan(10);
  });

  it('has no duplicate question ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
