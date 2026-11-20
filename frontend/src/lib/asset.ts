/** Path to a file in public/, correct under any deploy base (e.g. ./ for static hosting). */
export const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`;

/** Demo build: fake API, no backend needed (VITE_DEMO=1). */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1';
