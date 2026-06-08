import api from './api';

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  times: string;
  notes: string | null;
  taken_times: string | null;
  skipped_times: string | null;
  taken_today: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  title: string;
  hospital: string;
  appointment_type: string | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export const medicationService = {
  async list(): Promise<Medication[]> {
    const res = await api.get('/medications');
    return res.data;
  },

  async create(data: { name: string; dose: string; frequency: string; times: string; notes?: string }): Promise<Medication> {
    const res = await api.post('/medications', data);
    return res.data;
  },

  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    const res = await api.put(`/medications/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/medications/${id}`);
  },

  async markTaken(id: string, time: string): Promise<Medication> {
    const res = await api.post(`/medications/${id}/taken?time=${encodeURIComponent(time)}`);
    return res.data;
  },

  async markSkip(id: string, time: string): Promise<Medication> {
    const res = await api.post(`/medications/${id}/skip?time=${encodeURIComponent(time)}`);
    return res.data;
  },

  async listAppointments(): Promise<Appointment[]> {
    const res = await api.get('/appointments');
    return res.data;
  },

  async createAppointment(data: { title: string; hospital: string; appointment_type?: string; date: string; notes?: string }): Promise<Appointment> {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const res = await api.put(`/appointments/${id}`, data);
    return res.data;
  },

  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
};
