import { encodeSessionLog, decodeSessionLog, summarize, SessionEntry } from '../src/lib/sessionLog';

const SAMPLE: SessionEntry[] = [
  { prompt: 'Which strategy does this payoff diagram show?', answer: 'Long Call', correct: true },
  { prompt: 'What is the maximum loss for this Iron Condor?', answer: '$3.00', correct: false },
  { prompt: 'What is the breakeven price for this Long Put?', answer: '$47.00', correct: true },
];

describe('session log round-trip', () => {
  it('survives encode then decode unchanged', () => {
    expect(decodeSessionLog(encodeSessionLog(SAMPLE))).toEqual(SAMPLE);
  });

  it('handles an empty session', () => {
    expect(decodeSessionLog(encodeSessionLog([]))).toEqual([]);
  });

  it('preserves prompts containing quotes and unicode', () => {
    const tricky: SessionEntry[] = [
      { prompt: 'Is this a "straddle" — or a strangle?', answer: 'Δ / ∂ · $1.00', correct: false },
    ];
    expect(decodeSessionLog(encodeSessionLog(tricky))).toEqual(tricky);
  });
});

describe('decodeSessionLog is total (never throws)', () => {
  it('returns [] for undefined, null, or empty input', () => {
    expect(decodeSessionLog(undefined)).toEqual([]);
    expect(decodeSessionLog(null)).toEqual([]);
    expect(decodeSessionLog('')).toEqual([]);
  });

  it('returns [] for malformed JSON', () => {
    expect(decodeSessionLog('[[Not valid')).toEqual([]);
    expect(decodeSessionLog('not json at all')).toEqual([]);
  });

  it('returns [] when the payload is valid JSON but not an array', () => {
    expect(decodeSessionLog('{"a":1}')).toEqual([]);
    expect(decodeSessionLog('42')).toEqual([]);
  });

  it('drops individually malformed rows but keeps the good ones', () => {
    const mixed = JSON.stringify([
      ['Good prompt', 'Good answer', 1],
      ['missing the third field'],
      [123, 'non-string prompt', 1],
      'not a row',
      null,
      ['Another good one', '$5.00', 0],
    ]);
    expect(decodeSessionLog(mixed)).toEqual([
      { prompt: 'Good prompt', answer: 'Good answer', correct: true },
      { prompt: 'Another good one', answer: '$5.00', correct: false },
    ]);
  });

  it('accepts either 1/0 or true/false for the correct flag', () => {
    const raw = JSON.stringify([
      ['a', 'b', true],
      ['c', 'd', false],
      ['e', 'f', 1],
      ['g', 'h', 0],
    ]);
    expect(decodeSessionLog(raw).map((e) => e.correct)).toEqual([true, false, true, false]);
  });
});

describe('summarize', () => {
  it('counts correct answers and computes a rounded percentage', () => {
    expect(summarize(SAMPLE)).toEqual({ correct: 2, total: 3, pct: 67 });
  });

  it('reports 0% for an empty session without dividing by zero', () => {
    expect(summarize([])).toEqual({ correct: 0, total: 0, pct: 0 });
  });

  it('reports 100% when everything is correct', () => {
    expect(summarize([{ prompt: 'p', answer: 'a', correct: true }])).toEqual({ correct: 1, total: 1, pct: 100 });
  });
});
