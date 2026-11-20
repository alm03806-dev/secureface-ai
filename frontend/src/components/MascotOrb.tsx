import { asset } from '../lib/asset';
import React, { useEffect, useRef } from 'react';

export type MascotState =
  | 'idle'
  | 'scanning'
  | 'target_acquired'
  | 'analyzing'
  | 'verified'
  | 'spoof_detected';

const STATES: MascotState[] = ['idle', 'scanning', 'target_acquired', 'analyzing', 'verified', 'spoof_detected'];

// Soft halo colour behind the orb, one per state
const HALO: Record<MascotState, string> = {
  idle: 'rgba(148,163,184,0.35)',
  scanning: 'rgba(255,99,71,0.35)',
  target_acquired: 'rgba(255,140,60,0.38)',
  analyzing: 'rgba(255,160,40,0.40)',
  verified: 'rgba(52,199,89,0.45)',
  spoof_detected: 'rgba(255,59,48,0.45)',
};

const SIZE = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48 sm:w-56 sm:h-56',
  xl: 'w-56 h-56 sm:w-72 sm:h-72',
};

interface MascotOrbProps {
  state: MascotState;
  size?: keyof typeof SIZE;
  className?: string;
}

/**
 * Mascot rendered from the AI video. Every state clip is a short seamless loop.
 * All clips stay mounted (preloaded), so a state change is an instant cross-fade.
 */
export const MascotOrb: React.FC<MascotOrbProps> = ({ state, size = 'md', className = '' }) => {
  const refs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    STATES.forEach((s) => {
      const v = refs.current[s];
      if (!v) return;
      if (s === state) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        // pause after the fade-out finishes
        window.setTimeout(() => v.pause(), 450);
      }
    });
  }, [state]);

  return (
    <div className={`relative shrink-0 ${SIZE[size]} ${className}`} role="img" aria-label={`Mascot: ${state}`}>
      {/* coloured halo */}
      <div
        className="absolute -inset-[18%] rounded-full blur-2xl transition-[background] duration-700"
        style={{ background: `radial-gradient(closest-side, ${HALO[state]}, transparent)` }}
        aria-hidden
      />
      {/* glass ring */}
      <div className="absolute -inset-[5%] rounded-full glass" aria-hidden />
      <div className="absolute inset-0 rounded-full overflow-hidden bg-[#2a2622] ring-1 ring-black/5">
        {STATES.map((s) => (
            <video
              key={s}
              ref={(el) => (refs.current[s] = el)}
              src={asset(`mascot/states/${s}.mp4`)}
              poster={asset(`mascot/states/${s}.jpg`)}
              className="absolute inset-0 w-full h-full object-cover transition-[opacity,filter,transform] duration-[450ms] ease-out"
              style={{
                opacity: s === state ? 1 : 0,
                filter: s === state ? 'blur(0px)' : 'blur(8px)',
                transform: s === state ? 'scale(1)' : 'scale(1.06)',
              }}
              autoPlay={s === state}
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden
            />
          ))}
        {/* specular highlight */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 38%)' }}
          aria-hidden
        />
      </div>
    </div>
  );
};
