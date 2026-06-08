import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../locales/i18n';

export default function RootLayout() {
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
