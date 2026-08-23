import api from './api';

export interface Alert {
  id: string;
  title: string;
  body: string;
  severity: string;
  category: string;
  acknowledged: boolean;
  created_at: string;
}

export const alertService = {
  async getActive(): Promise<Alert[]> {
    const res = await api.get('/alerts/active');
    return res.data;
  },

  async getHistory(): Promise<Alert[]> {
    const res = await api.get('/alerts/history');
    return res.data;
  },

  async getOne(id: string): Promise<Alert> {
    const res = await api.get(`/alerts/${id}`);
    return res.data;
  },

  async acknowledge(id: string): Promise<Alert> {
    const res = await api.post(`/alerts/${id}/acknowledge`);
    return res.data;
  },

  async acknowledgeAll(): Promise<void> {
    await api.post('/alerts/acknowledge-all');
  },
};
