import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEntitlement } from '../lib/revenuecat';
import { drillsRemainingToday, loadProgress } from '../lib/progress';
import { decodeSessionLog, SessionEntry } from '../lib/sessionLog';
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
  const { isPro, presentPaywall } = useEntitlement();
  const params = useLocalSearchParams<{ correct: string; total: string; log: string }>();
  const entries = decodeSessionLog(params.log);
  const correct = Number(params.correct ?? 0);
  const total = Number(params.total ?? 0);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tier = tierFor(pct, total);
  const missed = entries.filter((e) => !e.correct);

  const onDrillAgain = async () => {
    const progress = await loadProgress();
    const remaining = drillsRemainingToday(progress, isPro);
    if (!isPro && remaining <= 0) {
      // Out of free drills right after finishing a session — the natural upsell
      // moment, so present the paywall here rather than bouncing to the
      // dashboard and making the user tap again to find out why.
      await presentPaywall();
      router.replace('/');
      return;
    }
    router.replace('/drill');
  };

  // Every strategy-id question shares one prompt ("Which strategy does this
  // payoff diagram show?"), so in a free-tier session all five would repeat it
  // and the answers — the actual review value — would be the smaller text.
  // Only show prompts when they actually distinguish the rows.
  const showPrompts = new Set(entries.map((e) => e.prompt)).size > 1;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.scoreRow}>
        <Text style={styles.bigNumber}>{pct}%</Text>
        <View style={styles.scoreMeta}>
          <Text style={styles.subline}>
            {correct} of {total} correct
          </Text>
          <View style={styles.toast}>
            {tier.check && <Text style={styles.toastCheck}>✓</Text>}
            <Text style={styles.toastLabel}>{tier.label}</Text>
          </View>
        </View>
      </View>

      {entries.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>
            {missed.length === 0 ? 'ALL CORRECT' : `REVIEW · ${missed.length} MISSED`}
          </Text>
          <View style={styles.recapCard}>
            {entries.map((e, i) => (
              <RecapRow key={i} entry={e} last={i === entries.length - 1} showPrompt={showPrompts} />
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonGroup}>
        <Button title="Drill again" onPress={onDrillAgain} arrow />
        <Button title="Back to home" onPress={() => router.replace('/')} variant="secondary" />
      </View>
    </ScrollView>
  );
}

function RecapRow({ entry, last, showPrompt }: { entry: SessionEntry; last: boolean; showPrompt: boolean }) {
  return (
    <View style={[styles.recapRow, !last && styles.recapDivider]}>
      <Text
        style={[styles.mark, entry.correct ? styles.markCorrect : styles.markWrong]}
        accessibilityLabel={entry.correct ? 'Correct' : 'Missed'}
      >
        {entry.correct ? '✓' : '✕'}
      </Text>
      <View style={styles.recapMain}>
        {showPrompt && (
          <Text style={styles.recapPrompt} numberOfLines={2}>
            {entry.prompt}
          </Text>
        )}
        <Text style={[styles.recapAnswer, !entry.correct && styles.recapAnswerWrong]}>{entry.answer}</Text>
        {!entry.correct && <Text style={styles.recapHint}>correct answer</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  // Top-aligned, not centered: with the recap list the content nearly fills
  // the screen, and centering just pushed everything down behind a dead gap.
  container: { padding: space.lg, paddingTop: space.lg, paddingBottom: space.xl, gap: space.sm, flexGrow: 1 },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bigNumber: { fontSize: 56, fontWeight: '700', color: color.ink, fontFamily: type.mono },
  scoreMeta: { flex: 1, gap: space.xs },
  subline: { color: color.inkMuted, fontSize: 15 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    backgroundColor: color.ink,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 6,
  },
  toastCheck: { color: color.accent, fontWeight: '800', fontSize: 13 },
  toastLabel: { color: color.accentInk, fontSize: 12, fontWeight: '600' },

  sectionLabel: { ...type.label, color: color.inkFaint, marginTop: space.md },
  recapCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  recapRow: { flexDirection: 'row', gap: space.sm, paddingVertical: space.sm + 2, alignItems: 'flex-start' },
  recapDivider: { borderBottomWidth: 1, borderBottomColor: color.border },
  mark: { fontSize: 14, fontWeight: '800', width: 16, lineHeight: 19 },
  markCorrect: { color: color.profit },
  markWrong: { color: color.loss },
  recapMain: { flex: 1, gap: 2 },
  recapPrompt: { fontSize: 13, color: color.inkMuted, lineHeight: 18 },
  recapAnswer: { fontSize: 15, fontWeight: '700', color: color.ink },
  recapAnswerWrong: { color: color.loss },
  recapHint: { fontSize: 11, color: color.inkFaint, fontFamily: type.mono },

  buttonGroup: { gap: space.sm, marginTop: space.lg },
});
