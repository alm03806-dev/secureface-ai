import React, { useEffect, useRef } from 'react';

export type Pose = { x: number; y: number } | null; // -1..1, from face tracking

interface TiltProps {
  children: React.ReactNode;
  /** Max rotation in degrees. */
  max?: number;
  /** When set and non-null, the tilt follows this (e.g. the user's head) instead of the pointer. */
  poseRef?: React.MutableRefObject<Pose>;
  /** Follow the pointer anywhere on the page, not only over the element. */
  global?: boolean;
  /** Show a moving light reflection. */
  glare?: boolean;
  className?: string;
  innerClassName?: string;
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = () => window.matchMedia('(pointer: coarse)').matches;

/**
 * 3D tilt with spring-like easing. Pointer on desktop, device tilt on phones
 * (where the browser allows it), or a face pose when one is given.
 */
export const Tilt: React.FC<TiltProps> = ({ children, max = 8, poseRef, global = false, glare = false, className = '', innerClassName = '' }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const shine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced()) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = outer.current;
      if (!el) return;
      if (global) {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
      } else {
        const r = el.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        target.x = inside ? ((e.clientX - r.left) / r.width) * 2 - 1 : 0;
        target.y = inside ? ((e.clientY - r.top) / r.height) * 2 - 1 : 0;
      }
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 25));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    if (coarse()) window.addEventListener('deviceorientation', onOrient);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const pose = poseRef?.current;
      const tx = pose ? pose.x : target.x;
      const ty = pose ? pose.y : target.y;
      cur.x += (tx - cur.x) * 0.08;
      cur.y += (ty - cur.y) * 0.08;
      if (inner.current) {
        inner.current.style.transform = `rotateY(${cur.x * max}deg) rotateX(${-cur.y * max}deg)`;
      }
      if (shine.current) {
        shine.current.style.background = `radial-gradient(circle at ${50 + cur.x * 40}% ${50 + cur.y * 40}%, rgba(255,255,255,0.22), transparent 55%)`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, [max, global, poseRef]);

  return (
    <div ref={outer} className={className} style={{ perspective: 1000 }}>
      <div ref={inner} className={`relative will-change-transform ${innerClassName}`} style={{ transformStyle: 'preserve-3d' }}>
        {children}
        {glare && <div ref={shine} className="absolute inset-0 rounded-[inherit] pointer-events-none mix-blend-soft-light" aria-hidden />}
      </div>
    </div>
  );
};
