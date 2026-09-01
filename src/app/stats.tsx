import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { loadProgress, ProgressState } from '../lib/progress';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type, radius } from '../theme';

function accuracyLabel(stats: { attempts: number; correct: number }): string {
  if (stats.attempts === 0) return 'No drills yet';
  return `${Math.round((stats.correct / stats.attempts) * 100)}% (${stats.correct}/${stats.attempts})`;
}

export default function Stats() {
  const router = useRouter();
  const { isPro, loading } = useEntitlement();
  const [progress, setProgress] = useState<ProgressState | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  useEffect(() => {
    // Deep-link / back-button guard: Stats is a Pro feature. If somehow reached
    // without entitlement (e.g. it lapsed), bounce back to the paywalled home flow
    // rather than showing gated content.
    if (!loading && !isPro) router.replace('/');
  }, [loading, isPro, router]);

  if (loading || !progress || !isPro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.ink} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={type.label}>CURRENT STREAK</Text>
        <Text style={styles.bigNumber}>{progress.streak} days</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.glyphBadge}>
            <Text style={styles.glyphText}>Δ</Text>
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={type.label}>STRATEGY ID</Text>
            <Text style={styles.statLine}>{accuracyLabel(progress.categoryStats['strategy-id'])}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.glyphBadge}>
            <Text style={styles.glyphText}>∂</Text>
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={type.label}>PAYOFF READING</Text>
            <Text style={styles.statLine}>{accuracyLabel(progress.categoryStats['payoff-reading'])}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  container: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  cardTopRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
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
  bigNumber: { fontSize: 28, fontWeight: '700', color: color.ink, fontFamily: type.mono },
  statLine: { fontSize: 16, color: color.inkMuted, fontFamily: type.mono },
});
