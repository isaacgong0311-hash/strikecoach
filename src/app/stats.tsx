import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { loadProgress, ProgressState } from '../lib/progress';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type } from '../theme';

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={type.label}>CURRENT STREAK</Text>
        <Text style={styles.bigNumber}>{progress.streak} days</Text>
      </View>
      <View style={styles.card}>
        <Text style={type.label}>STRATEGY ID</Text>
        <Text style={styles.statLine}>{accuracyLabel(progress.categoryStats['strategy-id'])}</Text>
      </View>
      <View style={styles.card}>
        <Text style={type.label}>PAYOFF READING</Text>
        <Text style={styles.statLine}>{accuracyLabel(progress.categoryStats['payoff-reading'])}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: space.md,
    gap: space.xs,
  },
  bigNumber: { fontSize: 28, fontWeight: '700', color: color.ink },
  statLine: { fontSize: 16, color: color.inkMuted },
});
