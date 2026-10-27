import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BottomNav from '../../components/BottomNav';
import OfflineBanner from '../../components/OfflineBanner';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <OfflineBanner />
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
    </View>
  );
}
