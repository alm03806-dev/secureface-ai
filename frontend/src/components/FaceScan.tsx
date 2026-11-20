import { asset, IS_DEMO } from '../lib/asset';
import React, { useEffect, useRef } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';

export type ScanTone = 'neutral' | 'scan' | 'ok' | 'bad';

const COLOR: Record<ScanTone, [number, number, number]> = {
  neutral: [255, 255, 255],
  scan: [255, 138, 61], // matches the mascot's orange eyes
  ok: [52, 199, 89],
  bad: [255, 59, 48],
};

const LOCAL_MODEL = asset('mediapipe/face_landmarker.task');
const REMOTE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// One shared detector for the whole app (loaded lazily, ~4 MB model).
let detectorPromise: Promise<{ lm: FaceLandmarker; mesh: number[][]; oval: number[][] } | null> | null = null;

function loadDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      if (IS_DEMO) return null; // static demo cannot fetch the model
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const files = await vision.FilesetResolver.forVisionTasks(asset('mediapipe/wasm'));
        // Prefer the local copy (from `npm install`); fall back to Google's CDN.
        let model: Uint8Array | null = null;
        for (const url of [LOCAL_MODEL, REMOTE_MODEL]) {
          try {
            const res = await fetch(url);
            const type = res.headers.get('content-type') ?? '';
            if (res.ok && !type.includes('text/html')) {
              model = new Uint8Array(await res.arrayBuffer());
              break;
            }
          } catch {
            /* try next source */
          }
        }
        if (!model) return null;
        let lm: FaceLandmarker | null = null;
        for (const delegate of ['GPU', 'CPU'] as const) {
          try {
            lm = await vision.FaceLandmarker.createFromOptions(files, {
              baseOptions: { modelAssetBuffer: model, delegate },
              runningMode: 'VIDEO',
              numFaces: 1,
            });
            break;
          } catch {
            /* try next delegate */
          }
        }
        if (!lm) return null;
        const pairs = (c: { start: number; end: number }[]) => c.map((e) => [e.start, e.end]);
        return {
          lm,
          mesh: pairs(vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION),
          oval: pairs(vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL),
        };
      } catch {
        return null;
      }
    })();
  }
  return detectorPromise;
}

interface FaceScanProps {
  video: React.RefObject<HTMLVideoElement>;
  active: boolean;
  tone: ScanTone;
  /** Called when a face appears or disappears. */
  onFace?: (found: boolean) => void;
  /** Every frame: face centre in the displayed box (0..1, already mirrored), or null. */
  onPose?: (p: { fx: number; fy: number } | null) => void;
}

/**
 * Live 3D face mesh over the camera: 478 landmarks with depth shading,
 * a scan band sweeping down the face, colour driven by state.
 */
export const FaceScan: React.FC<FaceScanProps> = ({ video, active, tone, onFace, onPose }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const toneRef = useRef(tone);
  const faceRef = useRef(false);
  const onFaceRef = useRef(onFace);
  toneRef.current = tone;
  onFaceRef.current = onFace;
  const onPoseRef = useRef(onPose);
  onPoseRef.current = onPose;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let stopped = false;
    let lastDetect = 0;
    let points: { x: number; y: number; z: number }[] | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    loadDetector().then((det) => {
      if (stopped || !det) return;

      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        const v = video.current;
        const c = canvas.current;
        if (!v || !c || v.readyState < 2) return;

        // detect at ~20 fps, draw at display rate
        if (t - lastDetect > 50) {
          lastDetect = t;
          try {
            const r = det.lm.detectForVideo(v, t);
            points = r.faceLandmarks?.[0] ?? null;
          } catch {
            points = null;
          }
          const found = !!points;
          if (found !== faceRef.current) {
            faceRef.current = found;
            onFaceRef.current?.(found);
          }
        }

        // match canvas to displayed size (object-cover crop)
        const w = c.clientWidth;
        const h = c.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (c.width !== w * dpr || c.height !== h * dpr) {
          c.width = w * dpr;
          c.height = h * dpr;
        }
        const ctx = c.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!points) {
          onPoseRef.current?.(null);
          return;
        }

        const vw = v.videoWidth;
        const vh = v.videoHeight;
        const s = Math.max(w / vw, h / vh);
        const ox = (w - vw * s) / 2;
        const oy = (h - vh * s) / 2;
        const P = points.map((p) => ({ x: ox + p.x * vw * s, y: oy + p.y * vh * s, z: p.z }));

        let top = Infinity;
        let bottom = -Infinity;
        for (const p of P) {
          if (p.y < top) top = p.y;
          if (p.y > bottom) bottom = p.y;
        }
        const span = bottom - top;
        {
          let sx = 0;
          for (const p of P) sx += p.x;
          // canvas is mirrored on screen, so flip x
          onPoseRef.current?.({ fx: 1 - sx / P.length / w, fy: (top + bottom) / 2 / h });
        }
        const [r, g, b] = COLOR[toneRef.current];
        const busy = toneRef.current === 'scan';

        // scan band position (0..1), ping-pong; faster while busy
        const period = busy ? 1400 : 2600;
        const phase = reduced ? 0.5 : Math.abs(((t / period) % 2) - 1);
        const bandY = top + phase * span;
        const bandW = span * 0.12;

        // mesh lines
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = `rgba(${r},${g},${b},${busy ? 0.22 : 0.12})`;
        ctx.beginPath();
        for (const [a, e] of det.mesh) {
          ctx.moveTo(P[a].x, P[a].y);
          ctx.lineTo(P[e].x, P[e].y);
        }
        ctx.stroke();

        // points: closer (more negative z) = bigger and brighter; glow near the band
        for (const p of P) {
          const depth = Math.min(1, Math.max(0, 0.5 - p.z * 6));
          const near = Math.max(0, 1 - Math.abs(p.y - bandY) / bandW);
          const a = 0.25 + depth * 0.35 + near * 0.6;
          const rad = 0.8 + depth * 0.9 + near * 1.2;
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a)})`;
          ctx.fillRect(p.x - rad / 2, p.y - rad / 2, rad, rad);
        }

        // face outline
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (const [a, e] of det.oval) {
          ctx.moveTo(P[a].x, P[a].y);
          ctx.lineTo(P[e].x, P[e].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // scan band glow, clipped to the face width
        if (!reduced) {
          let minX = Infinity;
          let maxX = -Infinity;
          for (const p of P) {
            if (Math.abs(p.y - bandY) < bandW) {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
            }
          }
          if (maxX > minX) {
            const grad = ctx.createLinearGradient(0, bandY - bandW, 0, bandY + bandW);
            grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${busy ? 0.35 : 0.18})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(minX - 12, bandY - bandW, maxX - minX + 24, bandW * 2);
          }
        }
      };
      raf = requestAnimationFrame(frame);
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      if (faceRef.current) {
        faceRef.current = false;
        onFaceRef.current?.(false);
      }
    };
  }, [active, video]);

  // mirrored like the video
  return <canvas ref={canvas} className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none" aria-hidden />;
};
