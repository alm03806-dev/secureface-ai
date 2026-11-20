import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MascotOrb, MascotState } from './MascotOrb';
import { Tilt } from './Tilt';

export type Tone = 'neutral' | 'ok' | 'bad' | 'warn';

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink',
  ok: 'text-ok',
  bad: 'text-bad',
  warn: 'text-warn',
};

interface StatusPanelProps {
  mascot: MascotState;
  title: string;
  message?: string;
  tone?: Tone;
  children?: React.ReactNode;
}

/** Mascot + one title + one sentence. Horizontal on phones, vertical on desktop. */
export const StatusPanel: React.FC<StatusPanelProps> = ({ mascot, title, message, tone = 'neutral', children }) => (
  <div className="glass rounded-4xl p-5 lg:p-8 flex lg:flex-col items-center gap-5 lg:gap-6 lg:text-center">
    <Tilt max={12} global>
      <MascotOrb state={mascot} size="md" className="max-lg:!w-20 max-lg:!h-20" />
    </Tilt>
    <div className="flex-1 min-w-0 w-full" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={title + (message ?? '')}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className={`text-lg lg:text-xl font-semibold leading-snug ${TONE_TEXT[tone]}`}>{title}</h2>
          {message && <p className="mt-1 text-sm lg:text-[15px] text-ink-3 leading-relaxed">{message}</p>}
        </motion.div>
      </AnimatePresence>
      {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
    </div>
  </div>
);
