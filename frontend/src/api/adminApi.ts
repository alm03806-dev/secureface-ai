import { apiClient } from './client';
import { UserOut } from './authApi';

export interface DiagnosticsResponse {
  system_status: string;
  pad_model_loaded: boolean;
  pad_model_name: string;
  pad_model_path: string;
  onnx_providers: string[];
  database_status: string;
  total_users: number;
  total_templates: number;
  total_logs: number;
  uptime_seconds: number;
}

export interface SystemSettings {
  pad_threshold: number;
  face_match_threshold: number;
  blur_threshold: number;
  min_face_resolution: number;
  pad_model_path: string;
  pad_image_size: number;
  pad_mean: number[];
  pad_std: number[];
}

export const adminApi = {
  listUsers: async () => {
    const res = await apiClient.get<UserOut[]>('/admin/users');
    return res.data;
  },

  toggleUserStatus: async (userId: number) => {
    const res = await apiClient.put<{ success: boolean; user_id: number; is_active: boolean }>(`/admin/users/${userId}/toggle-status`);
    return res.data;
  },

  deleteUser: async (userId: number) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`);
    return res.data;
  },

  getSettings: async () => {
    const res = await apiClient.get<SystemSettings>('/admin/settings');
    return res.data;
  },

  updateSettings: async (payload: { pad_threshold?: number; face_match_threshold?: number; blur_threshold?: number; min_face_resolution?: number }) => {
    const res = await apiClient.put('/admin/settings', payload);
    return res.data;
  },

  getDiagnostics: async () => {
    const res = await apiClient.get<DiagnosticsResponse>('/admin/diagnostics');
    return res.data;
  }
};
