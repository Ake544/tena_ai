import api from './api';

export const exportService = {
  async generatePdf(days: number = 90): Promise<string> {
    const res = await api.post(`/export/pdf?days=${days}`);
    return res.data.url;
  },
};
