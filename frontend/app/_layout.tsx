import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import '../locales/i18n';
import { pushService } from '../services/push';

const SCREEN_ROUTES: Record<string, string> = {
  log: '/(tabs)/log',
  medications: '/medications',
  appointments: '/appointments',
};

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;
      const pushResult = await pushService.register();
      if (pushResult) {
        await pushService.sendTokenToBackend(pushResult.token, pushResult.deviceId);
      }
    })();
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    (async () => {
      const Notifications = await import('expo-notifications');

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        const screen = SCREEN_ROUTES[data?.screen] || '/(tabs)/home';
        router.push(screen);
      });

      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data as Record<string, string>;
        const screen = SCREEN_ROUTES[data?.screen] || '/(tabs)/home';
        router.push(screen);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log-success" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="medications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="appointments" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
