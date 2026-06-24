import api from './api';

export interface SymptomLog {
  id: string;
  name: string;
  severity: number | null;
  timestamp: string;
  created_at: string;
}

export const symptomService = {
  async log(data: { name: string; severity?: number; timestamp?: string }): Promise<SymptomLog> {
    const res = await api.post('/symptoms/log', data);
    return res.data;
  },

  async history(days: number = 30): Promise<SymptomLog[]> {
    const res = await api.get(`/symptoms/history?days=${days}`);
    return res.data;
  },
};
