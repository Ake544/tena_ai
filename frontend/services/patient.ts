import api from './api';
import { dbService } from './db';

export interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  email_verified: boolean;
  language: string;
  age: number | null;
  sex: string | null;
  bmi: number | null;
  education_level: string | null;
  family_history: boolean;
  family_history_details: string | null;
  diagnosis_date: string | null;
  diabetes_type: number | null;
  other_conditions: string | null;
  hba1c: number | null;
  exercise_habit: string | null;
  staple_diet: string | null;
  timezone: string;
  created_at: string;
}

export type ProfileUpdate = Partial<Pick<PatientProfile, 'full_name' | 'age' | 'sex' | 'bmi' | 'education_level' | 'family_history' | 'family_history_details' | 'diagnosis_date' | 'diabetes_type' | 'other_conditions' | 'hba1c' | 'exercise_habit' | 'staple_diet' | 'language' | 'timezone'>>;

export interface GlucoseStats {
  last_glucose: number | null;
  avg_fasting: number | null;
  days_logged: number;
  today_high_count: number;
  today_count: number;
}

export interface GlucoseTodaySlot {
  reading_type: string;
  value: number | null;
  timestamp: string | null;
  id: string | null;
}

export interface GlucoseTodayResponse {
  date: string;
  slots: GlucoseTodaySlot[];
}

export interface GlucoseLogResponse {
  id: string;
  value: number;
  reading_type: string;
  timestamp: string;
  symptoms: string | null;
  synced: boolean;
  created_at: string;
}

export const patientService = {
  async getProfile(): Promise<PatientProfile> {
    const res = await api.get('/patient/profile');
    return res.data;
  },

  async updateProfile(data: Partial<PatientProfile>): Promise<PatientProfile> {
    const res = await api.put('/patient/profile', data);
    return res.data;
  },

  async getStats(): Promise<GlucoseStats> {
    const res = await api.get('/glucose/stats');
    return res.data;
  },

  async getTodayReadings(): Promise<GlucoseTodayResponse> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `today_readings_${today}`;
    try {
      const res = await api.get('/glucose/today');
      const data: GlucoseTodayResponse = res.data;
      await dbService.cacheSet(cacheKey, JSON.stringify(data));
      const localReadings = await dbService.getTodayLocalReadings();
      const unsynced = localReadings.filter(r => !r.synced);
      if (unsynced.length === 0) return data;
      for (const log of unsynced) {
        const slot = data.slots.find(s => s.reading_type === log.reading_type);
        if (slot && slot.value === null) {
          slot.value = log.value;
          slot.timestamp = log.timestamp;
          slot.id = String(log.id);
        }
      }
      return data;
    } catch {
      const cached = await dbService.cacheGet(cacheKey);
      const localReadings = await dbService.getTodayLocalReadings();
      const slotTypes = ['Fasting', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Post-Dinner', 'Bedtime'];
      if (cached) {
        try {
          const data: GlucoseTodayResponse = JSON.parse(cached);
          for (const log of localReadings) {
            const slot = data.slots.find(s => s.reading_type === log.reading_type);
            if (slot && slot.value === null) {
              slot.value = log.value;
              slot.timestamp = log.timestamp;
              slot.id = String(log.id);
            }
          }
          return data;
        } catch {}
      }
      const slots: GlucoseTodaySlot[] = slotTypes.map(type => {
        const match = localReadings.find(r => r.reading_type === type);
        return {
          reading_type: type,
          value: match?.value ?? null,
          timestamp: match?.timestamp ?? null,
          id: match?.id ? String(match.id) : null,
        };
      });
      return { date: today, slots };
    }
  },

  async logReading(data: {
    value: number;
    reading_type: string;
    timestamp: string;
    symptoms?: string;
  }): Promise<GlucoseLogResponse> {
    const res = await api.post('/glucose/log', data);
    return res.data;
  },

  async getHistory(days: number = 30) {
    const res = await api.get(`/glucose/history?days=${days}`);
    return res.data;
  },

  async syncLogs(logs: any[]) {
    const res = await api.post('/glucose/sync', { logs });
    return res.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/patient/account');
  },
};
