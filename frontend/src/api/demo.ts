// Fake backend for the static demo build (VITE_DEMO=1). Data lives in memory only.
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

const now = () => new Date().toISOString();
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

let me = { id: 1, username: 'demo', email: 'demo@secureface.app', full_name: 'ডেমো ব্যবহারকারী', role: 'admin', is_active: true, has_biometric_template: true, created_at: ago(5000) };
let users = [
  me,
  { id: 2, username: 'rahim', email: 'rahim@example.com', full_name: 'রহিম', role: 'user', is_active: true, has_biometric_template: true, created_at: ago(3000) },
  { id: 3, username: 'karim', email: 'karim@example.com', full_name: '', role: 'user', is_active: false, has_biometric_template: false, created_at: ago(2000) },
];
let settings = { pad_threshold: 0.0851, face_match_threshold: 0.6, blur_threshold: 30, min_face_resolution: 80, pad_model_path: '', pad_image_size: 224, pad_mean: [], pad_std: [] };
let nextId = 10;
const logs: any[] = [
  { id: 4, detected_identity: 'rahim', pad_verdict: 'LIVE', status: 'VERIFIED', timestamp: ago(12) },
  { id: 3, detected_identity: null, pad_verdict: 'SPOOF', status: 'SPOOF_REJECTED', timestamp: ago(95) },
  { id: 2, detected_identity: 'demo', pad_verdict: 'LIVE', status: 'ENROLLED', timestamp: ago(60 * 26) },
  { id: 1, detected_identity: null, pad_verdict: 'LIVE', status: 'IDENTITY_MISMATCH', timestamp: ago(60 * 50) },
].map((l) => ({ attack_score: 0, threshold: 0.0851, is_verified: l.status === 'VERIFIED', ...l }));

// verify results rotate so every state can be seen
const CYCLE = ['VERIFIED', 'SPOOF_REJECTED', 'IDENTITY_MISMATCH'];
let turn = 0;

const log = (status: string, verdict: string, who: string | null) =>
  logs.unshift({ id: nextId++, detected_identity: who, claimed_identifier: null, pad_verdict: verdict, attack_score: 0, threshold: settings.pad_threshold, is_verified: status === 'VERIFIED', status, timestamp: now() });

function handle(method: string, path: string, body: any, params: any): [number, any] {
  if (path === '/auth/login' || path === '/auth/register') {
    if (body?.username) me = { ...me, username: body.username, full_name: body.username };
    users[0] = me;
    return [200, { access_token: 'demo-token', token_type: 'bearer', role: me.role, username: me.username, user_id: me.id }];
  }
  if (path === '/auth/me') return [200, me];

  if (path === '/biometrics/enroll') {
    me = { ...me, has_biometric_template: true };
    users[0] = me;
    log('ENROLLED', 'LIVE', me.username);
    return [200, { success: true, message: 'ok', user_id: me.id, username: me.username, enrolled_at: now(), template_dim: 128, attack_score: 0.01, pad_verdict: 'LIVE' }];
  }
  if (path === '/biometrics/verify') {
    const status = CYCLE[turn++ % CYCLE.length];
    const ok = status === 'VERIFIED';
    log(status, status === 'SPOOF_REJECTED' ? 'SPOOF' : 'LIVE', ok ? me.username : null);
    return [200, {
      verified: ok, status, pad_verdict: status === 'SPOOF_REJECTED' ? 'SPOOF' : 'LIVE', attack_score: 0, pad_threshold: settings.pad_threshold,
      match_threshold: settings.face_match_threshold, matched_user: ok ? { user_id: me.id, username: me.username, full_name: me.full_name, email: me.email } : undefined, message: '',
    }];
  }
  const tpl = path.match(/^\/biometrics\/template\/(\d+)$/);
  if (tpl && method === 'delete') {
    users = users.map((u) => (u.id === +tpl[1] ? { ...u, has_biometric_template: false } : u));
    return [200, { success: true }];
  }

  if (path === '/history') {
    let items = logs;
    if (params?.status) items = items.filter((l) => l.status === params.status);
    if (params?.verdict) items = items.filter((l) => l.pad_verdict === params.verdict);
    return [200, { total: items.length, items }];
  }
  if (path === '/history/stats') {
    const count = (s: string) => logs.filter((l) => l.status === s).length;
    return [200, {
      total_verifications: logs.filter((l) => l.status !== 'ENROLLED').length, live_count: 0, spoof_count: count('SPOOF_REJECTED'),
      verified_count: count('VERIFIED'), spoof_rejection_rate: 0, active_registered_users: users.length,
      active_biometric_templates: users.filter((u) => u.has_biometric_template).length, daily_trend: [], latest_logs: [],
    }];
  }

  if (path === '/admin/settings') {
    if (method === 'put') settings = { ...settings, ...Object.fromEntries(Object.entries(body ?? {}).filter(([, v]) => v !== undefined)) };
    return [200, settings];
  }
  if (path === '/admin/users') return [200, users];
  const tog = path.match(/^\/admin\/users\/(\d+)\/toggle-status$/);
  if (tog) {
    users = users.map((u) => (u.id === +tog[1] ? { ...u, is_active: !u.is_active } : u));
    return [200, { success: true }];
  }
  const del = path.match(/^\/admin\/users\/(\d+)$/);
  if (del && method === 'delete') {
    users = users.filter((u) => u.id !== +del[1]);
    return [200, { success: true }];
  }
  return [404, { detail: 'Not available in demo' }];
}

export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const path = (config.url ?? '').replace(/^\/api/, '').split('?')[0];
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data;
  await new Promise((r) => setTimeout(r, 350));
  const [status, data] = handle((config.method ?? 'get').toLowerCase(), path, body, config.params);
  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    const err: any = new Error(data.detail);
    err.response = response;
    throw err;
  }
  return response;
};
