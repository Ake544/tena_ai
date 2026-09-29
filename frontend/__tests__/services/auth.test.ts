import * as SecureStore from 'expo-secure-store';
import { authService } from '../../services/auth';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import api from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  describe('signup', () => {
    it('POSTs to /auth/signup', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'ok' } });
      const result = await authService.signup({ full_name: 'Test', email: 't@t.com', password: 'Pass123!' });
      expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', { full_name: 'Test', email: 't@t.com', password: 'Pass123!' });
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('login', () => {
    it('stores tokens on successful login', async () => {
      mockApi.post.mockResolvedValue({
        data: { access_token: 'at_123', refresh_token: 'rt_456', token_type: 'bearer' },
      });

      const result = await authService.login({ email: 't@t.com', password: 'Pass123!' });

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'at_123');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'rt_456');
      expect(result.access_token).toBe('at_123');
    });
  });

  describe('logout', () => {
    it('deletes both tokens', async () => {
      await authService.logout();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('getAccessToken', () => {
    it('reads from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('stored_token');
      expect(await authService.getAccessToken()).toBe('stored_token');
    });

    it('returns null when not stored', async () => {
      expect(await authService.getAccessToken()).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    it('POSTs email and otp', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Email verified successfully' } });
      await authService.verifyEmail('t@t.com', '123456');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/verify-email', { email: 't@t.com', otp: '123456' });
    });
  });

  describe('forgotPassword', () => {
    it('POSTs email', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'OTP sent' } });
      await authService.forgotPassword('t@t.com');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 't@t.com' });
    });
  });

  describe('resetPassword', () => {
    it('POSTs email, otp, and new password', async () => {
      mockApi.post.mockResolvedValue({ data: { message: 'Password reset' } });
      await authService.resetPassword('t@t.com', '123456', 'NewPass!');
      expect(mockApi.post).toHaveBeenCalledWith('/auth/reset-password', {
        email: 't@t.com',
        otp: '123456',
        new_password: 'NewPass!',
      });
    });
  });
});
