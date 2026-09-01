import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProgress, drillsRemainingToday, ProgressState } from '../lib/progress';
import { unlockedCategories } from '../lib/drillEngine';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type, radius } from '../theme';
import PayoffDiagram from '../components/PayoffDiagram';
import Button from '../components/Button';
import Wordmark from '../components/Wordmark';
import { STRATEGY_INSTANCES, STRATEGY_NAMES } from '../content/strategies';
import { QUESTIONS, questionsByCategory } from '../content/questions';

const ONBOARDED_KEY = 'strikecoach.onboarded.v1';
const PREVIEW = STRATEGY_INSTANCES.find((s) => s.strategyKey === 'iron-condor')!;

export default function Home() {
  const router = useRouter();
  const { isPro, presentPaywall, loading: entitlementLoading } = useEntitlement();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const [p, onboarded] = await Promise.all([loadProgress(), AsyncStorage.getItem(ONBOARDED_KEY)]);
    setProgress(p);
    setShowWelcome(!onboarded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const dismissWelcome = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    setShowWelcome(false);
  };

  if (!progress || showWelcome === null || entitlementLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={color.ink} />
      </SafeAreaView>
    );
  }

  if (showWelcome) {
    return (
      <SafeAreaView style={styles.scroll} edges={['top']}>
        <ScrollView contentContainerStyle={styles.welcomeContent}>
          <Wordmark />
          <Text style={styles.kicker}>Free to start · options intuition</Text>

          <Text style={styles.heroTitle}>
            Read the chart.{'\n'}Call{' '}
            <Text style={styles.heroTitleAccent}>the strategy.</Text>
          </Text>
          <Text style={styles.welcomeBody}>
            Five drills a day, free. Payoff diagrams, strategy ID, breakevens — get sharp the way
            you'd drill flashcards, not by rereading a textbook.
          </Text>

          <View style={styles.previewCard}>
            <Text style={type.label}>SAMPLE DRILL</Text>
            <Text style={styles.previewQuestion}>Which strategy does this payoff diagram show?</Text>
            <PayoffDiagram points={PREVIEW.points} domain={PREVIEW.domain} width={300} height={140} />
            <View style={styles.previewAnswerRow}>
              <Text style={styles.previewAnswerLabel}>ANSWER</Text>
              <Text style={styles.previewAnswerValue}>{PREVIEW.strategyName}</Text>
            </View>
          </View>

          <Button title="Get started" onPress={dismissWelcome} arrow />

          <View style={styles.statsStrip}>
            <Stat value={String(STRATEGY_NAMES.length)} label="STRATEGIES" />
            <View style={styles.statDivider} />
            <Stat value={String(QUESTIONS.length)} label="DRILLS" />
            <View style={styles.statDivider} />
            <Stat value="$0" label="TO START" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const remaining = drillsRemainingToday(progress, isPro);
  const categories = unlockedCategories(isPro);
  const strategyStats = progress.categoryStats['strategy-id'];
  const readingStats = progress.categoryStats['payoff-reading'];
  const totalAttempts = strategyStats.attempts + readingStats.attempts;
  const totalCorrect = strategyStats.correct + readingStats.correct;
  const accuracyLabel = totalAttempts > 0 ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : '—';
  const strategyIdCount = questionsByCategory('strategy-id').length;
  const payoffReadingCount = questionsByCategory('payoff-reading').length;

  const onStartDrill = () => {
    if (!isPro && remaining <= 0) {
      presentPaywall().then(() => refresh());
      return;
    }
    router.push('/drill');
  };

  const onOpenStats = () => {
    if (!isPro) {
      presentPaywall().then(() => refresh());
      return;
    }
    router.push('/stats');
  };

  return (
    <SafeAreaView style={styles.scroll} edges={['top']}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Wordmark />
        {isPro && <Text style={styles.proBadge}>PRO</Text>}
      </View>

      <View style={styles.statsStrip}>
        <Stat value={String(progress.streak)} label="STREAK" />
        <View style={styles.statDivider} />
        <Stat value={isPro ? '∞' : String(remaining)} label={isPro ? 'DRILLS TODAY' : 'FREE LEFT'} />
        <View style={styles.statDivider} />
        <Stat value={accuracyLabel} label="ACCURACY" />
      </View>

      <Button title="Start drill" onPress={onStartDrill} arrow />

      <Text style={styles.sectionLabel}>DRILL CATEGORIES</Text>

      <CategoryCard
        glyph="Δ"
        name="Strategy ID"
        meta={`${strategyIdCount} drills`}
        status={
          strategyStats.attempts > 0 ? `${strategyStats.correct}/${strategyStats.attempts} correct` : 'Not started yet'
        }
      />

      <CategoryCard
        glyph="∂"
        name="Payoff Reading"
        meta={categories.includes('payoff-reading') ? `${payoffReadingCount} drills` : undefined}
        status={
          categories.includes('payoff-reading')
            ? readingStats.attempts > 0
              ? `${readingStats.correct}/${readingStats.attempts} correct`
              : 'Not started yet'
            : 'Unlock with StrikeCoach Pro'
        }
        locked={!categories.includes('payoff-reading')}
      />

      <View style={styles.footerRow}>
        <Pressable
          onPress={onOpenStats}
          accessibilityRole="button"
          accessibilityLabel={isPro ? 'View stats' : 'View stats, requires Pro'}
        >
          <Text style={styles.link}>{isPro ? 'View stats →' : 'View stats (Pro) →'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button">
          <Text style={styles.link}>Settings</Text>
        </Pressable>
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

function CategoryCard({
  glyph,
  name,
  meta,
  status,
  locked,
}: {
  glyph: string;
  name: string;
  meta?: string;
  status: string;
  locked?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.glyphBadge}>
          <Text style={styles.glyphText}>{glyph}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <View style={styles.cardHeaderRow}>
            <Text style={type.title}>{name}</Text>
            {locked && <Text style={styles.lockBadge}>PRO</Text>}
          </View>
          {meta && <Text style={styles.cardMeta}>{meta}</Text>}
        </View>
      </View>
      <Text style={styles.cardBody}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  scroll: { flex: 1, backgroundColor: color.bg },
  welcomeContent: { padding: space.lg, paddingBottom: space.xl, gap: space.md },

  kicker: { ...type.label, color: color.inkFaint },

  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: color.ink,
    letterSpacing: -0.8,
    lineHeight: 42,
  },
  heroTitleAccent: {
    color: color.accent,
    fontStyle: 'italic',
  },
  welcomeBody: { ...type.body, color: color.inkMuted, lineHeight: 22 },

  previewCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  previewQuestion: { fontSize: 16, fontWeight: '700', color: color.ink },
  previewAnswerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: space.sm,
  },
  previewAnswerLabel: { ...type.label, color: color.inkFaint },
  previewAnswerValue: { fontSize: 15, fontWeight: '700', color: color.profit },

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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proBadge: {
    ...type.label,
    color: color.accentInk,
    backgroundColor: color.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionLabel: { ...type.label, color: color.inkFaint, marginTop: space.xs },

  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  cardTopRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
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
  cardTitleBlock: { flex: 1, gap: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { ...type.label, color: color.inkFaint },
  cardBody: { color: color.inkMuted, fontSize: 14 },
  lockBadge: {
    ...type.label,
    color: color.warn,
    borderWidth: 1,
    borderColor: color.warn,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: space.md,
  },
  link: { color: color.inkMuted, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
