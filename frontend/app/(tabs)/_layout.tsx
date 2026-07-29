import { Tabs } from 'expo-router';
import { View, StatusBar } from 'react-native';
import BottomNav from '../../components/BottomNav';
import OfflineBanner from '../../components/OfflineBanner';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor="#F07A30" barStyle="light-content" />
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
