import React, { useEffect, useRef } from 'react';

/**
 * Glowing angry eyes with live lightning, drawn in canvas at device resolution
 * (sharp on any screen). Breathing glow, random blinks, lightning flickers, sparks.
 * Transparent background.
 */

type Pt = [number, number];

// Left eye in a 1 x 1 box (outer corner left, inner corner right and lower).
// Top edge nearly straight, bottom edge a round belly, like the artwork.
const O: Pt = [0.0, 0.05]; // outer corner
const I: Pt = [1.0, 0.72]; // inner corner
const TOP_C: Pt = [0.5, 0.33];
const BOT_C: Pt = [0.2, 1.18];

const BLUE = '47,123,255';
const CYAN = '140,215,255';

// Night: light adds up on black (white-hot). Day: deep blue ink with a soft blue aura.
type Pal = { blend: GlobalCompositeOperation; glow: string; rim: string; boltOuter: string; boltCore: string; core: readonly string[]; spark: string; halo: number; day?: boolean };
const PALETTE: Record<'night' | 'day', Pal> = {
  night: { blend: 'lighter', glow: BLUE, rim: CYAN, boltOuter: CYAN, boltCore: '235,245,255', core: ['255,255,255', '240,250,255', CYAN], spark: CYAN, halo: 0.55 },
  day: { day: true, blend: 'source-over', glow: '59,130,246', rim: '0,160,255', boltOuter: '37,99,235', boltCore: '15,50,150', core: ['150,205,255', '40,110,245', '12,45,150'], spark: '37,99,235', halo: 0.35 },
};

function bolt(a: Pt, b: Pt, rough: number, depth = 5): Pt[] {
  // midpoint displacement
  let pts: Pt[] = [a, b];
  let r = rough;
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const len = Math.hypot(nx, ny) || 1;
      const off = (Math.random() - 0.5) * r;
      next.push([(x0 + x1) / 2 + (nx / len) * off, (y0 + y1) / 2 + (ny / len) * off], pts[i]);
    }
    pts = next;
    r *= 0.55;
  }
  return pts;
}

interface Bolt {
  pts: Pt[];
  branch: Pt[] | null;
  life: number; // seconds left
  max: number;
}

