import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { loadProgress, recentActivity, CategoryStats, ProgressState } from '../lib/progress';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type, radius } from '../theme';

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

  const sid = progress.categoryStats['strategy-id'];
  const pr = progress.categoryStats['payoff-reading'];
  const totalAttempts = sid.attempts + pr.attempts;
  const totalCorrect = sid.correct + pr.correct;
  const overall = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const daysActive = recentActivity(progress, undefined, 30).filter((d) => d.active).length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.headlineRow}>
        <Headline value={totalAttempts > 0 ? `${overall}%` : '—'} label="OVERALL" />
        <View style={styles.headlineDivider} />
        <Headline value={String(totalAttempts)} label="DRILLS DONE" />
        <View style={styles.headlineDivider} />
        <Headline value={String(progress.streak)} label="STREAK" />
      </View>

      <Text style={styles.sectionLabel}>BY CATEGORY</Text>
      <CategoryStatCard glyph="Δ" name="Strategy ID" stats={sid} />
      <CategoryStatCard glyph="∂" name="Payoff Reading" stats={pr} />

      <Text style={styles.sectionLabel}>CONSISTENCY</Text>
      <View style={styles.card}>
        <View style={styles.consistencyRow}>
          <Text style={styles.consistencyLabel}>Days drilled, last 30</Text>
          <Text style={styles.consistencyValue}>{daysActive}</Text>
        </View>
        <View style={styles.consistencyRow}>
          <Text style={styles.consistencyLabel}>Current streak</Text>
          <Text style={styles.consistencyValue}>
            {progress.streak} {progress.streak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Headline({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.headline}>
      <Text style={styles.headlineValue}>{value}</Text>
      <Text style={styles.headlineLabel}>{label}</Text>
    </View>
  );
}

function CategoryStatCard({ glyph, name, stats }: { glyph: string; name: string; stats: CategoryStats }) {
  const pct = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
  const started = stats.attempts > 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.glyphBadge}>
          <Text style={styles.glyphText}>{glyph}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardName}>{name}</Text>
          <Text style={styles.statLine}>
            {started ? `${stats.correct}/${stats.attempts} correct` : 'No drills yet'}
          </Text>
        </View>
        <Text style={[styles.cardPct, !started && styles.cardPctIdle]}>{started ? `${pct}%` : '—'}</Text>
      </View>
      {/* A bar beats a bare percentage here — this is the stats screen, and
          two categories are only comparable when you can see them side by side. */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${started ? pct : 0}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  container: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },

  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  headline: { flex: 1, alignItems: 'center', gap: 2 },
  headlineValue: { fontSize: 24, fontWeight: '800', color: color.ink, fontFamily: type.mono },
  headlineLabel: { ...type.label, color: color.inkFaint },
  headlineDivider: { width: 1, alignSelf: 'stretch', backgroundColor: color.border },

  sectionLabel: { ...type.label, color: color.inkFaint, marginTop: space.xs },

  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
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
  cardName: { fontSize: 17, fontWeight: '700', color: color.ink },
  statLine: { fontSize: 13, color: color.inkMuted, fontFamily: type.mono },
  cardPct: { fontSize: 20, fontWeight: '800', color: color.accent, fontFamily: type.mono },
  cardPctIdle: { color: color.inkFaint },

  barTrack: { height: 6, borderRadius: radius.sm, backgroundColor: color.bg, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: color.accent, borderRadius: radius.sm },

  consistencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consistencyLabel: { fontSize: 14, color: color.inkMuted },
  consistencyValue: { fontSize: 15, fontWeight: '700', color: color.ink, fontFamily: type.mono },
});
