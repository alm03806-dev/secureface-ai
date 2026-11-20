import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CameraOff, ImageUp, RotateCw } from 'lucide-react';
import { FaceScan } from './FaceScan';
import { Tilt, Pose } from './Tilt';
import { usePrefs } from '../context/PrefsContext';

export interface CameraHandle {
  /** Returns a JPEG data URL of the current frame, or null if the camera is off. */
  capture: () => string | null;
  /** Opens the file picker (fallback when there is no camera). */
  pickFile: () => void;
}

interface CameraProps {
  /** Scan in progress: orange mesh and zoom towards the face. */
  busy?: boolean;
  /** Mesh colour after a result. */
  tone?: 'neutral' | 'ok' | 'bad';
  /** Called with a data URL when the user picks an image file. */
  onFile: (dataUrl: string) => void;
  /** Called when the live face mesh finds or loses a face. */
  onFace?: (found: boolean) => void;
}

export const Camera = forwardRef<CameraHandle, CameraProps>(({ busy = false, tone = 'neutral', onFile, onFace }, ref) => {
  const { t } = usePrefs();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const [face, setFace] = useState(false);

  // head tracking: the frame tilts against your head, like looking through a window
  const poseRef = useRef<Pose>(null);
  const centre = useRef({ fx: 0.5, fy: 0.5 });
  const handlePose = useCallback((p: { fx: number; fy: number } | null) => {
    if (!p) {
      poseRef.current = null;
      return;
    }
    centre.current = p;
    poseRef.current = { x: -(p.fx - 0.5) * 2, y: -(p.fy - 0.5) * 2 };
  }, []);

  const handleFace = useCallback(
    (f: boolean) => {
      setFace(f);
      onFace?.(f);
    },
    [onFace],
  );

  const start = useCallback(async () => {
    setError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      v.onloadedmetadata = () => {
        v.play();
        setActive(true);
      };
    } catch {
      setActive(false);
      setError(true);
    }
  }, []);

  const stop = useCallback(() => {
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((tr) => tr.stop());
      v.srcObject = null;
    }
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  useImperativeHandle(ref, () => ({
    capture: () => {
      const v = videoRef.current;
      if (!v || !active) return null;
      const c = document.createElement('canvas');
      c.width = v.videoWidth || 640;
      c.height = v.videoHeight || 480;
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.92);
    },
    pickFile: () => fileRef.current?.click(),
  }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && onFile(reader.result);
    reader.readAsDataURL(file);
  };

  // Face ID style push-in towards the face while scanning
  const zoom = busy && face;
  const origin = `${(centre.current.fx * 100).toFixed(1)}% ${(centre.current.fy * 100).toFixed(1)}%`;

  return (
    <Tilt max={6} poseRef={poseRef} glare innerClassName="rounded-4xl">
      <div className="relative w-full aspect-[4/3] rounded-4xl overflow-hidden bg-[#1c1c1e] shadow-glass">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

        {/* video + mesh move together */}
        <div
          className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: zoom ? 'scale(1.18)' : 'scale(1)', transformOrigin: origin }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
          />
          <FaceScan video={videoRef} active={active} tone={busy ? 'scan' : tone} onFace={handleFace} onPose={handlePose} />
        </div>

        {/* soft vignette */}
        {active && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 45% 55% at 50% 50%, transparent 60%, rgba(0,0,0,0.35) 100%)' }}
            aria-hidden
          />
        )}

        {/* guide oval until a face is found */}
        {active && (
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${face ? 'opacity-0' : 'opacity-100'}`}
            aria-hidden
          >
            <div className="w-[40%] aspect-[3/4] rounded-[50%] border-2 border-dashed border-white/70" />
          </div>
        )}

        {/* status chip */}
        {active && (
          <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none" aria-live="polite">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white bg-black/35 backdrop-blur-md border border-white/15">
              {busy ? t('chip_scanning') : face ? t('chip_found') : t('chip_none')}
            </span>
          </div>
        )}

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <CameraOff className="w-10 h-10 text-white/50" aria-hidden />
            <p className="text-sm text-white/80 max-w-xs leading-relaxed">{error ? t('cam_error') : t('cam_starting')}</p>
            {error && (
              <div className="flex gap-2">
                <button onClick={start} className="btn bg-white/15 text-white hover:bg-white/25 min-h-[44px] px-4 text-sm">
                  <RotateCw className="w-4 h-4" aria-hidden /> {t('cam_retry')}
                </button>
                <button onClick={() => fileRef.current?.click()} className="btn bg-white text-[#1c1c1e] min-h-[44px] px-4 text-sm">
                  <ImageUp className="w-4 h-4" aria-hidden /> {t('cam_upload')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Tilt>
  );
});
Camera.displayName = 'Camera';
