import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import BottomNav from '../../components/BottomNav';

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        tabBar={(props) => <BottomNav {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="log" />
        <Tabs.Screen name="tips" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
