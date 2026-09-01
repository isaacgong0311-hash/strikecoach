import { analyzeStrategy, totalPayoff, samplePayoff, Leg } from '../src/lib/payoff';

describe('long call', () => {
  const legs: Leg[] = [{ type: 'call', strike: 50, premium: 3, position: 'long' }];

  it('has max loss equal to the premium paid', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(3);
  });

  it('has unlimited max profit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeNull();
  });

  it('breaks even at strike + premium', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([53]);
  });

  it('is worth -premium at price 0 and rises 1:1 above the strike', () => {
    expect(totalPayoff(legs, 0)).toBeCloseTo(-3);
    expect(totalPayoff(legs, 70)).toBeCloseTo(70 - 50 - 3);
  });
});

describe('long put', () => {
  const legs: Leg[] = [{ type: 'put', strike: 50, premium: 3, position: 'long' }];

  it('has max loss equal to the premium paid', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(3);
  });

  it('has bounded max profit (strike - premium, since price floors at 0)', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(47);
  });

  it('breaks even at strike - premium', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([47]);
  });
});

describe('covered call', () => {
  // Bought stock at 45, sold a 50-strike call for 2.
  const legs: Leg[] = [
    { type: 'stock', strike: 45, premium: 0, position: 'long' },
    { type: 'call', strike: 50, premium: 2, position: 'short' },
  ];

  it('caps max profit at (strike - cost) + premium received', () => {
    // (50 - 45) + 2 = 7
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(7);
  });

  it('breaks even at cost basis - premium received', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([43]);
  });
});

describe('long straddle', () => {
  const legs: Leg[] = [
    { type: 'call', strike: 50, premium: 3, position: 'long' },
    { type: 'put', strike: 50, premium: 3, position: 'long' },
  ];

  it('has two breakevens symmetric around the strike', () => {
    const { breakevens } = analyzeStrategy(legs);
    expect(breakevens).toEqual([44, 56]);
  });

  it('has unlimited max profit and bounded max loss equal to total premium', () => {
    const analysis = analyzeStrategy(legs);
    expect(analysis.maxProfit).toBeNull();
    expect(analysis.maxLoss).toBeCloseTo(6);
  });
});

describe('iron condor', () => {
  // long put 40 (0.5), short put 45 (1.5), short call 55 (1.5), long call 60 (0.5)
  const legs: Leg[] = [
    { type: 'put', strike: 40, premium: 0.5, position: 'long' },
    { type: 'put', strike: 45, premium: 1.5, position: 'short' },
    { type: 'call', strike: 55, premium: 1.5, position: 'short' },
    { type: 'call', strike: 60, premium: 0.5, position: 'long' },
  ];

  it('has bounded max profit and bounded max loss (both wings are hedged)', () => {
    const analysis = analyzeStrategy(legs);
    expect(analysis.maxProfit).not.toBeNull();
    expect(analysis.maxLoss).not.toBeNull();
  });

  it('has two breakevens', () => {
    expect(analyzeStrategy(legs).breakevens.length).toBe(2);
  });
});

// Strikes/premiums below mirror strategies.ts's variant-0 builder params
// exactly, so these tests validate the actual content-bank math, not
// reinvented numbers.

describe('protective put', () => {
  // long 100 shares at cost 50, long put strike 45 premium 2
  const legs: Leg[] = [
    { type: 'stock', strike: 50, premium: 0, position: 'long' },
    { type: 'put', strike: 45, premium: 2, position: 'long' },
  ];

  it('caps max loss at (cost - put strike) + premium paid', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(7);
  });

  it('has unlimited max profit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeNull();
  });

  it('breaks even at cost + premium paid', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([52]);
  });
});

describe('bull call spread', () => {
  // long call 45 (4), short call 55 (1.5)
  const legs: Leg[] = [
    { type: 'call', strike: 45, premium: 4, position: 'long' },
    { type: 'call', strike: 55, premium: 1.5, position: 'short' },
  ];

  it('caps max profit at spread width minus net debit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(7.5);
  });

  it('caps max loss at the net debit', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(2.5);
  });

  it('breaks even at lower strike + net debit', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([47.5]);
  });
});

describe('bear put spread', () => {
  // long put 55 (4), short put 45 (1.5)
  const legs: Leg[] = [
    { type: 'put', strike: 55, premium: 4, position: 'long' },
    { type: 'put', strike: 45, premium: 1.5, position: 'short' },
  ];

  it('caps max profit at spread width minus net debit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(7.5);
  });

  it('caps max loss at the net debit', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(2.5);
  });

  it('breaks even at upper strike - net debit', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([52.5]);
  });
});

describe('short straddle', () => {
  // short call 50 (3), short put 50 (3) — mirror image of the long straddle case
  const legs: Leg[] = [
    { type: 'call', strike: 50, premium: 3, position: 'short' },
    { type: 'put', strike: 50, premium: 3, position: 'short' },
  ];

  it('caps max profit at total premium received', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(6);
  });

  it('has unlimited max loss', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeNull();
  });

  it('has two breakevens symmetric around the strike', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([44, 56]);
  });
});

describe('long strangle', () => {
  // long put 45 (1.5), long call 55 (1.5)
  const legs: Leg[] = [
    { type: 'put', strike: 45, premium: 1.5, position: 'long' },
    { type: 'call', strike: 55, premium: 1.5, position: 'long' },
  ];

  it('caps max loss at total premium paid', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(3);
  });

  it('has unlimited max profit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeNull();
  });

  it('has two breakevens straddling both strikes', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([42, 58]);
  });
});

describe('butterfly spread', () => {
  // long call 40 (12), short call 50 x2 (5 each), long call 60 (1)
  const legs: Leg[] = [
    { type: 'call', strike: 40, premium: 12, position: 'long' },
    { type: 'call', strike: 50, premium: 5, position: 'short', quantity: 2 },
    { type: 'call', strike: 60, premium: 1, position: 'long' },
  ];

  it('caps max profit at (middle - lower strike) minus net debit', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(7);
  });

  it('caps max loss at the net debit, bounded on both sides', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(3);
  });

  it('has two breakevens symmetric around the middle strike', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([43, 57]);
  });
});

describe('collar', () => {
  // long 100 shares at cost 50, long put 45 (2), short call 55 (2) — a costless collar
  const legs: Leg[] = [
    { type: 'stock', strike: 50, premium: 0, position: 'long' },
    { type: 'put', strike: 45, premium: 2, position: 'long' },
    { type: 'call', strike: 55, premium: 2, position: 'short' },
  ];

  it('caps max profit at (call strike - cost) plus net premium', () => {
    expect(analyzeStrategy(legs).maxProfit).toBeCloseTo(5);
  });

  it('caps max loss at (cost - put strike) minus net premium', () => {
    expect(analyzeStrategy(legs).maxLoss).toBeCloseTo(5);
  });

  it('breaks even at cost, since the collar premiums cancel out', () => {
    expect(analyzeStrategy(legs).breakevens).toEqual([50]);
  });
});

describe('samplePayoff', () => {
  it('returns the requested number of points spanning the domain', () => {
    const legs: Leg[] = [{ type: 'call', strike: 50, premium: 3, position: 'long' }];
    const points = samplePayoff(legs, 0, 100, 10);
    expect(points).toHaveLength(11);
    expect(points[0].price).toBe(0);
    expect(points[points.length - 1].price).toBe(100);
  });
});
