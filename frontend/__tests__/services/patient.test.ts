jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../services/db', () => ({
  __esModule: true,
  dbService: {
    cacheSet: jest.fn(),
    cacheGet: jest.fn(),
    getTodayLocalReadings: jest.fn(),
  },
}));

import { patientService } from '../../services/patient';
import api from '../../services/api';
import { dbService } from '../../services/db';

const mockApiGet = api.get as jest.Mock;
const mockApiPost = api.post as jest.Mock;
const mockCacheSet = dbService.cacheSet as jest.Mock;
const mockCacheGet = dbService.cacheGet as jest.Mock;
const mockGetTodayLocal = dbService.getTodayLocalReadings as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetTodayLocal.mockResolvedValue([]);
  mockCacheGet.mockResolvedValue(null);
});

const today = new Date().toISOString().split('T')[0];

const emptySlots = [
  { reading_type: 'Fasting', value: null, timestamp: null, id: null },
  { reading_type: 'Post-Breakfast', value: null, timestamp: null, id: null },
  { reading_type: 'Pre-Lunch', value: null, timestamp: null, id: null },
  { reading_type: 'Post-Lunch', value: null, timestamp: null, id: null },
  { reading_type: 'Pre-Dinner', value: null, timestamp: null, id: null },
  { reading_type: 'Post-Dinner', value: null, timestamp: null, id: null },
  { reading_type: 'Bedtime', value: null, timestamp: null, id: null },
];

