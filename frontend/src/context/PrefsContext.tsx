import React, { createContext, useContext, useEffect, useState } from 'react';
import { Key, Lang, translate } from '../lib/i18n';
import { store } from '../lib/storage';

type Theme = 'light' | 'dark';

interface Prefs {
  lang: Lang;
  theme: Theme;
  toggleLang: () => void;
  toggleTheme: () => void;
  t: (key: Key, vars?: Record<string, string>) => string;
}

const Ctx = createContext<Prefs>(null as any);

const initialTheme = (): Theme => {
  const saved = store.get('secureface_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const PrefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (store.get('secureface_lang') === 'en' ? 'en' : 'bn'));
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.lang = lang;
    store.set('secureface_lang', lang);
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#F2F2F7');
    store.set('secureface_theme', theme);
  }, [theme]);

  const value: Prefs = {
    lang,
    theme,
    toggleLang: () => setLang((l) => (l === 'bn' ? 'en' : 'bn')),
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    t: (key, vars) => translate(lang, key, vars),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePrefs = () => useContext(Ctx);
