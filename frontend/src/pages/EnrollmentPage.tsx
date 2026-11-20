import React, { useRef, useState } from 'react';
import { Camera as CamIcon, ImageUp, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { usePrefs } from '../context/PrefsContext';
import { biometricsApi } from '../api/biometricsApi';
import { Camera, CameraHandle } from '../components/Camera';
import { StatusPanel, Tone } from '../components/StatusPanel';
import { MascotOrb, MascotState } from '../components/MascotOrb';
import { Tilt } from '../components/Tilt';
import { Toggle } from '../components/Toggle';
import { useScanFlow } from '../lib/useScanFlow';
import { errorKey } from '../lib/messages';
import type { Key } from '../lib/i18n';
import type { Tab } from '../components/Nav';

type View = { mascot: MascotState; tone: Tone; title: Key; message?: Key; name?: string; done?: boolean };

const STAGE: Partial<Record<MascotState, Key>> = {
  scanning: 'st_scanning',
  target_acquired: 'st_target',
  analyzing: 'st_saving',
};

export const EnrollmentPage: React.FC<{ go: (t: Tab) => void }> = ({ go }) => {
  const { isAuthenticated, currentUser, refreshUser } = useAuth();
  const { playSuccess, playAlert } = useSound();
  const { t } = usePrefs();
  const cam = useRef<CameraHandle>(null);
  const flow = useScanFlow();
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<View | null>(null);
  const [face, setFace] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto glass rounded-4xl p-8 text-center flex flex-col items-center">
        <Tilt max={12} global>
          <MascotOrb state="idle" size="md" />
        </Tilt>
        <h1 className="mt-8 text-2xl font-semibold">{t('e_login_t')}</h1>
        <p className="mt-2 text-ink-3">{t('e_login_m')}</p>
        <button onClick={() => go('login')} className="btn-primary mt-6 w-full">
          <LogIn className="w-4 h-4" aria-hidden /> {t('e_login_btn')}
        </button>
      </div>
    );
  }

  const enroll = async (image: string | null) => {
    if (!consent) {
      setResult({ mascot: 'idle', tone: 'warn', title: 'e_consent_t', message: 'e_consent_m' });
      return;
    }
    if (!image) {
      cam.current?.pickFile();
      return;
    }
    setResult(null);
    try {
      const res = await flow.start(() => biometricsApi.enroll({ image_base64: image, consent: true }));
      setResult({ mascot: 'verified', tone: 'ok', title: 'e_ok_t', message: 'e_ok_m', name: res.username, done: true });
      flow.setStage('verified');
      playSuccess();
      refreshUser();
    } catch (err) {
      const k = errorKey(err);
      const spoof = k === 'err_spoof';
      setResult({ mascot: spoof ? 'spoof_detected' : 'idle', tone: spoof ? 'bad' : 'warn', title: 'e_fail_t', message: k });
      flow.setStage(spoof ? 'spoof_detected' : 'idle');
      playAlert();
    }
  };

  const already = currentUser?.has_biometric_template;
  const view: View = flow.busy
    ? { mascot: flow.stage, tone: 'neutral', title: STAGE[flow.stage] ?? 'st_wait' }
    : result ?? {
        mascot: face ? 'target_acquired' : 'idle',
        tone: 'neutral',
        title: already ? 'e_already_t' : 'e_idle_t',
        message: already ? 'e_already_m' : 'e_idle_m',
      };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 lg:gap-8 items-start">
      <div className="order-2 lg:order-1 space-y-4">
        <Camera
          ref={cam}
          busy={flow.busy}
          tone={result?.tone === 'ok' ? 'ok' : result?.tone === 'bad' ? 'bad' : 'neutral'}
          onFile={enroll}
          onFace={setFace}
        />

        <div className="glass rounded-3xl px-5 py-2">
          <Toggle id="consent" checked={consent} onChange={setConsent} label={t('e_consent_label')} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => enroll(cam.current?.capture() ?? null)} disabled={flow.busy} className="btn-primary flex-1">
            <CamIcon className="w-5 h-5" aria-hidden /> {t('e_btn')}
          </button>
          <button onClick={() => (consent ? cam.current?.pickFile() : enroll(null))} disabled={flow.busy} className="btn-glass">
            <ImageUp className="w-5 h-5" aria-hidden /> {t('from_photo')}
          </button>
        </div>
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24">
        <StatusPanel
          mascot={view.mascot}
          tone={view.tone}
          title={t(view.title)}
          message={view.message ? t(view.message, { name: view.name ?? '' }) : undefined}
        >
          {view.done && (
            <button onClick={() => go('verify')} className="btn-primary">
              {t('e_try_verify')} <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          )}
        </StatusPanel>
      </div>
    </div>
  );
};
