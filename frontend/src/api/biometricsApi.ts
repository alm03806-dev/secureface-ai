import { apiClient } from './client';

export interface EnrollResponse {
  success: boolean;
  message: string;
  user_id: number;
  username: string;
  enrolled_at: string;
  template_dim: number;
  attack_score: number;
  pad_verdict: string;
  face_box?: [number, number, number, number];
}

export interface MatchedUserInfo {
  user_id: number;
  username: string;
  full_name?: string;
  email: string;
}

export interface VerifyResponse {
  verified: boolean;
  status: string;
  pad_verdict: string;
  attack_score: number;
  pad_threshold: number;
  match_score?: number;
  match_threshold: number;
  matched_user?: MatchedUserInfo;
  face_box?: [number, number, number, number];
  message: string;
  log_id?: number;
}

export const biometricsApi = {
  enroll: async (payload: { image_base64: string; consent: boolean }) => {
    const res = await apiClient.post<EnrollResponse>('/biometrics/enroll', payload);
    return res.data;
  },

  verify: async (payload: { image_base64: string; claimed_username?: string }) => {
    const res = await apiClient.post<VerifyResponse>('/biometrics/verify', payload);
    return res.data;
  },

  deleteTemplate: async (userId: number) => {
    const res = await apiClient.delete(`/biometrics/template/${userId}`);
    return res.data;
  }
};