describe('patientService', () => {
  describe('getProfile', () => {
    it('fetches profile from API', async () => {
      const profile = { id: '1', full_name: 'Test' };
      mockApiGet.mockResolvedValue({ data: profile });
      const result = await patientService.getProfile();
      expect(mockApiGet).toHaveBeenCalledWith('/patient/profile');
      expect(result).toEqual(profile);
    });
  });

  describe('getStats', () => {
    it('fetches stats from API', async () => {
      const stats = { last_glucose: 120, avg_fasting: 110, days_logged: 15 };
      mockApiGet.mockResolvedValue({ data: stats });
      const result = await patientService.getStats();
      expect(mockApiGet).toHaveBeenCalledWith('/glucose/stats');
      expect(result).toEqual(stats);
    });
  });

  describe('getTodayReadings', () => {
    describe('online success path', () => {
      it('returns API data and caches it', async () => {
        const apiData = { date: today, slots: [...emptySlots] };
        mockApiGet.mockResolvedValue({ data: apiData });

        const result = await patientService.getTodayReadings();

        expect(mockApiGet).toHaveBeenCalledWith('/glucose/today');
        expect(mockCacheSet).toHaveBeenCalledWith(`today_readings_${today}`, JSON.stringify(apiData));
        expect(result).toEqual(apiData);
      });

      it('merges unsynced local readings into empty slots', async () => {
        const apiData = {
          date: today,
          slots: [
            { reading_type: 'Fasting', value: null, timestamp: null, id: null },
            { reading_type: 'Pre-Lunch', value: null, timestamp: null, id: null },
          ],
        };
        mockApiGet.mockResolvedValue({ data: apiData });
        mockGetTodayLocal.mockResolvedValue([
          { id: 10, value: 130, reading_type: 'Fasting', timestamp: `${today}T07:00:00`, symptoms: null, synced: false },
          { id: 11, value: 160, reading_type: 'Pre-Lunch', timestamp: `${today}T12:00:00`, symptoms: null, synced: false },
        ]);

        const result = await patientService.getTodayReadings();
        expect(result.slots[0].value).toBe(130);
        expect(result.slots[0].id).toBe('10');
        expect(result.slots[1].value).toBe(160);
        expect(result.slots[1].id).toBe('11');
      });

      it('does not overwrite filled slots with local data', async () => {
        const apiData = {
          date: today,
          slots: [
            { reading_type: 'Fasting', value: 110, timestamp: `${today}T07:00:00`, id: '5' },
          ],
        };
        mockApiGet.mockResolvedValue({ data: apiData });
        mockGetTodayLocal.mockResolvedValue([
          { id: 10, value: 130, reading_type: 'Fasting', timestamp: `${today}T07:00:00`, symptoms: null, synced: false },
        ]);

        const result = await patientService.getTodayReadings();
        expect(result.slots[0].value).toBe(110);
        expect(result.slots[0].id).toBe('5');
      });
    });

    describe('offline fallback path', () => {
      it('falls back to cache when API fails', async () => {
        mockApiGet.mockRejectedValue(new Error('network'));
        const cached = { date: today, slots: [...emptySlots] };
        mockCacheGet.mockResolvedValue(JSON.stringify(cached));

        const result = await patientService.getTodayReadings();
        expect(mockCacheGet).toHaveBeenCalledWith(`today_readings_${today}`);
        expect(result.date).toBe(today);
        expect(result.slots).toHaveLength(7);
      });

      it('merges local unsynced into cached data', async () => {
        mockApiGet.mockRejectedValue(new Error('network'));
        const cached = {
          date: today,
          slots: [{ reading_type: 'Fasting', value: null, timestamp: null, id: null }],
        };
        mockCacheGet.mockResolvedValue(JSON.stringify(cached));
        mockGetTodayLocal.mockResolvedValue([
          { id: 20, value: 95, reading_type: 'Fasting', timestamp: `${today}T06:30:00`, symptoms: null, synced: false },
        ]);

        const result = await patientService.getTodayReadings();
        expect(result.slots[0].value).toBe(95);
        expect(result.slots[0].id).toBe('20');
      });

      it('constructs empty slots when no cache and no local data', async () => {
        mockApiGet.mockRejectedValue(new Error('network'));
        mockCacheGet.mockResolvedValue(null);
        mockGetTodayLocal.mockResolvedValue([]);

        const result = await patientService.getTodayReadings();
        expect(result.date).toBe(today);
        expect(result.slots).toHaveLength(7);
        expect(result.slots.map(s => s.reading_type)).toEqual([
          'Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch',
          'Pre-Dinner', 'Post-Dinner', 'Bedtime',
        ]);
        result.slots.forEach(slot => {
          expect(slot.value).toBeNull();
        });
      });

      it('constructs slots from local data when no cache', async () => {
        mockApiGet.mockRejectedValue(new Error('network'));
        mockCacheGet.mockResolvedValue(null);
        mockGetTodayLocal.mockResolvedValue([
          { id: 30, value: 140, reading_type: 'Post-Dinner', timestamp: `${today}T20:00:00`, symptoms: null, synced: false },
        ]);

        const result = await patientService.getTodayReadings();
        expect(result.slots.find(s => s.reading_type === 'Post-Dinner')!.value).toBe(140);
        expect(result.slots.find(s => s.reading_type === 'Fasting')!.value).toBeNull();
      });
    });
  });

  describe('logReading', () => {
    it('POSTs reading data', async () => {
      const reading = { id: '1', value: 120, reading_type: 'Fasting', timestamp: '2026-09-21T07:00:00', symptoms: null, synced: false, created_at: '' };
      mockApiPost.mockResolvedValue({ data: reading });
      const result = await patientService.logReading({
        value: 120,
        reading_type: 'Fasting',
        timestamp: '2026-09-21T07:00:00',
      });
      expect(mockApiPost).toHaveBeenCalledWith('/glucose/log', {
        value: 120,
        reading_type: 'Fasting',
        timestamp: '2026-09-21T07:00:00',
      });
      expect(result).toEqual(reading);
    });
  });

  describe('getHistory', () => {
    it('fetches history with default 30 days', async () => {
      mockApiGet.mockResolvedValue({ data: { readings: [] } });
      await patientService.getHistory();
      expect(mockApiGet).toHaveBeenCalledWith('/glucose/history?days=30');
    });

    it('accepts custom days', async () => {
      mockApiGet.mockResolvedValue({ data: { readings: [] } });
      await patientService.getHistory(7);
      expect(mockApiGet).toHaveBeenCalledWith('/glucose/history?days=7');
    });
  });

  describe('deleteAccount', () => {
    it('sends DELETE request', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});
      await patientService.deleteAccount();
      expect(api.delete).toHaveBeenCalledWith('/patient/account');
    });
  });
});
