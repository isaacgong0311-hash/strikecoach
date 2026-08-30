import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import { useEntitlement } from '../lib/revenuecat';
import { color, space, type } from '../theme';

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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={type.label}>SUBSCRIPTION STATUS</Text>
        <Text style={styles.statusText}>{isPro ? 'StrikeCoach Pro — active' : 'Free plan'}</Text>
      </View>

      <Pressable style={styles.button} onPress={onRestore} disabled={restoring}>
        <Text style={styles.buttonText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>

      <View style={styles.about}>
        <Text style={type.label}>ABOUT</Text>
        <Text style={styles.aboutText}>
          StrikeCoach — daily options-strategy drills. Built for the RevenueCat Shipaton 2026.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg, padding: space.lg, gap: space.md },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: space.md,
    gap: space.xs,
  },
  statusText: { fontSize: 16, fontWeight: '600', color: color.ink },
  button: {
    borderWidth: 1,
    borderColor: color.border,
    paddingVertical: space.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: color.ink, fontSize: 15, fontWeight: '600' },
  about: { marginTop: 'auto', gap: space.xs },
  aboutText: { color: color.inkFaint, fontSize: 13, lineHeight: 18 },
});
