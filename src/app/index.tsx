import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProgress, drillsRemainingToday, ProgressState } from '../lib/progress';
import { unlockedCategories } from '../lib/drillEngine';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type } from '../theme';

const ONBOARDED_KEY = 'strikecoach.onboarded.v1';

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
      <View style={styles.container}>
        <Text style={type.display}>StrikeCoach</Text>
        <Text style={styles.welcomeBody}>
          Read a payoff diagram. Name the strategy. Call the breakeven. Five drills a day, free —
          get sharp on options intuition the way you'd drill flashcards.
        </Text>
        <Pressable style={styles.primaryButton} onPress={dismissWelcome}>
          <Text style={styles.primaryButtonText}>Get started</Text>
        </Pressable>
      </View>
    );
  }

  const remaining = drillsRemainingToday(progress, isPro);
  const categories = unlockedCategories(isPro);
  const strategyStats = progress.categoryStats['strategy-id'];
  const readingStats = progress.categoryStats['payoff-reading'];

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
      <View style={styles.streakRow}>
        <View>
          <Text style={type.label}>STREAK</Text>
          <Text style={styles.streakNumber}>{progress.streak}</Text>
        </View>
        <View style={styles.rightAlign}>
          <Text style={type.label}>{isPro ? 'DRILLS TODAY' : 'FREE DRILLS LEFT'}</Text>
          <Text style={styles.streakNumber}>{isPro ? '∞' : remaining}</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onStartDrill}>
        <Text style={styles.primaryButtonText}>Start drill</Text>
      </Pressable>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  welcomeBody: { ...type.body, color: color.inkMuted, lineHeight: 22 },
  primaryButton: {
    backgroundColor: color.ink,
    paddingVertical: space.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: color.accentInk, fontSize: 16, fontWeight: '700' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  rightAlign: { alignItems: 'flex-end' },
  streakNumber: { fontSize: 34, fontWeight: '700', color: color.ink },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: space.md,
    gap: space.xs,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBody: { color: color.inkMuted, fontSize: 14 },
  lockBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: color.warn,
    borderWidth: 1,
    borderColor: color.warn,
    borderRadius: 4,
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
