import * as Network from 'expo-network';
import { dbService } from './db';
import { patientService } from './patient';

export const syncService = {
  async isOnline(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return !!(state.isConnected && state.isInternetReachable !== false);
    } catch {
      return true;
    }
  },

  listen(callback: (isOnline: boolean) => void): () => void {
    const subscription = Network.addNetworkStateListener((state) => {
      callback(!!(state.isConnected && state.isInternetReachable !== false));
    });
    return () => subscription.remove();
  },

  async syncPending(): Promise<{ synced: number; failed: number }> {
    const online = await this.isOnline();
    if (!online) return { synced: 0, failed: 0 };

    const pending = await dbService.getPendingLogs();
    let synced = 0;
    let failed = 0;

    for (const log of pending) {
      try {
        await patientService.logReading({
          value: log.value,
          reading_type: log.reading_type,
          timestamp: log.timestamp,
          symptoms: log.symptoms || undefined,
        });
        if (log.id) await dbService.markSynced(log.id);
        synced++;
      } catch {
        failed++;
      }
    }

    if (pending.length > 0 && failed === 0) {
      await dbService.clearSynced();
    }

    return { synced, failed };
  },
};
