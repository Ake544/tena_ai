import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../locales/i18n';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

let analytics: any = null;
try {
  analytics = require('@react-native-firebase/analytics').default;
} catch {
  // Firebase Analytics not available (e.g., Expo Go)
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

export default function RootLayout() {
  useEffect(() => {
    if (analytics) {
      analytics().logEvent('app_open').catch(() => {});
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <MedicalDisclaimer />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log-success" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="medications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="appointments" options={{ animation: 'slide_from_right' }} />
      </Stack>
      </QueryClientProvider>
  );
}
