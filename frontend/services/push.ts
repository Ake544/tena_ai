import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import api from './api';

const DEVICE_ID_KEY = 'tena_device_id';

async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = 'device_' + Math.random().toString(36).substring(2, 15);
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

let retryTimeout: ReturnType<typeof setTimeout> | null = null;

export const pushService = {
  async register(): Promise<{ token: string; deviceId: string } | null> {
    try {
      const { isDevice } = await import('expo-device');
      if (!isDevice) {
        console.log('Push: not a physical device');
        return null;
      }

      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Stay on track with Tena AI',
            'We\'ll send you gentle reminders for medications, glucose checks, and appointments. You can change this anytime in Settings.',
            [
              { text: 'Not now', style: 'cancel', onPress: () => resolve() },
              { text: 'Enable', onPress: () => resolve() },
            ],
          );
        });
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Push: permission denied');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const deviceId = await getDeviceId();

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      console.log('Push: registered', tokenData.data);

      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      return { token: tokenData.data, deviceId };
    } catch (err) {
      console.log('Push registration deferred, will retry:', err);
      retryTimeout = setTimeout(() => { pushService.register(); }, 30000);
      return null;
    }
  },

  async sendTokenToBackend(token: string, deviceId?: string): Promise<void> {
    try {
      await api.put('/patient/push-token', { push_token: token, device_id: deviceId || null });
      console.log('Push token sent to backend');
    } catch (err) {
      console.log('Failed to send push token:', err);
    }
  },
};
