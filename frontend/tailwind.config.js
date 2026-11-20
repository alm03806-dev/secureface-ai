/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Hind Siliguri"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        // iOS-like semantic palette
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
          3: 'rgb(var(--ink-3) / <alpha-value>)',
          4: 'rgb(var(--ink-4) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        pill: 'rgb(var(--pill) / <alpha-value>)',
        fill: 'var(--fill)',
        line: 'var(--line)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 var(--glass-hi), 0 1px 2px rgba(0,0,0,0.04), 0 12px 40px -12px var(--glass-shadow)',
        lift: '0 8px 24px -8px rgba(15,23,42,0.35)',
      },
    },
  },
  plugins: [],
};
