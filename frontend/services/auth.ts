import api from './api';
import * as SecureStore from 'expo-secure-store';

interface SignupData {
  full_name: string;
  email: string;
  password: string;
  language?: string;
  age?: number;
  sex?: string;
  education_level?: string;
  family_history?: boolean;
  exercise_habit?: string;
  staple_diet?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async signup(data: SignupData) {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  async login(data: LoginData) {
    const res = await api.post('/auth/login', data);
    const { access_token, refresh_token } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    await SecureStore.setItemAsync('refresh_token', refresh_token);
    return res.data;
  },

  async verifyEmail(email: string, otp: string) {
    const res = await api.post('/auth/verify-email', { email, otp });
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(email: string, otp: string, new_password: string) {
    const res = await api.post('/auth/reset-password', { email, otp, new_password });
    return res.data;
  },

  async logout() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async getAccessToken() {
    return SecureStore.getItemAsync('access_token');
  },
};
