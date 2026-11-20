/** localStorage that never throws (private mode, sandboxed frames). */
export const store = {
  get(k: string): string | null {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  remove(k: string) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};
