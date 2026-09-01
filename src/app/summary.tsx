import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEntitlement } from '../lib/revenuecat';
import { drillsRemainingToday, loadProgress } from '../lib/progress';
import { color, space, type } from '../theme';

export default function Summary() {
  const router = useRouter();
  const { isPro } = useEntitlement();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const onDrillAgain = async () => {
    const progress = await loadProgress();
    const remaining = drillsRemainingToday(progress, isPro);
    if (!isPro && remaining <= 0) {
      router.replace('/');
      return;
    }
    router.replace('/drill');
  };

  return (
    <View style={styles.container}>
      <Text style={type.label}>SESSION COMPLETE</Text>
      <Text style={styles.bigNumber}>{pct}%</Text>
      <Text style={styles.subline}>
        {correct} of {total} correct
      </Text>

      <View style={styles.buttonGroup}>
        <Pressable style={styles.primaryButton} onPress={onDrillAgain} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Drill again</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.sm, justifyContent: 'center' },
  bigNumber: { fontSize: 56, fontWeight: '700', color: color.ink, fontFamily: type.mono },
  subline: { color: color.inkMuted, fontSize: 16, marginBottom: space.lg },
  buttonGroup: { gap: space.sm },
  primaryButton: { backgroundColor: color.ink, paddingVertical: space.md, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: color.accentInk, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: space.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: { color: color.ink, fontSize: 16, fontWeight: '600' },
});
