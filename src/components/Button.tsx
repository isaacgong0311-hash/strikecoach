import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { color, radius, space } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Appends a StrikeLab-style trailing arrow to the label — use for the CTA
   * that moves the user forward (start, next, continue), not for neutral
   * actions (back, cancel, settings). */
  arrow?: boolean;
  style?: ViewStyle;
}

/**
 * Shared button, matching StrikeLab's actual convention: green solid is the
 * primary/forward action, a dark hairline outline is secondary — not black
 * for everything. Previously every screen hand-rolled its own button
 * styles (all defaulting to solid ink); this replaces that duplication.
 */
export default function Button({ title, onPress, variant = 'primary', disabled, arrow, style }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={isPrimary ? styles.primaryText : styles.secondaryText}>
        {title}
        {arrow ? '  →' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: color.accent },
  primaryText: { color: color.accentInk, fontSize: 16, fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: color.border, backgroundColor: color.surface },
  secondaryText: { color: color.ink, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
