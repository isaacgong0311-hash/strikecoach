import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, space, type } from '../theme';

interface Props {
  kicker: string;
  title: string;
  /** Optional second half of the title, rendered in italic accent green —
   * StrikeLab's headline device ("Invest like *the pros.*"). */
  accent?: string;
  body?: string;
}

export default function SectionHeader({ kicker, title, accent, body }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>
        {title}
        {accent ? '\n' : ''}
        {accent ? <Text style={styles.accent}>{accent}</Text> : null}
      </Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs, marginTop: space.lg },
  // Hairline rule instead of a boxed header — separation without another card.
  rule: { height: 1, backgroundColor: color.border, marginBottom: space.sm },
  kicker: { ...type.label, color: color.inkFaint },
  title: { fontSize: 26, fontWeight: '800', color: color.ink, letterSpacing: -0.5, lineHeight: 30 },
  accent: { color: color.accent, fontStyle: 'italic' },
  body: { ...type.body, color: color.inkMuted, lineHeight: 22, marginTop: 2 },
});
