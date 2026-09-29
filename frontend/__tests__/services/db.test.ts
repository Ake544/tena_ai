jest.mock('expo-sqlite', () => {
  const store: Record<string, any[]> = { pending_logs: [], cache: [] };
  let autoId = 1;

  const mockDb = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('INSERT INTO pending_logs')) {
        const row = {
          id: autoId++,
          value: params![0],
          reading_type: params![1],
          timestamp: params![2],
          symptoms: params![3],
          synced: params![4],
        };
        store.pending_logs.push(row);
        return { lastInsertRowId: row.id };
      }
      if (sql.includes('UPDATE pending_logs SET synced')) {
        const id = params![0];
        const row = store.pending_logs.find((r: any) => r.id === id);
        if (row) row.synced = 1;
      }
      if (sql.includes('DELETE FROM pending_logs WHERE synced')) {
        store.pending_logs = store.pending_logs.filter((r: any) => r.synced !== 1);
      } else if (sql.includes('DELETE FROM pending_logs')) {
        store.pending_logs = [];
      }
      if (sql.includes('INSERT OR REPLACE INTO cache')) {
        const existing = store.cache.find((c: any) => c.key === params![0]);
        if (existing) existing.value = params![1];
        else store.cache.push({ key: params![0], value: params![1] });
      }
      return {};
    }),
    getAllAsync: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('WHERE synced = 0')) {
        return store.pending_logs.filter((r: any) => r.synced === 0);
      }
      if (sql.includes('WHERE timestamp LIKE')) {
        const pattern = params![0] as string;
        const prefix = pattern.replace('%', '');
        return store.pending_logs.filter((r: any) => r.timestamp.startsWith(prefix));
      }
      return store.pending_logs;
    }),
    getFirstAsync: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
      return store.cache.find((c: any) => c.key === params![0]) ?? null;
    }),
  };

  return {
    openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
    __store: store,
    __reset: () => {
      store.pending_logs = [];
      store.cache = [];
      autoId = 1;
    },
  };
});

import { dbService } from '../../services/db';
import * as SQLite from 'expo-sqlite';

beforeEach(() => {
  (SQLite as any).__reset();
});

describe('dbService', () => {
  describe('saveLog', () => {
    it('inserts a log into pending_logs', async () => {
      await dbService.saveLog({
        value: 120,
        reading_type: 'Fasting',
        timestamp: '2026-09-21T07:00:00',
        symptoms: null,
      });
      const logs = await dbService.getPendingLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].value).toBe(120);
      expect(logs[0].reading_type).toBe('Fasting');
      expect(logs[0].synced).toBe(false);
    });

    it('stores synced flag', async () => {
      await dbService.saveLog({
        value: 150,
        reading_type: 'Pre-Lunch',
        timestamp: '2026-09-21T12:00:00',
        symptoms: 'headache',
        synced: true,
      });
      const logs = await dbService.getAllLogs();
      expect(logs[0].synced).toBe(true);
    });
  });

  describe('getPendingLogs', () => {
    it('returns only unsynced logs', async () => {
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null });
      await dbService.saveLog({ value: 200, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00', synced: true, symptoms: null });
      const pending = await dbService.getPendingLogs();
      expect(pending).toHaveLength(1);
      expect(pending[0].value).toBe(100);
    });
  });

  describe('markSynced', () => {
    it('marks a log as synced', async () => {
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null });
      const logs = await dbService.getPendingLogs();
      await dbService.markSynced(logs[0].id!);
      const pending = await dbService.getPendingLogs();
      expect(pending).toHaveLength(0);
    });
  });

  describe('clearSynced', () => {
    it('removes only synced logs', async () => {
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null });
      await dbService.saveLog({ value: 200, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00', synced: true, symptoms: null });
      await dbService.clearSynced();
      const all = await dbService.getAllLogs();
      expect(all).toHaveLength(1);
      expect(all[0].value).toBe(100);
    });
  });

  describe('cacheSet / cacheGet', () => {
    it('stores and retrieves a value', async () => {
      await dbService.cacheSet('key1', 'value1');
      expect(await dbService.cacheGet('key1')).toBe('value1');
    });

    it('returns null for missing key', async () => {
      expect(await dbService.cacheGet('nonexistent')).toBeNull();
    });

    it('overwrites existing key', async () => {
      await dbService.cacheSet('key1', 'v1');
      await dbService.cacheSet('key1', 'v2');
      expect(await dbService.cacheGet('key1')).toBe('v2');
    });
  });

  describe('clearAllLogs', () => {
    it('removes all logs', async () => {
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null });
      await dbService.saveLog({ value: 200, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00', symptoms: null });
      await dbService.clearAllLogs();
      const all = await dbService.getAllLogs();
      expect(all).toHaveLength(0);
    });
  });

  describe('getTodayLocalReadings', () => {
    it('returns only today\'s readings', async () => {
      const today = new Date().toISOString().split('T')[0];
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: `${today}T07:00:00`, symptoms: null });
      await dbService.saveLog({ value: 200, reading_type: 'Fasting', timestamp: '2025-01-01T07:00:00', symptoms: null });
      const readings = await dbService.getTodayLocalReadings();
      expect(readings).toHaveLength(1);
      expect(readings[0].value).toBe(100);
    });
  });

  describe('boolean mapping', () => {
    it('maps integer 0 to false and 1 to true', async () => {
      await dbService.saveLog({ value: 100, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null });
      await dbService.saveLog({ value: 200, reading_type: 'Pre-Lunch', timestamp: '2026-09-21T12:00:00', synced: true, symptoms: null });
      const all = await dbService.getAllLogs();
      expect(all[0].synced).toBe(false);
      expect(all[1].synced).toBe(true);
    });
  });
});
