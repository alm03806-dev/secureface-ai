import { useCallback, useRef, useState } from 'react';
import type { MascotState } from '../components/MascotOrb';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Drives the mascot through scanning → target → analyzing while a request runs,
 * so the user sees the same story as the video, then hands back the result.
 */
export function useScanFlow() {
  const [stage, setStage] = useState<MascotState>('idle');
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  const start = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    const id = ++run.current;
    setBusy(true);
    setStage('scanning');
    const result = task(); // request starts immediately
    result.catch(() => {}); // avoid unhandled-rejection noise; awaited below
    await wait(900);
    if (run.current === id) setStage('target_acquired');
    await wait(700);
    if (run.current === id) setStage('analyzing');
    try {
      const [value] = await Promise.all([result, wait(800)]);
      return value;
    } finally {
      if (run.current === id) setBusy(false);
    }
  }, []);

  return { stage, setStage, busy, start };
}
