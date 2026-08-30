import { Leg, analyzeStrategy, samplePayoff, StrategyAnalysis, Point } from '../lib/payoff';

export interface StrategyInstance {
  id: string;
  strategyKey: string;
  strategyName: string;
  legs: Leg[];
  domain: [number, number];
  analysis: StrategyAnalysis;
  points: Point[];
}

interface Builder {
  key: string;
  name: string;
  build: (variant: number) => { legs: Leg[]; domain: [number, number] };
}

// Each builder produces 2 concrete numeric variants so the drill content isn't
// repetitive. Strikes/premiums are hand-picked to be realistic (round-ish
// numbers, premium << strike) rather than randomly generated.

const BUILDERS: Builder[] = [
  {
    key: 'long-call',
    name: 'Long Call',
    build: (v) => {
      const [strike, premium] = v === 0 ? [50, 3] : [100, 6];
      return { legs: [{ type: 'call', strike, premium, position: 'long' }], domain: [0, strike * 2] };
    },
  },
  {
    key: 'long-put',
    name: 'Long Put',
    build: (v) => {
      const [strike, premium] = v === 0 ? [50, 3] : [80, 4];
      return { legs: [{ type: 'put', strike, premium, position: 'long' }], domain: [0, strike * 2] };
    },
  },
  {
    key: 'covered-call',
    name: 'Covered Call',
    build: (v) => {
      const [cost, strike, premium] = v === 0 ? [45, 50, 2] : [95, 105, 4];
      return {
        legs: [
          { type: 'stock', strike: cost, premium: 0, position: 'long' },
          { type: 'call', strike, premium, position: 'short' },
        ],
        domain: [0, strike * 1.8],
      };
    },
  },
  {
    key: 'protective-put',
    name: 'Protective Put',
    build: (v) => {
      const [cost, strike, premium] = v === 0 ? [50, 45, 2] : [100, 90, 5];
      return {
        legs: [
          { type: 'stock', strike: cost, premium: 0, position: 'long' },
          { type: 'put', strike, premium, position: 'long' },
        ],
        domain: [0, cost * 1.8],
      };
    },
  },
  {
    key: 'bull-call-spread',
    name: 'Bull Call Spread',
    build: (v) => {
      const [lo, hi, pLo, pHi] = v === 0 ? [45, 55, 4, 1.5] : [90, 110, 8, 3];
      return {
        legs: [
          { type: 'call', strike: lo, premium: pLo, position: 'long' },
          { type: 'call', strike: hi, premium: pHi, position: 'short' },
        ],
        domain: [0, hi * 1.6],
      };
    },
  },
  {
    key: 'bear-put-spread',
    name: 'Bear Put Spread',
    build: (v) => {
      const [hi, lo, pHi, pLo] = v === 0 ? [55, 45, 4, 1.5] : [110, 90, 8, 3];
      return {
        legs: [
          { type: 'put', strike: hi, premium: pHi, position: 'long' },
          { type: 'put', strike: lo, premium: pLo, position: 'short' },
        ],
        domain: [0, hi * 1.6],
      };
    },
  },
  {
    key: 'long-straddle',
    name: 'Long Straddle',
    build: (v) => {
      const [strike, pCall, pPut] = v === 0 ? [50, 3, 3] : [100, 6, 5.5];
      return {
        legs: [
          { type: 'call', strike, premium: pCall, position: 'long' },
          { type: 'put', strike, premium: pPut, position: 'long' },
        ],
        domain: [0, strike * 1.8],
      };
    },
  },
  {
    key: 'short-straddle',
    name: 'Short Straddle',
    build: (v) => {
      const [strike, pCall, pPut] = v === 0 ? [50, 3, 3] : [100, 6, 5.5];
      return {
        legs: [
          { type: 'call', strike, premium: pCall, position: 'short' },
          { type: 'put', strike, premium: pPut, position: 'short' },
        ],
        domain: [0, strike * 1.8],
      };
    },
  },
  {
    key: 'long-strangle',
    name: 'Long Strangle',
    build: (v) => {
      const [lo, hi, pPut, pCall] = v === 0 ? [45, 55, 1.5, 1.5] : [90, 110, 3, 3];
      return {
        legs: [
          { type: 'put', strike: lo, premium: pPut, position: 'long' },
          { type: 'call', strike: hi, premium: pCall, position: 'long' },
        ],
        domain: [0, hi * 1.8],
      };
    },
  },
  {
    key: 'iron-condor',
    name: 'Iron Condor',
    build: (v) => {
      const [k1, k2, k3, k4] = v === 0 ? [40, 45, 55, 60] : [80, 90, 110, 120];
      const [p1, p2, p3, p4] = v === 0 ? [0.5, 1.5, 1.5, 0.5] : [1, 3, 3, 1];
      return {
        legs: [
          { type: 'put', strike: k1, premium: p1, position: 'long' },
          { type: 'put', strike: k2, premium: p2, position: 'short' },
          { type: 'call', strike: k3, premium: p3, position: 'short' },
          { type: 'call', strike: k4, premium: p4, position: 'long' },
        ],
        domain: [0, k4 * 1.5],
      };
    },
  },
  {
    key: 'butterfly-spread',
    name: 'Butterfly Spread',
    build: (v) => {
      const [k1, k2, k3] = v === 0 ? [40, 50, 60] : [90, 100, 110];
      const [p1, p2, p3] = v === 0 ? [12, 5, 1] : [15, 6, 1.5];
      return {
        legs: [
          { type: 'call', strike: k1, premium: p1, position: 'long' },
          { type: 'call', strike: k2, premium: p2, position: 'short', quantity: 2 },
          { type: 'call', strike: k3, premium: p3, position: 'long' },
        ],
        domain: [0, k3 * 1.6],
      };
    },
  },
  {
    key: 'collar',
    name: 'Collar',
    build: (v) => {
      const [cost, putK, callK, pPut, pCall] = v === 0 ? [50, 45, 55, 2, 2] : [100, 90, 110, 4, 4];
      return {
        legs: [
          { type: 'stock', strike: cost, premium: 0, position: 'long' },
          { type: 'put', strike: putK, premium: pPut, position: 'long' },
          { type: 'call', strike: callK, premium: pCall, position: 'short' },
        ],
        domain: [0, cost * 1.8],
      };
    },
  },
];

export const STRATEGY_NAMES: string[] = BUILDERS.map((b) => b.name);

function buildInstance(builder: Builder, variant: number): StrategyInstance {
  const { legs, domain } = builder.build(variant);
  const analysis = analyzeStrategy(legs);
  const points = samplePayoff(legs, domain[0], domain[1]);
  return {
    id: `${builder.key}-${variant}`,
    strategyKey: builder.key,
    strategyName: builder.name,
    legs,
    domain,
    analysis,
    points,
  };
}

export const STRATEGY_INSTANCES: StrategyInstance[] = BUILDERS.flatMap((builder) => [
  buildInstance(builder, 0),
  buildInstance(builder, 1),
]);
