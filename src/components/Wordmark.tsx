import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { color } from '../theme';

/**
 * Two-tone brand treatment — "Strike" in ink, "Coach" in the accent green.
 * Directly matches strikelab.dev's own wordmark ("Strike" ink / "Lab"
 * green), since this is the same product family.
 */
export default function Wordmark({ size = 22 }: { size?: number }) {
  const base: TextStyle = { fontSize: size, fontWeight: '800', letterSpacing: -0.4 };
  return (
    <Text style={base}>
      <Text style={[base, styles.ink]}>Strike</Text>
      <Text style={[base, styles.accent]}>Coach</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  ink: { color: color.ink },
  accent: { color: color.accent },
});
