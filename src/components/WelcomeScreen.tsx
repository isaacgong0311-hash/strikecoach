import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PayoffDiagram from './PayoffDiagram';
import SectionHeader from './SectionHeader';
import Button from './Button';
import Wordmark from './Wordmark';
import { STRATEGY_INSTANCES, StrategyInstance } from '../content/strategies';
import { QUESTIONS, questionsByCategory } from '../content/questions';
import { DAILY_FREE_DRILLS } from '../lib/progress';
import { color, space, type, radius } from '../theme';

/** One instance per strategy (the builders emit two numeric variants each). */
const LIBRARY = STRATEGY_INSTANCES.filter((s) => s.id.endsWith('-0'));
const SAMPLE = LIBRARY.find((s) => s.strategyKey === 'iron-condor')!;

function fmtMetric(v: number | null): string {
  return v === null ? 'Unlimited' : `$${v.toFixed(2)}`;
}

function breakevenLabel(bes: number[]): string {
  if (bes.length === 0) return '—';
  return bes.map((b) => `$${b.toFixed(0)}`).join(' / ');
}

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <Wordmark />
        <Text style={styles.kicker}>Free to start · options intuition · no signup</Text>

        <Text style={styles.heroTitle}>
          Read the chart.{'\n'}Call <Text style={styles.heroAccent}>the strategy.</Text>
        </Text>
        <Text style={styles.heroBody}>
          Payoff diagrams, strategy identification, breakevens — drilled like flashcards, not read
          like a textbook. Every diagram is generated from a real options-pricing engine, so the
          numbers you're quizzed on are exact, never approximated.
        </Text>

        <Button title="Start drilling" onPress={onStart} arrow />
        <Text style={styles.microcopy}>
          {DAILY_FREE_DRILLS} free drills a day · Works offline · No account required
        </Text>

        {/* ── Sample drill ─────────────────────────────────────── */}
        <View style={styles.sampleCard}>
          <View style={styles.sampleHead}>
            <Text style={type.label}>SAMPLE DRILL</Text>
            <Text style={styles.sampleTag}>STRATEGY ID</Text>
          </View>
          <Text style={styles.sampleQuestion}>Which strategy does this payoff diagram show?</Text>
          <PayoffDiagram points={SAMPLE.points} domain={SAMPLE.domain} width={300} height={140} />
          <View style={styles.sampleAnswerRow}>
            <Text style={styles.sampleAnswerLabel}>ANSWER</Text>
            <Text style={styles.sampleAnswerValue}>✓ {SAMPLE.strategyName}</Text>
          </View>
        </View>

        {/* ── Stats strip ──────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <Stat value={String(LIBRARY.length)} label="STRATEGIES" />
          <View style={styles.statDivider} />
          <Stat value={String(QUESTIONS.length)} label="DRILLS" />
          <View style={styles.statDivider} />
          <Stat value="$0" label="TO START" />
        </View>

        {/* ── The library ──────────────────────────────────────── */}
        <SectionHeader
          kicker="THE LIBRARY"
          title="Twelve strategies."
          accent="Exact math."
          body="Max profit, max loss, and breakevens are computed analytically from each strategy's legs — not sampled off a chart. Unbounded tails are reported as unlimited instead of whatever number the plot happened to stop at."
        />

        <View style={styles.libraryCard}>
          {LIBRARY.map((s, i) => (
            <StrategyRow key={s.id} instance={s} last={i === LIBRARY.length - 1} />
          ))}
        </View>

        {/* ── Drill modes ──────────────────────────────────────── */}
        <SectionHeader
          kicker="DRILL MODES"
          title="Two ways"
          accent="to be wrong."
          body="Recognizing a shape and reading numbers off it are different skills. StrikeCoach drills them separately and scores them separately."
        />

        <ModeCard
          glyph="Δ"
          name="Strategy ID"
          count={questionsByCategory('strategy-id').length}
          example="Which strategy does this payoff diagram show?"
          blurb="Pattern recognition. See the kink, name the position."
          tier="FREE"
        />
        <ModeCard
          glyph="∂"
          name="Payoff Reading"
          count={questionsByCategory('payoff-reading').length}
          example="What is the maximum loss for this Iron Condor?"
          blurb="Quantitative reading. Pull the actual numbers off the curve."
          tier="PRO"
        />

        {/* ── Plans ────────────────────────────────────────────── */}
        <SectionHeader
          kicker="FREE VS PRO"
          title="Drill free."
          accent="Upgrade for range."
          body="The free tier is a real daily habit, not a crippled trial — the full strategy library is in it."
        />

        <View style={styles.planRow}>
          <PlanCard
            name="FREE"
            value={String(DAILY_FREE_DRILLS)}
            caption="drills / day"
            lines={['Strategy ID category', 'Streak tracking', 'Full 12-strategy library']}
          />
          <PlanCard
            name="PRO"
            value="∞"
            caption="drills / day"
            highlight
            lines={['Payoff Reading category', 'Accuracy stats screen', 'Everything in Free']}
          />
        </View>

        {/* ── Closing ──────────────────────────────────────────── */}
        <View style={styles.closing}>
          <Text style={styles.closingKicker}>∂INTUITION / ∂REPS &gt; 0</Text>
          <Text style={styles.closingTitle}>
            Start tonight.{'\n'}
            <Text style={styles.heroAccent}>It's free.</Text>
          </Text>
          <Button title="Start drilling" onPress={onStart} arrow />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StrategyRow({ instance, last }: { instance: StrategyInstance; last: boolean }) {
  const { analysis, legs } = instance;
  const legCount = legs.reduce((n, l) => n + (l.quantity ?? 1), 0);
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.spark}>
        <PayoffDiagram points={instance.points} domain={instance.domain} width={54} height={34} compact />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{instance.strategyName}</Text>
        <Text style={styles.rowMeta}>
          {legCount} leg{legCount === 1 ? '' : 's'} · B/E {breakevenLabel(analysis.breakevens)}
        </Text>
      </View>
      <View style={styles.rowStats}>
        <Text style={styles.rowStatProfit} numberOfLines={1}>
          ▲ {fmtMetric(analysis.maxProfit)}
        </Text>
        <Text style={styles.rowStatLoss} numberOfLines={1}>
          ▼ {fmtMetric(analysis.maxLoss)}
        </Text>
      </View>
    </View>
  );
}

