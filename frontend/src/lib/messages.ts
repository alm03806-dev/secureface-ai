import type { Key } from './i18n';

/** Maps an API error to one short message key. */
export function errorKey(err: any): Key {
  const detail = err?.response?.data?.detail;
  const t = (typeof detail === 'string' ? detail : '').toLowerCase();
  if (!err?.response) return 'err_server';
  if (t.includes('no face')) return 'err_noface';
  if (t.includes('multi')) return 'err_multi';
  if (t.includes('blur') || t.includes('quality')) return 'err_blur';
  if (t.includes('spoof') || t.includes('attack')) return 'err_spoof';
  if (err.response.status === 401) return 'err_login';
  return 'err_generic';
}
