import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import { PrefsProvider, usePrefs } from './context/PrefsContext';
import { Nav, Tab } from './components/Nav';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { VerificationPage } from './pages/VerificationPage';
import { EnrollmentPage } from './pages/EnrollmentPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminPage } from './pages/AdminPage';
import { IS_DEMO } from './lib/asset';
import { StormBackground } from './components/StormBackground';

// iOS-like page transition: content comes forward in depth with a light blur
const page = {
  initial: { opacity: 0, scale: 0.96, rotateX: 6, y: 16, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, rotateX: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
  exit: { opacity: 0, scale: 1.02, rotateX: -4, filter: 'blur(10px)', transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Colour fields behind the glass; they drift with the pointer at different depths. */
const Background: React.FC = () => {
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const depth = [40, -60, 30];
    let raf = 0;
    const move = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      cur.x += (target.x - cur.x) * 0.04;
      cur.y += (target.y - cur.y) * 0.04;
      refs.forEach((r, i) => {
        if (r.current) r.current.style.transform = `translate3d(${cur.x * depth[i]}px, ${cur.y * depth[i]}px, 0)`;
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  const blob = 'absolute rounded-full blur-[120px] transition-[background] duration-700';
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div ref={refs[0]} className={`${blob} -top-40 -left-32 w-[560px] h-[560px] opacity-70`} style={{ background: 'var(--blob-1)' }} />
      <div ref={refs[1]} className={`${blob} top-1/3 -right-40 w-[520px] h-[520px] opacity-80`} style={{ background: 'var(--blob-2)' }} />
      <div ref={refs[2]} className={`${blob} -bottom-40 left-1/4 w-[520px] h-[520px] opacity-70`} style={{ background: 'var(--blob-3)' }} />
    </div>
  );
};

const Shell: React.FC = () => {
  const { t, theme } = usePrefs();
  const [tab, setTab] = useState<Tab>('home');
  const go = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Background />
      {/* home backdrop follows the theme; fixed backdrops must live outside the transformed page */}
      <AnimatePresence>
        {tab === 'home' && (
          <motion.div key="storm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <StormBackground day={theme === 'light'} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen flex flex-col">
        <Nav tab={tab} go={go} />
        {IS_DEMO && <p className="mx-auto mt-3 px-3 py-1 rounded-full text-xs text-ink-3 glass text-center">{t('demo_banner')}</p>}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-32 md:pb-16" style={{ perspective: 1200 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} variants={page} initial="initial" animate="animate" exit="exit" style={{ transformOrigin: '50% 0%' }}>
              {tab === 'home' && <HomePage go={go} />}
              {tab === 'login' && <LoginPage onSuccess={() => go('verify')} />}
              {tab === 'verify' && <VerificationPage go={go} />}
              {tab === 'enroll' && <EnrollmentPage go={go} />}
              {tab === 'history' && <HistoryPage />}
              {tab === 'admin' && <AdminPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export const App: React.FC = () => (
  <MotionConfig reducedMotion="user">
    <PrefsProvider>
      <AuthProvider>
        <SoundProvider>
          <Shell />
        </SoundProvider>
      </AuthProvider>
    </PrefsProvider>
  </MotionConfig>
);

export default App;