function ModeCard({
  glyph,
  name,
  count,
  example,
  blurb,
  tier,
}: {
  glyph: string;
  name: string;
  count: number;
  example: string;
  blurb: string;
  tier: 'FREE' | 'PRO';
}) {
  return (
    <View style={styles.modeCard}>
      <View style={styles.modeHead}>
        <View style={styles.glyphBadge}>
          <Text style={styles.glyphText}>{glyph}</Text>
        </View>
        <View style={styles.modeTitleBlock}>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeName}>{name}</Text>
            <Text style={tier === 'PRO' ? styles.tierPro : styles.tierFree}>{tier}</Text>
          </View>
          <Text style={styles.modeMeta}>{count} drills</Text>
        </View>
      </View>
      <Text style={styles.modeBlurb}>{blurb}</Text>
      <Text style={styles.modeExample}>“{example}”</Text>
    </View>
  );
}

function PlanCard({
  name,
  value,
  caption,
  lines,
  highlight,
}: {
  name: string;
  /** The defining number of the tier — deliberately drills/day rather than a
   * dollar price, since the Pro price lives in the RevenueCat dashboard and
   * isn't knowable from the client. */
  value: string;
  caption: string;
  lines: string[];
  highlight?: boolean;
}) {
  return (
    <View style={[styles.planCard, highlight && styles.planCardHighlight]}>
      <Text style={styles.planName}>{name}</Text>
      <Text style={[styles.planPrice, highlight && styles.planPriceHighlight]}>{value}</Text>
      <Text style={styles.planCaption}>{caption}</Text>
      <View style={styles.planLines}>
        {lines.map((l) => (
          <View key={l} style={styles.planLineRow}>
            <Text style={[styles.planCheck, highlight && styles.planCheckHighlight]}>✓</Text>
            <Text style={styles.planLine}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, paddingBottom: space.xl * 2, gap: space.md },

  kicker: { ...type.label, color: color.inkFaint },
  heroTitle: { fontSize: 38, fontWeight: '800', color: color.ink, letterSpacing: -0.8, lineHeight: 42 },
  heroAccent: { color: color.accent, fontStyle: 'italic' },
  heroBody: { ...type.body, color: color.inkMuted, lineHeight: 22 },
  microcopy: { ...type.label, color: color.inkFaint, textAlign: 'center', marginTop: -space.xs },

  sampleCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  sampleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sampleTag: { ...type.label, color: color.inkFaint },
  sampleQuestion: { fontSize: 16, fontWeight: '700', color: color.ink },
  sampleAnswerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space.sm,
  },
  sampleAnswerLabel: { ...type.label, color: color.inkFaint },
  sampleAnswerValue: { fontSize: 15, fontWeight: '700', color: color.profit },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 24, fontWeight: '800', color: color.ink, fontFamily: type.mono },
  statLabel: { ...type.label, color: color.inkFaint },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: color.border },

  libraryCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm + 2 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: color.border },
  spark: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.bg,
    overflow: 'hidden',
  },
  rowMain: { flex: 1, gap: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: color.ink },
  // 10px keeps the widest meta line ("2 legs · B/E $44 / $56") on one row at
  // 375pt — at 11px it wraps and makes the two-breakeven rows ragged.
  rowMeta: { fontSize: 10, color: color.inkFaint, fontFamily: type.mono },
  rowStats: { alignItems: 'flex-end', gap: 1 },
  rowStatProfit: { fontSize: 12, fontFamily: type.mono, color: color.profit, fontWeight: '700' },
  rowStatLoss: { fontSize: 12, fontFamily: type.mono, color: color.loss, fontWeight: '700' },

  modeCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  modeHead: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  glyphBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: { fontSize: 18, fontWeight: '700', color: color.accent, fontFamily: type.mono },
  modeTitleBlock: { flex: 1, gap: 2 },
  modeTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeName: { fontSize: 18, fontWeight: '700', color: color.ink },
  modeMeta: { ...type.label, color: color.inkFaint },
  tierFree: { ...type.label, color: color.accent },
  tierPro: {
    ...type.label,
    color: color.warn,
    borderWidth: 1,
    borderColor: color.warn,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeBlurb: { fontSize: 14, color: color.inkMuted, lineHeight: 20 },
  modeExample: {
    fontSize: 13,
    color: color.inkFaint,
    fontStyle: 'italic',
    borderLeftWidth: 2,
    borderLeftColor: color.border,
    paddingLeft: space.sm,
  },

  planRow: { flexDirection: 'row', gap: space.sm },
  planCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  planCardHighlight: { borderColor: color.accent },
  planName: { ...type.label, color: color.inkFaint },
  planPrice: { fontSize: 30, fontWeight: '800', color: color.ink, fontFamily: type.mono, lineHeight: 34 },
  planPriceHighlight: { color: color.accent },
  planCaption: { fontSize: 11, color: color.inkFaint, fontFamily: type.mono },
  planLines: { gap: space.xs, marginTop: space.sm },
  planLineRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  planCheck: { fontSize: 12, color: color.inkFaint, fontWeight: '800', lineHeight: 18 },
  planCheckHighlight: { color: color.accent },
  planLine: { flex: 1, fontSize: 13, color: color.inkMuted, lineHeight: 18 },

  closing: { gap: space.sm, marginTop: space.lg, paddingTop: space.lg, borderTopWidth: 1, borderTopColor: color.border },
  closingKicker: { ...type.label, color: color.inkFaint },
  closingTitle: { fontSize: 30, fontWeight: '800', color: color.ink, letterSpacing: -0.6, lineHeight: 34 },
});
