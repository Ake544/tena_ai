import * as SecureStore from 'expo-secure-store';
import { storageService } from '../../services/storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockStore: Record<string, string> = {};

(SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => mockStore[key] ?? null);
(SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => { mockStore[key] = value; });
(SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => { delete mockStore[key]; });

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
});

describe('storageService', () => {
  describe('getLanguage / setLanguage', () => {
    it('returns "en" by default', async () => {
      expect(await storageService.getLanguage()).toBe('en');
    });

    it('returns stored language', async () => {
      await storageService.setLanguage('am');
      expect(await storageService.getLanguage()).toBe('am');
    });
  });

  describe('isOnboardingDone / setOnboardingDone', () => {
    it('returns false by default', async () => {
      expect(await storageService.isOnboardingDone()).toBe(false);
    });

    it('returns true after setting', async () => {
      await storageService.setOnboardingDone();
      expect(await storageService.isOnboardingDone()).toBe(true);
    });
  });

  describe('getTargetRange / setTargetRange', () => {
    it('returns default { min: 70, max: 180 }', async () => {
      expect(await storageService.getTargetRange()).toEqual({ min: 70, max: 180 });
    });

    it('returns stored range', async () => {
      await storageService.setTargetRange({ min: 80, max: 200 });
      expect(await storageService.getTargetRange()).toEqual({ min: 80, max: 200 });
    });
  });

  describe('getUnits / setUnits', () => {
    it('returns "mg/dL" by default', async () => {
      expect(await storageService.getUnits()).toBe('mg/dL');
    });

    it('returns stored units', async () => {
      await storageService.setUnits('mmol/L');
      expect(await storageService.getUnits()).toBe('mmol/L');
    });
  });

  describe('getNotificationsEnabled / setNotificationsEnabled', () => {
    it('returns false by default', async () => {
      expect(await storageService.getNotificationsEnabled()).toBe(false);
    });

    it('returns true after enabling', async () => {
      await storageService.setNotificationsEnabled(true);
      expect(await storageService.getNotificationsEnabled()).toBe(true);
    });

    it('returns false after disabling', async () => {
      await storageService.setNotificationsEnabled(true);
      await storageService.setNotificationsEnabled(false);
      expect(await storageService.getNotificationsEnabled()).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('deletes all keys', async () => {
      await storageService.setLanguage('am');
      await storageService.setOnboardingDone();
      await storageService.clearAll();
      expect(await storageService.getLanguage()).toBe('en');
      expect(await storageService.isOnboardingDone()).toBe(false);
    });
  });
});
