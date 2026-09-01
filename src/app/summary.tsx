import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEntitlement } from '../lib/revenuecat';
import { drillsRemainingToday, loadProgress } from '../lib/progress';
import { color, space, type, radius } from '../theme';
import Button from '../components/Button';

function tierFor(pct: number, total: number): { label: string; check: boolean } {
  if (total === 0) return { label: 'No drills answered', check: false };
  if (pct >= 80) return { label: 'Strong session', check: true };
  if (pct >= 50) return { label: 'Solid session', check: true };
  return { label: 'Keep drilling', check: false };
}

export default function Summary() {
  const router = useRouter();
  const { isPro } = useEntitlement();
  const params = useLocalSearchParams<{ correct: string; total: string }>();
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tier = tierFor(pct, total);

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

      <View style={styles.toast}>
        {tier.check && <Text style={styles.toastCheck}>✓</Text>}
        <Text style={styles.toastLabel}>{tier.label}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <Button title="Drill again" onPress={onDrillAgain} arrow />
        <Button title="Back to home" onPress={() => router.replace('/')} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.sm, justifyContent: 'center' },
  bigNumber: { fontSize: 56, fontWeight: '700', color: color.ink, fontFamily: type.mono },
  subline: { color: color.inkMuted, fontSize: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    backgroundColor: color.ink,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 6,
    marginBottom: space.lg,
  },
  toastCheck: { color: color.accent, fontWeight: '800', fontSize: 13 },
  toastLabel: { color: color.accentInk, fontSize: 12, fontWeight: '600' },
  buttonGroup: { gap: space.sm },
});
