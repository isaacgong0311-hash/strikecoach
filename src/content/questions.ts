import { STRATEGY_INSTANCES, STRATEGY_NAMES, StrategyInstance } from './strategies';
import { Point } from '../lib/payoff';

export type QuestionCategory = 'strategy-id' | 'payoff-reading';

export interface Question {
  id: string;
  category: QuestionCategory;
  prompt: string;
  points: Point[];
  domain: [number, number];
  choices: string[];
  correctIndex: number;
  explanation: string;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatMetric(value: number | null): string {
  return value === null ? 'Unlimited' : formatMoney(value);
}

/** Deterministic pseudo-shuffle so content generation is stable and testable
 * (no Math.random anywhere in the content pipeline). */
function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length;
  const shift = ((by % n) + n) % n;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

function buildStrategyIdQuestion(instance: StrategyInstance, index: number): Question {
  const distractorPool = STRATEGY_NAMES.filter((n) => n !== instance.strategyName);
  const distractors = rotate(distractorPool, index * 3).slice(0, 3);
  const choices = rotate([instance.strategyName, ...distractors], index % 4);
  const correctIndex = choices.indexOf(instance.strategyName);

  return {
    id: `sid-${instance.id}`,
    category: 'strategy-id',
    prompt: 'Which strategy does this payoff diagram show?',
    points: instance.points,
    domain: instance.domain,
    choices,
    correctIndex,
    explanation: describeStrategy(instance),
  };
}

function describeStrategy(instance: StrategyInstance): string {
  const { maxProfit, maxLoss, breakevens } = instance.analysis;
  const be = breakevens.length === 1 ? formatMoney(breakevens[0]) : breakevens.map(formatMoney).join(' / ');
  return `${instance.strategyName}: max profit ${formatMetric(maxProfit)}, max loss ${formatMetric(
    maxLoss
  )}, breakeven ${be}.`;
}

type MetricKind = 'max-profit' | 'max-loss' | 'breakeven';

function buildPayoffReadingQuestion(instance: StrategyInstance, index: number): Question | null {
  const kinds: MetricKind[] = ['max-profit', 'max-loss', 'breakeven'];
  const kind = kinds[index % 3];
  const { maxProfit, maxLoss, breakevens } = instance.analysis;

  let correctValue: number | null;
  let promptLabel: string;
  if (kind === 'max-profit') {
    correctValue = maxProfit;
    promptLabel = 'maximum profit';
  } else if (kind === 'max-loss') {
    correctValue = maxLoss;
    promptLabel = 'maximum loss';
  } else {
    if (breakevens.length === 0) return null;
    correctValue = breakevens[0];
    promptLabel = breakevens.length > 1 ? 'lower breakeven price' : 'breakeven price';
  }

  const correctLabel = formatMetric(correctValue);

  // Build 3 plausible-but-wrong numeric distractors.
  const base = correctValue ?? Math.max(...instance.points.map((p) => Math.abs(p.pnl)), 10);
  const distractorValues = [base * 0.5 + 2, base * 1.6 + 3, base + (index % 2 === 0 ? 15 : -12)]
    .map((v) => Math.round(Math.max(v, 1) * 100) / 100)
    .map((v) => formatMoney(v));

  // Unlimited is always a live option in the pool for max-profit/max-loss questions
  // so a student has to actually read the diagram's tails, not just pattern-match "a dollar amount".
  const extraPool = kind === 'breakeven' ? distractorValues : [...distractorValues.slice(0, 2), 'Unlimited'];
  const pool = Array.from(new Set(extraPool)).filter((v) => v !== correctLabel).slice(0, 3);
  while (pool.length < 3) pool.push(formatMoney(base + pool.length * 7 + 4));

  const choices = rotate([correctLabel, ...pool], index % 4);
  const correctIndex = choices.indexOf(correctLabel);

  return {
    id: `pr-${instance.id}-${kind}`,
    category: 'payoff-reading',
    prompt: `What is the ${promptLabel} for this ${instance.strategyName}?`,
    points: instance.points,
    domain: instance.domain,
    choices,
    correctIndex,
    explanation: describeStrategy(instance),
  };
}

const strategyIdQuestions = STRATEGY_INSTANCES.map((instance, i) => buildStrategyIdQuestion(instance, i));
const payoffReadingQuestions = STRATEGY_INSTANCES.map((instance, i) => buildPayoffReadingQuestion(instance, i)).filter(
  (q): q is Question => q !== null
);

export const QUESTIONS: Question[] = [...strategyIdQuestions, ...payoffReadingQuestions];

export function questionsByCategory(category: QuestionCategory): Question[] {
  return QUESTIONS.filter((q) => q.category === category);
}
