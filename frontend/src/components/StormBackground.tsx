import React, { useEffect, useRef } from 'react';

/**
 * Full-screen night backdrop for the home page: deep blue haze that drifts,
 * fine blue dust rising, and a faint distant lightning glow now and then.
 */
// Night: deep blue storm. Day: pale blue sky with soft blue haze.
type Sky = { stops: readonly string[]; haze: string; hazeA: number; flash: string; dust: string; dustA: number; blend: GlobalCompositeOperation };
const SKY: Record<'night' | 'day', Sky> = {
  night: { stops: ['#071330', '#030817', '#000205'], haze: '30,80,200', hazeA: 0.1, flash: '90,150,255', dust: '120,180,255', dustA: 0.55, blend: 'lighter' },
  day: { stops: ['#f4f8ff', '#e3ecfb', '#d2def4'], haze: '96,150,240', hazeA: 0.16, flash: '120,170,255', dust: '50,110,230', dustA: 0.45, blend: 'source-over' },
};

export const StormBackground: React.FC<{ day?: boolean }> = ({ day = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sky = useRef(SKY.night);
  sky.current = day ? SKY.day : SKY.night;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const dust = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.3,
      v: 0.004 + Math.random() * 0.012,
      ph: Math.random() * 6.28,
    }));
    const haze = [
      { x: 0.25, y: 0.35, r: 0.55, sp: 0.05, ph: 0 },
      { x: 0.75, y: 0.45, r: 0.5, sp: 0.04, ph: 2 },
      { x: 0.5, y: 0.8, r: 0.6, sp: 0.03, ph: 4 },
    ];
    let flash = 0;
    let flashAt = { x: 0.5, y: 0.3 };
    let nextFlash = 3 + Math.random() * 4;
    let t = 0;
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduced) t += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const S = sky.current;
      // base
      const bg = ctx.createRadialGradient(w / 2, h * 0.38, 0, w / 2, h * 0.38, Math.max(w, h) * 0.8);
      bg.addColorStop(0, S.stops[0]);
      bg.addColorStop(0.55, S.stops[1]);
      bg.addColorStop(1, S.stops[2]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = S.blend;
      // drifting haze
      for (const z of haze) {
        const x = (z.x + Math.sin(t * z.sp + z.ph) * 0.08) * w;
        const y = (z.y + Math.cos(t * z.sp * 0.8 + z.ph) * 0.05) * h;
        const r = z.r * Math.max(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${S.haze},${S.hazeA})`);
        g.addColorStop(1, `rgba(${S.haze},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // distant lightning glow
      if (!reduced) {
        nextFlash -= dt;
        if (nextFlash <= 0) {
          flash = 1;
          flashAt = { x: 0.15 + Math.random() * 0.7, y: 0.1 + Math.random() * 0.4 };
          nextFlash = 4 + Math.random() * 6;
        }
        flash = Math.max(0, flash - dt * 2.5);
        if (flash > 0) {
          const fx = flashAt.x * w;
          const fy = flashAt.y * h;
          const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(w, h) * 0.5);
          const a = flash * (0.6 + 0.4 * Math.sin(t * 60)); // flicker
          g.addColorStop(0, `rgba(${S.flash},${0.18 * a})`);
          g.addColorStop(1, `rgba(${S.flash},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // rising dust
      for (const d of dust) {
        if (!reduced) {
          d.y -= d.v * dt;
          if (d.y < -0.02) {
            d.y = 1.02;
            d.x = Math.random();
          }
        }
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + d.ph));
        ctx.fillStyle = `rgba(${S.dust},${tw * S.dustA})`;
        ctx.beginPath();
        ctx.arc(d.x * w + Math.sin(t * 0.5 + d.ph) * 10, d.y * h, d.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full -z-[5] pointer-events-none" aria-hidden />;
};