export const GlowEyes: React.FC<{ className?: string; day?: boolean }> = ({ className = '', day = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const pal = useRef(PALETTE.night);
  pal.current = day ? PALETTE.day : PALETTE.night;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    resize();

    // geometry in CSS px, recomputed each frame from size
    const eyeBox = (side: 0 | 1) => {
      const ew = w * 0.27;
      const eh = ew * 0.48;
      const gap = w * 0.07;
      const cx = w / 2;
      const cy = h / 2;
      const x = side === 0 ? cx - gap / 2 - ew : cx + gap / 2;
      return { x, y: cy - eh / 2, ew, eh };
    };
    const eyePath = (side: 0 | 1, open: number) => {
      const { x, y, ew, eh } = eyeBox(side);
      // squash towards the slanted line between the corners when blinking
      const map = ([u, v]: Pt): Pt => {
        const mid = O[1] + (I[1] - O[1]) * u;
        const vv = mid + (v - mid) * open;
        const uu = side === 0 ? u : 1 - u;
        return [x + uu * ew, y + vv * eh];
      };
      const [o, i, tc, bc] = [map(O), map(I), map(TOP_C), map(BOT_C)];
      const p = new Path2D();
      p.moveTo(o[0], o[1]);
      p.quadraticCurveTo(tc[0], tc[1], i[0], i[1]);
      p.quadraticCurveTo(bc[0], bc[1], o[0], o[1]);
      p.closePath();
      return p;
    };

    // lightning: strands from the eye rims outward, like the artwork
    const bolts: Bolt[] = [];
    const spawn = (strong = false) => {
      for (const side of [0, 1] as const) {
        const { x, y, ew, eh } = eyeBox(side);
        const dir = side === 0 ? -1 : 1;
        const n = strong ? 4 : 2;
        for (let k = 0; k < n; k++) {
          // start on the rim: mostly the upper brow and the outer corner, some below
          const u = Math.random() * 0.75;
          const below = Math.random() < 0.3;
          const vRim = below ? 0.8 + u * 0.05 : 0.08 + u * 0.35;
          const startX = side === 0 ? x + u * ew : x + (1 - u) * ew;
          const start: Pt = [startX, y + vRim * eh];
          const reach = ew * (0.15 + Math.random() * 0.35);
          const end: Pt = [
            startX + dir * reach * (0.6 + Math.random() * 0.6),
            start[1] + (below ? 1 : -1) * eh * (0.15 + Math.random() * 0.6),
          ];
          const pts = bolt(start, end, ew * 0.1);
          const bi = 4 + Math.floor(Math.random() * (pts.length - 8));
          const bs = pts[bi];
          const branch =
            Math.random() < 0.6
              ? bolt(bs, [bs[0] + dir * ew * 0.15 * Math.random(), bs[1] + (Math.random() - 0.5) * eh * 0.8], ew * 0.08, 4)
              : null;
          const max = strong ? 0.25 + Math.random() * 0.2 : 0.8 + Math.random() * 1.0;
          bolts.push({ pts, branch, life: max, max });
        }
      }
    };

    // sparks around the eyes
    const sparks = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.1,
      v: 0.01 + Math.random() * 0.03,
      ph: Math.random() * Math.PI * 2,
    }));

    let last = performance.now();
    let nextBlink = 2 + Math.random() * 3;
    let blinkT = -1;
    let nextFlash = 1.5 + Math.random() * 2.5;
    let flash = 0;
    let nextBolt = 0;
    let time = 0;

    const strokeBolt = (pts: Pt[], alpha: number, width: number) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      const P = pal.current;
      ctx.shadowColor = `rgba(${P.glow},${alpha})`;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = `rgba(${P.boltOuter},${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(${P.boltCore},${alpha * 0.9})`;
      ctx.lineWidth = width * 0.4;
      ctx.stroke();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += reduced ? 0 : dt;

      // timers
      if (!reduced) {
        nextBlink -= dt;
        if (nextBlink <= 0 && blinkT < 0) {
          blinkT = 0;
          nextBlink = 3.5 + Math.random() * 4;
        }
        nextFlash -= dt;
        if (nextFlash <= 0) {
          flash = 1;
          spawn(true);
          nextFlash = 2.5 + Math.random() * 4;
        }
        nextBolt -= dt;
        if (nextBolt <= 0) {
          spawn(false);
          nextBolt = 0.12 + Math.random() * 0.15;
        }
      } else if (!bolts.length) {
        for (let i = 0; i < 4; i++) spawn(false);
        bolts.forEach((b) => (b.life = b.max = 1e9));
      }
      flash = Math.max(0, flash - dt * 4);
      let open = 1;
      if (blinkT >= 0) {
        blinkT += dt;
        const d = 0.22;
        open = blinkT < d ? 1 - 0.94 * Math.sin((blinkT / d) * Math.PI) : 1;
        if (blinkT >= d) blinkT = -1;
      }
      const breath = 0.5 - 0.5 * Math.cos((time * Math.PI * 2) / 4);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const P = pal.current;
      ctx.globalCompositeOperation = P.blend;

      // lightning
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life -= dt;
        if (b.life <= 0) {
          bolts.splice(i, 1);
          continue;
        }
        const p = b.life / b.max;
        const a = Math.min(1, p * 3) * Math.min(1, (1 - p) * 8 + 0.3) * (0.55 + 0.45 * breath + flash * 0.6);
        // tiny jitter so strands crackle
        const jit = b.pts.map(([x, y]) => [x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8] as Pt);
        strokeBolt(jit, a, 1.6);
        if (b.branch) strokeBolt(b.branch, a * 0.7, 1.1);
      }

      // eyes: soft halo, blue glow, cyan rim, white-hot core
      for (const side of [0, 1] as const) {
        const path = eyePath(side, open);
        const { x, y, ew, eh } = eyeBox(side);
        const glow = (0.7 + 0.3 * breath + flash * 0.5) * (0.35 + 0.65 * open);
        const ecx = x + ew / 2;
        const ecy = y + eh * 0.55;

        ctx.save();
        ctx.translate(ecx, ecy);
        ctx.scale(1, 0.55);
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, ew * 0.95);
        halo.addColorStop(0, `rgba(${P.glow},${P.halo * glow})`);
        halo.addColorStop(0.45, `rgba(${P.glow},${P.halo * 0.33 * glow})`);
        halo.addColorStop(1, `rgba(${P.glow},0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(-ew, -ew, ew * 2, ew * 2);
        ctx.restore();

        for (const [blur, alpha] of [[w * 0.05, 0.9], [w * 0.018, 1]] as const) {
          ctx.shadowColor = `rgba(${P.glow},${Math.min(1, glow * alpha)})`;
          ctx.shadowBlur = blur;
          ctx.fillStyle = `rgba(${P.glow},${0.8 * glow})`;
          ctx.fill(path);
        }
        ctx.shadowBlur = w * 0.012;
        ctx.shadowColor = `rgba(${P.rim},1)`;
        ctx.strokeStyle = `rgba(${P.rim},${0.9 * glow})`;
        ctx.lineWidth = Math.max(2, w * 0.004);
        ctx.lineJoin = 'round';
        ctx.stroke(path);
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.clip(path);
        const g = ctx.createRadialGradient(ecx, y + eh * 0.5, 0, ecx, y + eh * 0.5, ew * 0.6);
        g.addColorStop(0, `rgba(${P.core[0]},1)`);
        g.addColorStop(0.55, `rgba(${P.core[1]},0.98)`);
        g.addColorStop(1, `rgba(${P.core[2]},${P.day ? 1 : 0.55})`);
        ctx.fillStyle = g;
        ctx.fill(path);
        ctx.restore();
      }

      // sparks drift up and twinkle
      for (const s of sparks) {
        if (!reduced) {
          s.y -= s.v * dt;
          if (s.y < 0) {
            s.y = 1;
            s.x = Math.random();
          }
        }
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + s.ph));
        const edge = Math.min(1, s.y * 5, (1 - s.y) * 5);
        const sx = w * (0.12 + s.x * 0.76) + Math.sin(time + s.ph) * 6;
        const sy = h * (0.15 + s.y * 0.75);
        ctx.fillStyle = `rgba(${P.spark},${tw * edge * 0.9})`;
        ctx.shadowColor = `rgba(${P.glow},1)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`block ${className}`} role="img" aria-label="SecureFace AI" />;
};
