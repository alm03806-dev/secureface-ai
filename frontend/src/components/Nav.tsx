import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, ScanFace, UserPlus, Clock, Settings, LogOut, LogIn, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePrefs } from '../context/PrefsContext';
import { asset } from '../lib/asset';

export type Tab = 'home' | 'verify' | 'enroll' | 'history' | 'admin' | 'login';

interface NavProps {
  tab: Tab;
  go: (t: Tab) => void;
}

const spring = { type: 'spring', stiffness: 500, damping: 38 } as const;

export const Nav: React.FC<NavProps> = ({ tab, go }) => {
  const { isAuthenticated, isAdmin, currentUser, logout } = useAuth();
  const { t, lang, theme, toggleLang, toggleTheme } = usePrefs();

  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t('nav_home'), icon: <Home className="w-5 h-5" /> },
    { id: 'verify', label: t('nav_verify'), icon: <ScanFace className="w-5 h-5" /> },
    { id: 'enroll', label: t('nav_enroll'), icon: <UserPlus className="w-5 h-5" /> },
    ...(isAuthenticated ? [{ id: 'history' as Tab, label: t('nav_history'), icon: <Clock className="w-5 h-5" /> }] : []),
    ...(isAdmin ? [{ id: 'admin' as Tab, label: t('nav_admin'), icon: <Settings className="w-5 h-5" /> }] : []),
  ];

  const iconBtn = 'w-11 h-11 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill transition-colors';

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:pt-4">
        <nav className="glass-strong mx-auto max-w-5xl rounded-full h-14 pl-4 sm:pl-5 pr-1.5 flex items-center justify-between gap-2">
          <button onClick={() => go('home')} className="flex items-center gap-2 font-semibold tracking-tight text-[17px] shrink-0">
            <img src={asset('mascot/states/idle.jpg')} alt="" className="w-7 h-7 rounded-full object-cover" />
            <span className="hidden min-[380px]:inline">SecureFace</span>
          </button>

          {/* Desktop segmented tabs */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-fill">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                className={`relative h-10 px-4 rounded-full text-sm font-medium transition-colors ${tab === it.id ? 'text-ink' : 'text-ink-3 hover:text-ink'}`}
                aria-current={tab === it.id ? 'page' : undefined}
              >
                {tab === it.id && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-full bg-pill shadow-sm" />}
                <span className="relative">{it.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center">
            {/* language */}
            <button onClick={toggleLang} className={`${iconBtn} text-[13px] font-semibold`} title={t('lang_switch')} aria-label={t('lang_switch')}>
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* day / night */}
            <button
              onClick={toggleTheme}
              className={iconBtn}
              title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
              aria-label={theme === 'dark' ? t('theme_light') : t('theme_dark')}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  go('home');
                }}
                className="btn-plain !px-2"
                title={t('nav_logout')}
                aria-label={t('nav_logout')}
              >
                <span className="w-7 h-7 rounded-full bg-ink text-surface text-xs font-semibold flex items-center justify-center uppercase">
                  {currentUser?.username?.[0] ?? '?'}
                </span>
                <span className="hidden lg:inline">{t('nav_logout')}</span>
                <LogOut className="w-4 h-4 lg:hidden" aria-hidden />
              </button>
            ) : (
              <button onClick={() => go('login')} className="btn-plain text-ink">
                <LogIn className="w-4 h-4" aria-hidden /> {t('nav_login')}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="glass-strong rounded-[28px] h-16 flex items-stretch justify-around px-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => go(it.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${tab === it.id ? 'text-ink' : 'text-ink-4'}`}
              aria-current={tab === it.id ? 'page' : undefined}
            >
              {tab === it.id && <motion.span layoutId="tab-pill" transition={spring} className="absolute inset-1.5 rounded-[22px] bg-pill shadow-sm" />}
              <span className="relative">{it.icon}</span>
              <span className="relative">{it.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};
