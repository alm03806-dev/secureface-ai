import { apiClient } from './client';

export interface UserOut {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'operator' | 'user';
  is_active: boolean;
  has_biometric_template: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
  user_id: number;
}

export const authApi = {
  register: async (payload: { username: string; email: string; password: string; full_name?: string }) => {
    const res = await apiClient.post<TokenResponse>('/auth/register', payload);
    return res.data;
  },

  login: async (payload: { username: string; password: string }) => {
    const res = await apiClient.post<TokenResponse>('/auth/login', payload);
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<UserOut>('/auth/me');
    return res.data;
  }
};
