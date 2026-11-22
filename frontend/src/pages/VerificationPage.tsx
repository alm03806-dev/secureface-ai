import React, { useRef, useState, useEffect } from 'react';
import { ScanFace, ImageUp, UserPlus, RotateCw } from 'lucide-react';
import { useSound } from '../context/SoundContext';
import { usePrefs } from '../context/PrefsContext';
import { useAuth } from '../context/AuthContext';
import { biometricsApi, VerifyResponse } from '../api/biometricsApi';
import { Camera, CameraHandle } from '../components/Camera';
import { StatusPanel, Tone } from '../components/StatusPanel';
import { MascotState } from '../components/MascotOrb';
import { useScanFlow } from '../lib/useScanFlow';
import { errorKey } from '../lib/messages';
import type { Key } from '../lib/i18n';
import type { Tab } from '../components/Nav';

// A result is stored as keys, so switching language re-renders it correctly.
type View = { mascot: MascotState; tone: Tone; title: Key; message?: Key; name?: string; raw?: string; enroll?: boolean };

function viewFor(res: VerifyResponse): View {
  const name = res.matched_user?.full_name || res.matched_user?.username || '';
  switch (res.status) {
    case 'VERIFIED':
      return { mascot: 'verified', tone: 'ok', title: 'v_ok_t', message: 'v_ok_m', name };
    case 'SPOOF_REJECTED':
      return { mascot: 'spoof_detected', tone: 'bad', title: 'v_spoof_t', message: 'v_spoof_m' };
    case 'IDENTITY_MISMATCH':
      return { mascot: 'idle', tone: 'warn', title: 'v_mismatch_t', message: 'v_mismatch_m' };
    case 'NO_TEMPLATES_ENROLLED':
    case 'USER_NOT_ENROLLED':
      return { mascot: 'idle', tone: 'warn', title: 'v_noenroll_t', message: 'v_noenroll_m', enroll: true };
    case 'NO_FACE':
      return { mascot: 'idle', tone: 'warn', title: 'v_noface_t', message: 'v_noface_m' };
    case 'MULTI_FACE':
      return { mascot: 'idle', tone: 'warn', title: 'v_multi_t', message: 'v_multi_m' };
    default:
      return { mascot: 'idle', tone: 'warn', title: 'v_retry_t', raw: res.message };
  }
}

const STAGE: Partial<Record<MascotState, Key>> = {
  scanning: 'st_scanning',
  target_acquired: 'st_target',
  analyzing: 'st_analyzing',
};

export const VerificationPage: React.FC<{ go: (t: Tab) => void }> = ({ go }) => {
  const { playSuccess, playAlert } = useSound();
  const { t } = usePrefs();
  const { currentUser } = useAuth();
  const cam = useRef<CameraHandle>(null);
  const flow = useScanFlow();
  const [name, setName] = useState(currentUser?.username ?? '');
  const [result, setResult] = useState<View | null>(null);
  const [face, setFace] = useState(false);

  useEffect(() => {
    if (currentUser?.username && !name) {
      setName(currentUser.username);
    }
  }, [currentUser]);

  const verify = async (image: string | null) => {
    if (!image) {
      cam.current?.pickFile();
      return;
    }
    setResult(null);
    try {
      const res = await flow.start(() => biometricsApi.verify({ image_base64: image, claimed_username: name.trim() || undefined }));
      const v = viewFor(res);
      setResult(v);
      flow.setStage(v.mascot);
      v.tone === 'ok' ? playSuccess() : v.tone === 'bad' && playAlert();
    } catch (err) {
      const k = errorKey(err);
      const spoof = k === 'err_spoof';
      setResult({ mascot: spoof ? 'spoof_detected' : 'idle', tone: spoof ? 'bad' : 'warn', title: 'v_fail_t', message: k });
      flow.setStage(spoof ? 'spoof_detected' : 'idle');
      playAlert();
    }
  };

  const view: View = flow.busy
    ? { mascot: flow.stage, tone: 'neutral', title: STAGE[flow.stage] ?? 'st_wait' }
    : result ??
      (face
        ? { mascot: 'target_acquired', tone: 'neutral', title: 'v_face_t', message: 'v_face_m' }
        : { mascot: 'idle', tone: 'neutral', title: 'v_idle_t', message: 'v_idle_m' });

  const title = t(view.title, { name: view.name ? `, ${view.name}` : '' });
  const message = view.message ? t(view.message) : view.raw;
  const camTone = result?.tone === 'ok' ? 'ok' : result?.tone === 'bad' ? 'bad' : 'neutral';
  const again = !!result && !flow.busy;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 lg:gap-8 items-start">
      <div className="order-2 lg:order-1 space-y-4">
        <Camera ref={cam} busy={flow.busy} tone={camTone} onFile={verify} onFace={setFace} />

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => verify(cam.current?.capture() ?? null)} disabled={flow.busy} className="btn-primary flex-1">
            {again ? <RotateCw className="w-5 h-5" aria-hidden /> : <ScanFace className="w-5 h-5" aria-hidden />}
            {again ? t('v_btn_again') : t('v_btn')}
          </button>
          <button onClick={() => cam.current?.pickFile()} disabled={flow.busy} className="btn-glass">
            <ImageUp className="w-5 h-5" aria-hidden /> {t('from_photo')}
          </button>
        </div>

        <div>
          <label htmlFor="claim" className="label">
            {t('v_claim_label')}
          </label>
          <input id="claim" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('v_claim_ph')} autoComplete="off" />
        </div>
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24">
        <StatusPanel mascot={view.mascot} tone={view.tone} title={title} message={message}>
          {view.enroll && !flow.busy && (
            <button onClick={() => go('enroll')} className="btn-primary">
              <UserPlus className="w-4 h-4" aria-hidden /> {t('home_cta_enroll')}
            </button>
          )}
        </StatusPanel>
      </div>
    </div>
  );
};
