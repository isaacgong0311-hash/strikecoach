import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProgress, drillsRemainingToday, ProgressState } from '../lib/progress';
import { unlockedCategories } from '../lib/drillEngine';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type, radius } from '../theme';
import PayoffDiagram from '../components/PayoffDiagram';
import { STRATEGY_INSTANCES, STRATEGY_NAMES } from '../content/strategies';
import { QUESTIONS } from '../content/questions';

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
      <View style={styles.center}>
        <ActivityIndicator color={color.ink} />
      </View>
    );
  }

  if (showWelcome) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.welcomeContent}>
        <Text style={styles.kicker}>Free to start · options intuition</Text>

        <Text style={styles.heroTitle}>
          Read the chart.{'\n'}Call the strategy.
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

        <Pressable style={styles.primaryButton} onPress={dismissWelcome}>
          <Text style={styles.primaryButtonText}>Get started</Text>
        </Pressable>

        <View style={styles.statsStrip}>
          <Stat value={String(STRATEGY_NAMES.length)} label="STRATEGIES" />
          <View style={styles.statDivider} />
          <Stat value={String(QUESTIONS.length)} label="DRILLS" />
          <View style={styles.statDivider} />
          <Stat value="$0" label="TO START" />
        </View>
      </ScrollView>
    );
  }

  const remaining = drillsRemainingToday(progress, isPro);
  const categories = unlockedCategories(isPro);
  const strategyStats = progress.categoryStats['strategy-id'];
  const readingStats = progress.categoryStats['payoff-reading'];
  const totalAttempts = strategyStats.attempts + readingStats.attempts;
  const totalCorrect = strategyStats.correct + readingStats.correct;
  const accuracyLabel = totalAttempts > 0 ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : '—';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>StrikeCoach</Text>
        {isPro && <Text style={styles.proBadge}>PRO</Text>}
      </View>

      <View style={styles.statsStrip}>
        <Stat value={String(progress.streak)} label="STREAK" />
        <View style={styles.statDivider} />
        <Stat value={isPro ? '∞' : String(remaining)} label={isPro ? 'DRILLS TODAY' : 'FREE LEFT'} />
        <View style={styles.statDivider} />
        <Stat value={accuracyLabel} label="ACCURACY" />
      </View>

      <Pressable style={styles.primaryButton} onPress={onStartDrill}>
        <Text style={styles.primaryButtonText}>Start drill</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>CATEGORIES</Text>

      <View style={styles.card}>
        <Text style={type.title}>Strategy ID</Text>
        <Text style={styles.cardBody}>
          {strategyStats.attempts > 0
            ? `${strategyStats.correct}/${strategyStats.attempts} correct`
            : 'Not started yet'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={type.title}>Payoff Reading</Text>
          {!categories.includes('payoff-reading') && <Text style={styles.lockBadge}>PRO</Text>}
        </View>
        <Text style={styles.cardBody}>
          {categories.includes('payoff-reading')
            ? readingStats.attempts > 0
              ? `${readingStats.correct}/${readingStats.attempts} correct`
              : 'Not started yet'
            : 'Unlock with StrikeCoach Pro'}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Pressable onPress={onOpenStats}>
          <Text style={styles.link}>{isPro ? 'View stats' : 'View stats (Pro)'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.md },
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

  primaryButton: {
    backgroundColor: color.ink,
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: { color: color.accentInk, fontSize: 16, fontWeight: '700' },

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
  wordmark: { fontSize: 22, fontWeight: '800', color: color.ink, letterSpacing: -0.4 },
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
    gap: space.xs,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
