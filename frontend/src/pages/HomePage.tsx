import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GlowEyes } from '../components/GlowEyes';
import { Tilt } from '../components/Tilt';
import { usePrefs } from '../context/PrefsContext';
import type { Tab } from '../components/Nav';
import type { Key } from '../lib/i18n';

const steps: { n: string; t: Key; d: Key }[] = [
  { n: '1', t: 'step1_t', d: 'step1_d' },
  { n: '2', t: 'step2_t', d: 'step2_d' },
  { n: '3', t: 'step3_t', d: 'step3_d' },
];
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

export const HomePage: React.FC<{ go: (t: Tab) => void }> = ({ go }) => {
  const { t, lang, theme } = usePrefs();
  return (
    <section className="flex flex-col items-center text-center">
      <motion.div
        className="w-full max-w-4xl -mt-2 sm:-mt-6"
        initial={{ scale: 0.9, opacity: 0, filter: 'blur(12px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1] }}
      >
        <Tilt max={10} global>
          <GlowEyes className="w-full aspect-[2/1]" day={theme === 'light'} />
        </Tilt>
      </motion.div>

      <h1 className="-mt-4 sm:-mt-8 text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-xl [text-wrap:balance]">{t('home_title')}</h1>
      <p className="mt-3 text-[15px] sm:text-lg text-ink-3 max-w-md leading-relaxed">{t('home_sub')}</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button onClick={() => go('verify')} className="btn-primary sm:min-w-[200px]">
          {t('home_cta_verify')} <ArrowRight className="w-4 h-4" aria-hidden />
        </button>
        <button onClick={() => go('enroll')} className="btn-glass sm:min-w-[200px]">
          {t('home_cta_enroll')}
        </button>
      </div>

      <ol className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
        {steps.map((s, i) => (
          <motion.li
            key={s.n}
            initial={{ opacity: 0, y: 16, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <Tilt max={10} glare innerClassName="rounded-3xl">
              <div className="glass rounded-3xl p-5 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3 text-left">
                <span className="w-9 h-9 shrink-0 rounded-full bg-ink text-surface text-sm font-semibold flex items-center justify-center">
                  {lang === 'bn' ? BN_DIGITS[+s.n] : s.n}
                </span>
                <div>
                  <div className="font-semibold">{t(s.t)}</div>
                  <div className="text-sm text-ink-3">{t(s.d)}</div>
                </div>
              </div>
            </Tilt>
          </motion.li>
        ))}
      </ol>
    </section>
  );
};
