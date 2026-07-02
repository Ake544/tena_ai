import api from './api';

export interface Tip {
  id: string;
  title: string;
  body: string;
  category: string;
  fact: string | null;
  date: string;
}

export interface TipList {
  today: Tip[];
  history: Tip[];
}

export const tipService = {
  async getToday(): Promise<TipList> {
    const res = await api.get('/tips/today');
    return res.data;
  },

  async getHistory(): Promise<Tip[]> {
    const res = await api.get('/tips/history');
    return res.data;
  },

  async generate(): Promise<any> {
    const res = await api.post('/tips/generate');
    return res.data;
  },
};
