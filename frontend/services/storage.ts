import * as SecureStore from 'expo-secure-store';

const KEYS = {
  LANGUAGE: 'language',
  ONBOARDING_DONE: 'onboarding_done',
  TARGET_RANGE: 'target_range',
  UNITS: 'units',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
};

export const storageService = {
  async getLanguage(): Promise<string> {
    return (await SecureStore.getItemAsync(KEYS.LANGUAGE)) || 'en';
  },

  async setLanguage(lang: string) {
    await SecureStore.setItemAsync(KEYS.LANGUAGE, lang);
  },

  async isOnboardingDone(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.ONBOARDING_DONE)) === 'true';
  },

  async setOnboardingDone() {
    await SecureStore.setItemAsync(KEYS.ONBOARDING_DONE, 'true');
  },

  async getTargetRange(): Promise<{ min: number; max: number }> {
    const val = await SecureStore.getItemAsync(KEYS.TARGET_RANGE);
    return val ? JSON.parse(val) : { min: 70, max: 180 };
  },

  async setTargetRange(range: { min: number; max: number }) {
    await SecureStore.setItemAsync(KEYS.TARGET_RANGE, JSON.stringify(range));
  },

  async getUnits(): Promise<'mg/dL' | 'mmol/L'> {
    return ((await SecureStore.getItemAsync(KEYS.UNITS)) as 'mg/dL' | 'mmol/L') || 'mg/dL';
  },

  async setUnits(units: 'mg/dL' | 'mmol/L') {
    await SecureStore.setItemAsync(KEYS.UNITS, units);
  },

  async getNotificationsEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.NOTIFICATIONS_ENABLED)) !== 'false';
  },

  async setNotificationsEnabled(enabled: boolean) {
    await SecureStore.setItemAsync(KEYS.NOTIFICATIONS_ENABLED, String(enabled));
  },

  async clearAll() {
    for (const key of Object.values(KEYS)) {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
