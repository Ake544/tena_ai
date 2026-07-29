import api from './api';

export interface GlucoseSummary {
  total_readings: number;
  avg_readings: Record<string, number | null>;
  days_in_range: number;
  days_high: number;
  days_low: number;
  hba1c_est: number | null;
}

export interface GlucoseChartPoint {
  date: string;
  value: number;
  reading_type: string;
}

export interface AlertItem {
  id: number;
  title: string;
  body: string;
  severity: string;
  action: string;
  triggered_at: string;
  read: boolean;
}

export const historyService = {
  async getSummary(days: number = 30): Promise<GlucoseSummary> {
    const res = await api.get(`/history/summary?days=${days}`);
    return res.data;
  },
  async getGlucoseChart(days: number = 30): Promise<GlucoseChartPoint[]> {
    const res = await api.get(`/history/glucose-chart?days=${days}`);
    return res.data;
  },
  async getAlerts(days: number = 30): Promise<AlertItem[]> {
    const res = await api.get(`/history/alerts?days=${days}`);
    return res.data;
  },
};
