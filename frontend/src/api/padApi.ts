import { apiClient } from './client';

export interface QualityCheckResult {
  passed: boolean;
  blur_score: number;
  face_resolution?: [number, number];
  issues: string[];
}

export interface PADResponse {
  label: 'LIVE' | 'SPOOF';
  attack_score: number;
  threshold: number;
  is_live: boolean;
  model_scores: Record<string, number>;
  face_detected: boolean;
  face_box?: [number, number, number, number];
  quality: QualityCheckResult;
  note: string;
}

export const padApi = {
  predictJson: async (imageBase64: string) => {
    const res = await apiClient.post<PADResponse>('/pad/predict-json', {
      image_base64: imageBase64
    });
    return res.data;
  },

  predictMultipart: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<PADResponse>('/pad/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
