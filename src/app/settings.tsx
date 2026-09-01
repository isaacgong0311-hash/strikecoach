import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import Purchases from 'react-native-purchases';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type, radius } from '../theme';
import Button from '../components/Button';

export default function Settings() {
  const { isPro, refresh, isConfigured } = useEntitlement();
  const [restoring, setRestoring] = useState(false);

  const onRestore = async () => {
    if (!isConfigured) {
      Alert.alert('Not configured', 'RevenueCat API key is not set in this build.');
      return;
    }
    setRestoring(true);
    try {
      await Purchases.restorePurchases();
      await refresh();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch (err) {
      Alert.alert('Restore failed', String(err));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.card, isPro && styles.cardActive]}>
        <Text style={type.label}>SUBSCRIPTION STATUS</Text>
        <View style={styles.statusRow}>
          {isPro && <View style={styles.statusDot} />}
          <Text style={styles.statusText}>{isPro ? 'StrikeCoach Pro — active' : 'Free plan'}</Text>
        </View>
      </View>

      <Button
        title={restoring ? 'Restoring…' : 'Restore purchases'}
        onPress={onRestore}
        disabled={restoring}
        variant="secondary"
      />

      <View style={styles.about}>
        <Text style={type.label}>ABOUT</Text>
        <Text style={styles.aboutText}>
          StrikeCoach — daily options-strategy drills. Built for the RevenueCat Shipaton 2026.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bg },
  container: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  cardActive: { borderColor: color.accent, backgroundColor: color.profitTint },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
  statusText: { fontSize: 16, fontWeight: '600', color: color.ink },
  about: { marginTop: 'auto', gap: space.xs },
  aboutText: { color: color.inkFaint, fontSize: 13, lineHeight: 18 },
});
