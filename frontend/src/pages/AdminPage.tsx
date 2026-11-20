import React, { useEffect, useState } from 'react';
import { Check, Trash2, ScanFace, Power, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { adminApi, SystemSettings } from '../api/adminApi';
import { historyApi, StatsSummary } from '../api/historyApi';
import { biometricsApi } from '../api/biometricsApi';
import { UserOut } from '../api/authApi';
import { usePrefs } from '../context/PrefsContext';

// Recommended values for the v3 PAD model (see AGENTS.md / CHANGES_v3.md)
const PAD_RECOMMENDED = 0.0851;
const MATCH_RECOMMENDED = 0.6;

interface SliderProps {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  left: string;
  right: string;
  recommended: number;
  recoLabel: string;
  onChange: (v: number) => void;
}

const Slider: React.FC<SliderProps> = ({ id, label, hint, value, min, max, step, left, right, recommended, recoLabel, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <span className="tabular-nums text-sm text-ink-3">{value.toFixed(4)}</span>
    </div>
    <p className="text-sm text-ink-3 mt-0.5">{hint}</p>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full mt-3 accent-ink h-6"
    />
    <div className="flex justify-between text-xs text-ink-4">
      <span>{left}</span>
      {value !== recommended && (
        <button type="button" onClick={() => onChange(recommended)} className="inline-flex items-center gap-1 text-accent font-medium">
          <RotateCcw className="w-3 h-3" aria-hidden /> {recoLabel} ({recommended})
        </button>
      )}
      <span>{right}</span>
    </div>
  </div>
);

export const AdminPage: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const { t } = usePrefs();
  const { playSuccess, playAlert } = useSound();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [pad, setPad] = useState(PAD_RECOMMENDED);
  const [match, setMatch] = useState(MATCH_RECOMMENDED);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // two-tap confirm instead of window.confirm (blocked in some frames)
  const [armed, setArmed] = useState<string | null>(null);
  const arm = (key: string, fn: () => void) => {
    if (armed === key) {
      setArmed(null);
      fn();
    } else {
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 3000);
    }
  };

  const load = async () => {
    const [s, st, u] = await Promise.allSettled([adminApi.getSettings(), historyApi.getStats(), adminApi.listUsers()]);
    if (s.status === 'fulfilled') {
      setSettings(s.value);
      setPad(s.value.pad_threshold);
      setMatch(s.value.face_match_threshold);
    }
    if (st.status === 'fulfilled') setStats(st.value);
    if (u.status === 'fulfilled') setUsers(u.value);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return <p className="glass rounded-4xl p-10 text-center text-ink-3 max-w-md mx-auto">{t('a_only')}</p>;
  }

  const save = async () => {
    try {
      await adminApi.updateSettings({
        pad_threshold: pad,
        face_match_threshold: match,
        blur_threshold: settings?.blur_threshold,
        min_face_resolution: settings?.min_face_resolution,
      });
      playSuccess();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      playAlert();
      setError(t('a_save_fail'));
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      playSuccess();
      load();
    } catch (err: any) {
      playAlert();
      setError(err?.response?.data?.detail || t('a_fail'));
    }
  };

  const numbers = [
    { label: t('a_total'), value: stats?.total_verifications },
    { label: t('a_ok'), value: stats?.verified_count },
    { label: t('a_spoof'), value: stats?.spoof_count },
    { label: t('a_faces'), value: stats?.active_biometric_templates },
  ];

  const dirty = settings && (pad !== settings.pad_threshold || match !== settings.face_match_threshold);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('a_title')}</h1>
      {error && (
        <p role="alert" className="glass rounded-2xl px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {numbers.map((n) => (
          <div key={n.label} className="glass rounded-3xl p-4">
            <div className="text-2xl sm:text-3xl font-semibold tabular-nums">{n.value ?? '–'}</div>
            <div className="text-sm text-ink-3 mt-1">{n.label}</div>
          </div>
        ))}
      </div>

      <section className="glass rounded-4xl p-5 sm:p-7 space-y-7">
        <h2 className="text-lg font-semibold">{t('a_sens')}</h2>
        <Slider
          id="pad"
          label={t('a_pad')}
          hint={t('a_pad_hint')}
          value={pad}
          min={0.01}
          max={0.95}
          step={0.0001}
          left={t('a_strict')}
          right={t('a_soft')}
          recommended={PAD_RECOMMENDED}
          recoLabel={t('a_reco')}
          onChange={setPad}
        />
        <Slider
          id="match"
          label={t('a_match')}
          hint={t('a_match_hint')}
          value={match}
          min={0.4}
          max={0.85}
          step={0.01}
          left={t('a_easy')}
          right={t('a_hard')}
          recommended={MATCH_RECOMMENDED}
          recoLabel={t('a_reco')}
          onChange={setMatch}
        />
        <button onClick={save} disabled={!dirty && !saved} className="btn-primary w-full sm:w-auto">
          {saved ? (
            <>
              <Check className="w-4 h-4" aria-hidden /> {t('a_saved')}
            </>
          ) : (
            t('a_save')
          )}
        </button>
      </section>

      <section className="glass rounded-4xl overflow-hidden">
        <h2 className="text-lg font-semibold px-5 sm:px-7 pt-5 sm:pt-6 pb-3">{t('a_users')}</h2>
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-5 sm:px-7 py-3">
              <span
                className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold uppercase ${
                  u.is_active ? 'bg-ink text-surface' : 'bg-fill text-ink-4'
                }`}
              >
                {u.username[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {u.full_name || u.username}
                  {u.role === 'admin' && <span className="ml-2 text-xs text-ink-4">{t('a_admin_tag')}</span>}
                </div>
                <div className="text-sm text-ink-3 truncate">
                  {u.has_biometric_template ? t('a_has_face') : t('a_no_face')}
                  {!u.is_active && ` · ${t('a_inactive')}`}
                </div>
              </div>
              {u.id !== currentUser?.id && (
                <div className="flex shrink-0">
                  {u.has_biometric_template && (
                    <button
                      onClick={() => arm(`t${u.id}`, () => act(() => biometricsApi.deleteTemplate(u.id)))}
                      className="min-w-[44px] h-11 px-1 rounded-full flex items-center justify-center text-ink-3 hover:bg-fill"
                      title={t('a_del_face')}
                      aria-label={t('a_del_face')}
                    >
                      {armed === `t${u.id}` ? <span className="text-xs font-semibold text-bad">{t('a_sure')}</span> : <ScanFace className="w-5 h-5" />}
                    </button>
                  )}
                  <button
                    onClick={() => act(() => adminApi.toggleUserStatus(u.id))}
                    className="min-w-[44px] h-11 px-1 rounded-full flex items-center justify-center text-ink-3 hover:bg-fill"
                    title={u.is_active ? t('a_deactivate') : t('a_activate')}
                    aria-label={u.is_active ? t('a_deactivate') : t('a_activate')}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => arm(`u${u.id}`, () => act(() => adminApi.deleteUser(u.id)))}
                    className="min-w-[44px] h-11 px-1 rounded-full flex items-center justify-center text-bad hover:bg-bad/10"
                    title={t('a_del_user')}
                    aria-label={t('a_del_user')}
                  >
                    {armed === `u${u.id}` ? <span className="text-xs font-semibold">{t('a_sure')}</span> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
