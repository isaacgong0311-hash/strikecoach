/**
 * Options payoff-at-expiration math. Pure functions, no I/O — everything here is
 * deterministic and unit-testable independent of React Native / the simulator.
 *
 * A strategy is a list of Legs. Each leg is one option (or the underlying stock)
 * held long or short. Total strategy P&L at a given underlying price is the sum
 * of each leg's payoff at that price.
 */

export type OptionType = 'call' | 'put' | 'stock';
export type Position = 'long' | 'short';

export interface Leg {
  type: OptionType;
  /** Strike price for options; cost basis per share for a stock leg. */
  strike: number;
  /** Premium paid (if long) or received (if short) per share. Always >= 0. Ignored for stock legs. */
  premium: number;
  position: Position;
  /** Number of contracts/shares, default 1. Used by strategies like butterflies that double up a leg. */
  quantity?: number;
}

export interface Point {
  price: number;
  pnl: number;
}

export interface StrategyAnalysis {
  maxProfit: number | null; // null = unlimited
  maxLoss: number | null; // null = unlimited (as a positive magnitude, i.e. "you could lose $X")
  breakevens: number[]; // sorted ascending
}

function intrinsicValue(leg: Leg, price: number): number {
  switch (leg.type) {
    case 'call':
      return Math.max(price - leg.strike, 0);
    case 'put':
      return Math.max(leg.strike - price, 0);
    case 'stock':
      return price - leg.strike;
  }
}

/** P&L contribution of a single leg at a given underlying price at expiration. */
export function legPayoff(leg: Leg, price: number): number {
  const qty = leg.quantity ?? 1;
  const sign = leg.position === 'long' ? 1 : -1;
  const cashFlow = leg.type === 'stock' ? 0 : leg.position === 'long' ? -leg.premium : leg.premium;
  return qty * (sign * intrinsicValue(leg, price) + cashFlow);
}

/** Total strategy P&L at a given underlying price at expiration. */
export function totalPayoff(legs: Leg[], price: number): number {
  return legs.reduce((sum, leg) => sum + legPayoff(leg, price), 0);
}

/**
 * Net slope of the payoff line as price -> infinity. Puts contribute 0 (they go
 * out of the money and flatten). Calls and stock contribute +/-quantity depending
 * on long/short. A positive slope means unlimited upside profit; negative means
 * unlimited upside loss; zero means the payoff plateaus at high prices.
 */
function netSlopeAtInfinity(legs: Leg[]): number {
  return legs.reduce((slope, leg) => {
    if (leg.type === 'put') return slope;
    const qty = leg.quantity ?? 1;
    const dir = leg.position === 'long' ? 1 : -1;
    return slope + dir * qty;
  }, 0);
}

/**
 * Analyze a strategy's max profit, max loss, and breakeven price(s). Because every
 * leg's payoff is piecewise-linear, the function's extrema occur only at price=0
 * or at one of the strikes (kinks) — plus the two infinite tails, whose direction
 * is captured by netSlopeAtInfinity. This lets us compute exact answers without
 * numerical search.
 */
export function analyzeStrategy(legs: Leg[]): StrategyAnalysis {
  const strikes = legs.map((l) => l.strike);
  const candidates = Array.from(new Set([0, ...strikes])).sort((a, b) => a - b);
  const values = candidates.map((p) => totalPayoff(legs, p));

  const finiteMax = Math.max(...values);
  const finiteMin = Math.min(...values);
  const slopeInf = netSlopeAtInfinity(legs);

  const maxProfit = slopeInf > 0 ? null : finiteMax;
  const maxLoss = slopeInf < 0 ? null : -finiteMin; // report as a positive magnitude

  // Breakevens: scan each finite segment plus one synthetic "far" segment that
  // represents the terminal (rightmost) slope, and linearly interpolate any
  // zero-crossing.
  const farPrice = candidates[candidates.length - 1] + Math.max(50, candidates[candidates.length - 1] || 50);
  const scanPoints = [...candidates, farPrice];
  const breakevens: number[] = [];
  for (let i = 0; i < scanPoints.length - 1; i++) {
    const p1 = scanPoints[i];
    const p2 = scanPoints[i + 1];
    const v1 = totalPayoff(legs, p1);
    const v2 = totalPayoff(legs, p2);
    if (Math.abs(v1) < 1e-9) {
      breakevens.push(p1);
    } else if (v1 * v2 < 0) {
      const t = v1 / (v1 - v2);
      breakevens.push(p1 + t * (p2 - p1));
    }
  }
  const lastP = scanPoints[scanPoints.length - 1];
  if (Math.abs(totalPayoff(legs, lastP)) < 1e-9) breakevens.push(lastP);

  const rounded = breakevens.map((b) => Math.round(b * 100) / 100);
  const unique = Array.from(new Set(rounded)).sort((a, b) => a - b);
  return { maxProfit, maxLoss, breakevens: unique };
}

/** Dense sample of (price, pnl) points across a domain, for SVG chart rendering. */
export function samplePayoff(legs: Leg[], domainMin: number, domainMax: number, steps = 48): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const price = domainMin + ((domainMax - domainMin) * i) / steps;
    points.push({ price, pnl: totalPayoff(legs, price) });
  }
  return points;
}
