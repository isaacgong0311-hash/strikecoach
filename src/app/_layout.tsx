import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EntitlementProvider } from '../lib/revenuecat';
import { color } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <EntitlementProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: color.bg },
            headerShadowVisible: false,
            headerTintColor: color.ink,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: color.bg },
          }}
        >
          {/* Home renders its own two-tone Wordmark + PRO badge in-content —
              a native header title here would just duplicate it. */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="drill" options={{ title: 'Drill', headerBackTitle: 'Quit' }} />
          <Stack.Screen name="summary" options={{ title: 'Session Complete', headerBackVisible: false }} />
          <Stack.Screen name="stats" options={{ title: 'Your Stats' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </EntitlementProvider>
    </SafeAreaProvider>
  );
}
