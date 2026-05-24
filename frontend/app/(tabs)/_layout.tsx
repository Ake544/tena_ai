import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="log" />
        <Stack.Screen name="tips" />
        <Stack.Screen name="history" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
