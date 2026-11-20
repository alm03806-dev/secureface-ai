import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { MascotOrb } from '../components/MascotOrb';
import { usePrefs } from '../context/PrefsContext';
import { Tilt } from '../components/Tilt';

export const LoginPage: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { t } = usePrefs();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data =
        mode === 'up'
          ? await authApi.register({ username: username.trim(), email: email.trim(), password })
          : await authApi.login({ username: username.trim(), password });
      await login(data.access_token, data.username, data.role);
      onSuccess();
    } catch (err: any) {
      const d = err?.response?.data?.detail;
      setError(!err?.response ? t('l_err_server') : mode === 'in' ? t('l_err_cred') : typeof d === 'string' ? d : t('l_err_up'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center">
      <Tilt max={12} global>
        <MascotOrb state={error ? 'spoof_detected' : busy ? 'analyzing' : 'idle'} size="md" />
      </Tilt>

      <div className="mt-10 w-full glass rounded-4xl p-6 sm:p-7">
        {/* Segmented control */}
        <div className="relative grid grid-cols-2 p-1 rounded-full bg-fill mb-6" role="tablist">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`relative h-10 rounded-full text-sm font-semibold transition-colors ${mode === m ? 'text-ink' : 'text-ink-3'}`}
            >
              {mode === m && (
                <motion.span
                  layoutId="auth-seg"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  className="absolute inset-0 rounded-full bg-pill shadow-sm"
                />
              )}
              <span className="relative">{m === 'in' ? t('l_tab_in') : t('l_tab_up')}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="u" className="label">
              {mode === 'in' ? t('l_user_in') : t('l_user_up')}
            </label>
            <input id="u" className="field" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </div>

          <AnimatePresence initial={false}>
            {mode === 'up' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <label htmlFor="e" className="label">
                  {t('l_email')}
                </label>
                <input id="e" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label htmlFor="p" className="label">
              {t('l_pass')}
            </label>
            <input
              id="p"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-bad">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full !mt-6">
            {busy ? t('l_busy') : mode === 'in' ? t('l_btn_in') : t('l_btn_up')}
          </button>
        </form>
      </div>
    </div>
  );
};
