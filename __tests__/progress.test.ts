import {
  emptyProgress,
  applyDailyReset,
  applyStreakForNewDay,
  recordAnswer,
  drillsRemainingToday,
  DAILY_FREE_DRILLS,
} from '../src/lib/progress';

describe('applyDailyReset', () => {
  it('leaves the state alone if the reset date is already today', () => {
    const state = { ...emptyProgress('2026-08-29'), dailyDrillsUsed: 3 };
    expect(applyDailyReset(state, '2026-08-29').dailyDrillsUsed).toBe(3);
  });

  it('zeroes the daily count when the stored date is not today', () => {
    const state = { ...emptyProgress('2026-08-28'), dailyDrillsUsed: 5 };
    const next = applyDailyReset(state, '2026-08-29');
    expect(next.dailyDrillsUsed).toBe(0);
    expect(next.dailyResetDate).toBe('2026-08-29');
  });
});

describe('applyStreakForNewDay', () => {
  it('starts a streak of 1 on the very first drill', () => {
    const state = emptyProgress('2026-08-29');
    expect(applyStreakForNewDay(state, '2026-08-29').streak).toBe(1);
  });

  it('increments the streak when active exactly one day after the last activity', () => {
    const state = { ...emptyProgress('2026-08-28'), streak: 4, lastActiveDate: '2026-08-28' };
    expect(applyStreakForNewDay(state, '2026-08-29').streak).toBe(5);
  });

  it('resets the streak to 1 after a gap of more than one day', () => {
    const state = { ...emptyProgress('2026-08-20'), streak: 10, lastActiveDate: '2026-08-20' };
    expect(applyStreakForNewDay(state, '2026-08-29').streak).toBe(1);
  });

  it('leaves the streak unchanged for a second drill on the same day', () => {
    const state = { ...emptyProgress('2026-08-29'), streak: 3, lastActiveDate: '2026-08-29' };
    expect(applyStreakForNewDay(state, '2026-08-29').streak).toBe(3);
  });
});

describe('recordAnswer', () => {
  it('increments daily count and category stats together', () => {
    const state = emptyProgress('2026-08-29');
    const next = recordAnswer(state, 'strategy-id', true, '2026-08-29');
    expect(next.dailyDrillsUsed).toBe(1);
    expect(next.categoryStats['strategy-id']).toEqual({ attempts: 1, correct: 1 });
    expect(next.streak).toBe(1);
  });

  it('tracks incorrect answers without crediting them as correct', () => {
    const state = emptyProgress('2026-08-29');
    const next = recordAnswer(state, 'payoff-reading', false, '2026-08-29');
    expect(next.categoryStats['payoff-reading']).toEqual({ attempts: 1, correct: 0 });
  });
});

describe('drillsRemainingToday', () => {
  it('is unlimited (Infinity) for Pro users', () => {
    const state = emptyProgress('2026-08-29');
    expect(drillsRemainingToday(state, true, '2026-08-29')).toBe(Infinity);
  });

  it('counts down from the daily free cap for free users', () => {
    const state = { ...emptyProgress('2026-08-29'), dailyDrillsUsed: 2 };
    expect(drillsRemainingToday(state, false, '2026-08-29')).toBe(DAILY_FREE_DRILLS - 2);
  });

  it('never goes negative once the cap is exceeded', () => {
    const state = { ...emptyProgress('2026-08-29'), dailyDrillsUsed: DAILY_FREE_DRILLS + 3 };
    expect(drillsRemainingToday(state, false, '2026-08-29')).toBe(0);
  });
});
