import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  if (Constants.debuggerHost) {
    const host = Constants.debuggerHost.split(':')[0];
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      const baseUrl = getBaseUrl();
      const res = await axios.post(`${baseUrl}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`);
      const { access_token } = res.data;
      await SecureStore.setItemAsync('access_token', access_token);
      refreshQueue.forEach(({ resolve }) => resolve(access_token));
      refreshQueue = [];
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (err) {
      refreshQueue.forEach(({ reject }) => reject(err));
      refreshQueue = [];
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
