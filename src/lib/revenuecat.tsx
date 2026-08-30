import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

/**
 * RevenueCat entitlement identifier configured in the RevenueCat dashboard for
 * the "StrikeCoach Pro" subscription. Must match the entitlement id set up
 * there (see docs/specs for setup notes) — this string is the single source
 * of truth for what "Pro" means in the app.
 */
export const PRO_ENTITLEMENT_ID = 'pro';

/**
 * Public (client-side) RevenueCat API key. RevenueCat's public SDK keys are
 * safe to ship in the app bundle — only the secret server key is sensitive.
 * Set via an env var so this repo doesn't need a real key checked in; see
 * .env.example.
 */
const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

let configured = false;

export function configureRevenueCat(): void {
  if (configured) return;
  if (!API_KEY_IOS) {
    console.warn(
      '[RevenueCat] EXPO_PUBLIC_REVENUECAT_IOS_KEY is not set — purchases are disabled until you add a ' +
        'RevenueCat project API key (see .env.example).'
    );
    return;
  }
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: API_KEY_IOS });
    configured = true;
  }
}

export function isProEntitled(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== 'undefined';
}

interface EntitlementContextValue {
  isPro: boolean;
  loading: boolean;
  isConfigured: boolean;
  /** Presents RevenueCat's built-in Paywall UI; resolves once the sheet is dismissed. */
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = Platform.OS === 'ios' && !!API_KEY_IOS;

  useEffect(() => {
    configureRevenueCat();
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    Purchases.getCustomerInfo()
      .then((info) => mounted && setCustomerInfo(info))
      .catch((err) => console.warn('[RevenueCat] getCustomerInfo failed', err))
      .finally(() => mounted && setLoading(false));

    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isConfigured]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      isPro: isProEntitled(customerInfo),
      loading,
      isConfigured,
      presentPaywall: async () => {
        if (!isConfigured) {
          console.warn('[RevenueCat] Cannot present paywall — SDK not configured.');
          return PAYWALL_RESULT.NOT_PRESENTED;
        }
        return RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID });
      },
      refresh: async () => {
        if (!isConfigured) return;
        try {
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
        } catch (err) {
          console.warn('[RevenueCat] refresh failed', err);
        }
      },
    }),
    [customerInfo, loading, isConfigured]
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement(): EntitlementContextValue {
  const ctx = useContext(EntitlementContext);
  if (!ctx) throw new Error('useEntitlement must be used within an EntitlementProvider');
  return ctx;
}
