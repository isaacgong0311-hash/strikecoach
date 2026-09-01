import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emptyProgress,
  applyDailyReset,
  applyStreakForNewDay,
  recordAnswer,
  drillsRemainingToday,
  loadProgress,
  normalizeProgress,
  recentActivity,
  DAILY_FREE_DRILLS,
  HISTORY_DAYS,
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

describe('normalizeProgress (schema migration)', () => {
  it('fills activeDates when reading progress saved before the field existed', () => {
    // Exactly the shape the previous build persisted — no activeDates key.
    const legacy = {
      streak: 4,
      lastActiveDate: '2026-08-28',
      dailyResetDate: '2026-08-28',
      dailyDrillsUsed: 2,
      categoryStats: {
        'strategy-id': { attempts: 10, correct: 7 },
        'payoff-reading': { attempts: 0, correct: 0 },
      },
    };
    const next = normalizeProgress(legacy, '2026-08-29');
    expect(next.activeDates).toEqual([]);
    // ...without discarding the progress the user already had.
    expect(next.streak).toBe(4);
    expect(next.categoryStats['strategy-id']).toEqual({ attempts: 10, correct: 7 });
  });

  it('falls back to defaults for a null or non-object blob', () => {
    expect(normalizeProgress(null, '2026-08-29')).toEqual(emptyProgress('2026-08-29'));
  });

  it('repairs individually corrupt fields instead of throwing', () => {
    const corrupt = {
      streak: 'seven',
      activeDates: ['2026-08-28', 42, null],
      categoryStats: { 'strategy-id': { attempts: 'x' } },
    } as never;
    const next = normalizeProgress(corrupt, '2026-08-29');
    expect(next.streak).toBe(0);
    expect(next.activeDates).toEqual(['2026-08-28']);
    expect(next.categoryStats['strategy-id']).toEqual({ attempts: 0, correct: 0 });
  });
});

describe('activity history', () => {
  it('records the day on the first drill of that day', () => {
    const next = recordAnswer(emptyProgress('2026-08-29'), 'strategy-id', true, '2026-08-29');
    expect(next.activeDates).toEqual(['2026-08-29']);
  });

  it('does not double-record a second drill on the same day', () => {
    let s = recordAnswer(emptyProgress('2026-08-29'), 'strategy-id', true, '2026-08-29');
    s = recordAnswer(s, 'strategy-id', false, '2026-08-29');
    expect(s.activeDates).toEqual(['2026-08-29']);
  });

  it('accumulates across days, oldest first', () => {
    let s = recordAnswer(emptyProgress('2026-08-28'), 'strategy-id', true, '2026-08-28');
    s = recordAnswer(s, 'strategy-id', true, '2026-08-29');
    expect(s.activeDates).toEqual(['2026-08-28', '2026-08-29']);
  });

  it(`caps history at ${HISTORY_DAYS} days`, () => {
    let s = emptyProgress('2026-01-01');
    // 40 consecutive days, well past the cap.
    for (let i = 0; i < 40; i++) {
      const d = new Date(Date.UTC(2026, 0, 1 + i));
      s = recordAnswer(s, 'strategy-id', true, d.toISOString().slice(0, 10));
    }
    expect(s.activeDates).toHaveLength(HISTORY_DAYS);
    // The cap drops the OLDEST entries, keeping the most recent day.
    expect(s.activeDates[s.activeDates.length - 1]).toBe('2026-02-09');
  });
});

describe('recentActivity', () => {
  it('returns 7 days ending today, oldest first', () => {
    const days = recentActivity(emptyProgress('2026-08-29'), '2026-08-29');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-08-23');
    expect(days[6].date).toBe('2026-08-29');
    expect(days[6].isToday).toBe(true);
  });

  it('flags exactly the days the user actually drilled', () => {
    const state = { ...emptyProgress('2026-08-29'), activeDates: ['2026-08-27', '2026-08-29'] };
    const days = recentActivity(state, '2026-08-29');
    const active = days.filter((d) => d.active).map((d) => d.date);
    expect(active).toEqual(['2026-08-27', '2026-08-29']);
  });

  it('labels weekdays correctly (2026-08-29 is a Saturday)', () => {
    const days = recentActivity(emptyProgress('2026-08-29'), '2026-08-29');
    expect(days[6].label).toBe('S');
    expect(days.map((d) => d.label)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
  });

  it('ignores stored dates outside the window', () => {
    const state = { ...emptyProgress('2026-08-29'), activeDates: ['2026-07-01'] };
    expect(recentActivity(state, '2026-08-29').some((d) => d.active)).toBe(false);
  });
});

describe('loadProgress', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to fresh progress instead of throwing when AsyncStorage.getItem rejects', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage unavailable'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await loadProgress();

    expect(result.streak).toBe(0);
    expect(result.dailyDrillsUsed).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
  });
});
