import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityDay } from '../lib/progress';
import { color, space, type, radius } from '../theme';

interface Props {
  days: ActivityDay[];
  drillsUsedToday: number;
  dailyCap: number;
  isPro: boolean;
}

/**
 * Week-at-a-glance activity, plus today's drill budget. Gives the streak
 * number some texture — a "4" tells you nothing about whether you're building
 * or about to break a run, but seven cells do.
 */
export default function ActivityStrip({ days, drillsUsedToday, dailyCap, isPro }: Props) {
  const activeCount = days.filter((d) => d.active).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={type.label}>THIS WEEK</Text>
        <Text style={styles.headMeta}>
          {activeCount}/{days.length} DAYS
        </Text>
      </View>

      <View style={styles.week}>
        {days.map((d) => (
          <View key={d.date} style={styles.dayCol}>
            <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
            <View
              style={[
                styles.cell,
                d.active ? styles.cellActive : styles.cellIdle,
                d.isToday && styles.cellToday,
              ]}
              accessibilityLabel={`${d.date}${d.active ? ', drilled' : ', no drills'}${d.isToday ? ', today' : ''}`}
            />
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.todayRow}>
        <Text style={type.label}>TODAY</Text>
        {isPro ? (
          <Text style={styles.todayPro}>∞ unlimited</Text>
        ) : (
          <View style={styles.meterRow}>
            <View style={styles.meter}>
              {Array.from({ length: dailyCap }).map((_, i) => (
                <View key={i} style={[styles.pip, i < drillsUsedToday && styles.pipUsed]} />
              ))}
            </View>
            <Text style={styles.todayCount}>
              {drillsUsedToday}/{dailyCap}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headMeta: { ...type.label, color: color.inkFaint },

  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 5, flex: 1 },
  dayLabel: { fontSize: 10, fontFamily: type.mono, color: color.inkFaint },
  dayLabelToday: { color: color.ink, fontWeight: '700' },
  cell: { width: '86%', height: 26, borderRadius: radius.sm },
  cellIdle: { backgroundColor: color.bg, borderWidth: 1, borderColor: color.border },
  cellActive: { backgroundColor: color.accent },
  cellToday: { borderWidth: 2, borderColor: color.ink },

  divider: { height: 1, backgroundColor: color.border },

  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meter: { flexDirection: 'row', gap: 4 },
  pip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.border,
  },
  pipUsed: { backgroundColor: color.accent, borderColor: color.accent },
  todayCount: { fontSize: 13, fontFamily: type.mono, color: color.inkMuted, fontWeight: '700' },
  todayPro: { fontSize: 13, fontFamily: type.mono, color: color.accent, fontWeight: '700' },
});
