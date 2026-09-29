jest.mock('expo-network', () => ({
  __esModule: true,
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  __esModule: true,
  dbService: {
    getPendingLogs: jest.fn(),
    markSynced: jest.fn(),
    clearSynced: jest.fn(),
  },
}));

jest.mock('../../services/patient', () => ({
  __esModule: true,
  patientService: {
    logReading: jest.fn(),
  },
}));

import { syncService } from '../../services/sync';
import * as Network from 'expo-network';
import { dbService } from '../../services/db';
import { patientService } from '../../services/patient';

const mockGetNetworkState = Network.getNetworkStateAsync as jest.Mock;
const mockGetPendingLogs = dbService.getPendingLogs as jest.Mock;
const mockMarkSynced = dbService.markSynced as jest.Mock;
const mockClearSynced = dbService.clearSynced as jest.Mock;
const mockLogReading = patientService.logReading as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncService', () => {
  describe('isOnline', () => {
    it('returns true when connected and reachable', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      expect(await syncService.isOnline()).toBe(true);
    });

    it('returns false when not connected', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: false, isInternetReachable: false });
      expect(await syncService.isOnline()).toBe(false);
    });

    it('returns false when connected but not reachable', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: false });
      expect(await syncService.isOnline()).toBe(false);
    });

    it('returns true when isInternetReachable is undefined', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true });
      expect(await syncService.isOnline()).toBe(true);
    });

    it('returns true on error (assume online)', async () => {
      mockGetNetworkState.mockRejectedValue(new Error('network error'));
      expect(await syncService.isOnline()).toBe(true);
    });
  });

  describe('listen', () => {
    it('calls callback with online status on state change', () => {
      const callback = jest.fn();
      const mockRemove = jest.fn();
      (Network.addNetworkStateListener as jest.Mock).mockReturnValue({ remove: mockRemove });

      const unsub = syncService.listen(callback);
      const listener = (Network.addNetworkStateListener as jest.Mock).mock.calls[0][0];

      listener({ isConnected: true, isInternetReachable: true });
      expect(callback).toHaveBeenCalledWith(true);

      listener({ isConnected: false, isInternetReachable: false });
      expect(callback).toHaveBeenCalledWith(false);

      unsub();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('syncPending', () => {
    it('returns {0,0} when offline', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: false, isInternetReachable: false });
      const result = await syncService.syncPending();
      expect(result).toEqual({ synced: 0, failed: 0 });
      expect(mockGetPendingLogs).not.toHaveBeenCalled();
    });

    it('syncs all pending logs successfully', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      mockGetPendingLogs.mockResolvedValue([
        { id: 1, value: 120, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null },
        { id: 2, value: 150, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00', symptoms: null },
      ]);
      mockLogReading.mockResolvedValue({});
      mockMarkSynced.mockResolvedValue(undefined);
      mockClearSynced.mockResolvedValue(undefined);

      const result = await syncService.syncPending();
      expect(result).toEqual({ synced: 2, failed: 0 });
      expect(mockMarkSynced).toHaveBeenCalledWith(1);
      expect(mockMarkSynced).toHaveBeenCalledWith(2);
      expect(mockClearSynced).toHaveBeenCalled();
    });

    it('handles partial failures', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      mockGetPendingLogs.mockResolvedValue([
        { id: 1, value: 120, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00' },
        { id: 2, value: 150, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00' },
      ]);
      mockLogReading
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('network'));

      const result = await syncService.syncPending();
      expect(result).toEqual({ synced: 1, failed: 1 });
      expect(mockClearSynced).not.toHaveBeenCalled();
    });

    it('does not clear when there are failures', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      mockGetPendingLogs.mockResolvedValue([
        { id: 1, value: 120, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00' },
      ]);
      mockLogReading.mockRejectedValue(new Error('fail'));

      await syncService.syncPending();
      expect(mockClearSynced).not.toHaveBeenCalled();
    });

    it('returns {0,0} when no pending logs', async () => {
      mockGetNetworkState.mockResolvedValue({ isConnected: true, isInternetReachable: true });
      mockGetPendingLogs.mockResolvedValue([]);

      const result = await syncService.syncPending();
      expect(result).toEqual({ synced: 0, failed: 0 });
      expect(mockClearSynced).not.toHaveBeenCalled();
    });
  });
});
