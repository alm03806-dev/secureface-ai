import { apiClient } from './client';

export interface VerificationLogItem {
  id: number;
  user_id?: number;
  claimed_identifier?: string;
  detected_identity?: string;
  pad_verdict: string;
  attack_score: number;
  threshold: number;
  match_score?: number;
  is_verified: boolean;
  status: string;
  timestamp: string;
  client_ip?: string;
  notes?: string;
}

export interface HistoryResponse {
  total: number;
  items: VerificationLogItem[];
}

export interface DailyActivity {
  date: string;
  total: number;
  live: number;
  spoof: number;
  verified: number;
}

export interface StatsSummary {
  total_verifications: number;
  live_count: number;
  spoof_count: number;
  verified_count: number;
  spoof_rejection_rate: number;
  active_registered_users: number;
  active_biometric_templates: number;
  daily_trend: DailyActivity[];
  latest_logs: VerificationLogItem[];
}

export const historyApi = {
  getHistory: async (params?: { limit?: number; offset?: number; verdict?: string; status?: string }) => {
    const res = await apiClient.get<HistoryResponse>('/history', { params });
    return res.data;
  },

  getStats: async () => {
    const res = await apiClient.get<StatsSummary>('/history/stats');
    return res.data;
  }
};
