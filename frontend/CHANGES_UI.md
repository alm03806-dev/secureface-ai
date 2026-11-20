# SecureFace UI v3.1: minimal glass redesign

## What changed
- New light, iOS-style glass design. Every user page says only what a normal user needs (Bangla).
- The AI video (`public/mascot/robot_intro.mp4`) now drives the mascot:
  - `public/mascot/states/<state>.mp4`: six short seamless loops cut from the video
    (idle, scanning, target_acquired, analyzing, verified, spoof_detected), with `.jpg` posters.
  - `public/mascot/states/showcase.mp4`: all states in sequence, used on the home page.
  - `src/components/MascotOrb.tsx` keeps all loops loaded and cross-fades (blur + scale) between them.
  - Verify and enroll play the video story while the request runs: scanning, then target, then analyzing, then the result.
- Transitions: pages scale and blur in. Tabs and segmented controls use a sliding pill, and the consent control is an iOS switch. Users who ask for reduced motion get none of this.
- Pages: Home, Login, Verify, Enroll, History (simple list), Admin (numbers, 2 sliders, users).
- Removed: Dashboard page, 3D particles (three.js), confetti, cyber HUD, model names and scores on user pages.
  Dependencies removed: three, @react-three/*, canvas-confetti.
- Removed the "Quick Login as Admin" button, because it showed the admin password in the UI.
- Enrollment consent is now off by default (explicit opt-in).

## Fixes
- Admin PAD slider: the old range started at 0.10, so the v3 threshold 0.0851 could not be shown.
  Saving would silently raise it. The new range is 0.01–0.95, and a "recommended value" button sets 0.0851.
- History times: the API sends UTC without "Z" (SQLite), so times were off by the local offset. They are now read as UTC.

## Re-cut the mascot clips (if the video changes)
See the ffmpeg commands in the git history / ask Claude; times used (seconds): idle 0–1, scanning 1.3–2.6,
target 2.8–3.9, analyzing 4.3–5.9, verified 6.3–7.6, spoof 8.5–9.9. Crop 640x640 at (320,40), scale 480, ping-pong loop.

## v3.1.1: live 3D face scan
- `src/components/FaceScan.tsx`: MediaPipe Face Landmarker draws a 478-point 3D mesh on the live camera.
  Points closer to the camera are bigger and brighter. A scan band sweeps the face.
  Colours: white = ready, orange = scanning, green = verified, red = spoof.
- The mascot shows "target acquired" as soon as a face is found, before any click.
- `npm install` runs `scripts/setup-mediapipe.mjs`. It copies the wasm into `public/mediapipe/` and downloads the face model (~4 MB).
  If that download fails, the browser loads the model from Google at runtime. With no model at all, the dashed guide oval stays and everything else still works.
- Detection runs only in the browser and only for the overlay. Verification still uses the backend (YuNet + SFace + PAD), unchanged.

## v3.1.2: static demo build
- `npm run build:demo` writes `dist-demo/`: the same app with a fake in-memory API (`src/api/demo.ts`), so it runs with no backend.
  Verify results take turns: success, spoof, no match.
- Admin delete buttons now ask for a second tap instead of `window.confirm`. Errors show on the page instead of in `alert`.
- localStorage access is wrapped (`src/lib/storage.ts`), and asset paths follow the deploy base (`src/lib/asset.ts`).

## v3.2: Bangla/English, day/night, 3D
- Language switch in the nav (EN / বাং). All text lives in `src/lib/i18n.ts`, and the choice is remembered.
- Day/night switch (sun/moon). It follows the system setting until the user picks one. Colours are CSS variables in `src/styles/index.css` (`:root` and `.dark`).
- 3D (`src/components/Tilt.tsx`): the mascot, step cards and camera tilt with the pointer (and with phone tilt on Android). The background colour fields drift at different depths.
- Camera movement: the camera frame tilts against your head position, using the face mesh, so it feels like a window. While scanning, the view zooms in towards your face (Face ID style).
- Page transitions now come forward in depth (rotateX + scale + blur).
- Everything 3D turns off when the system asks for reduced motion.

## v3.2.1: AI sphere on the home page
- The home page shows the AI sphere (`public/sphere/sphere.mp4`) instead of the robot. The clip is a 9 s seamless loop with a 1 s cross-fade, cropped to 512x512.
- `src/components/Sphere.tsx` removes the black background in the browser (alpha = brightest channel, plus a soft circular mask), so the sphere floats on day and night themes. It tilts with the pointer and floats slowly.
- The robot still shows scan states on the verify, register and login pages. The unused robot showcase clip is removed.

## v3.3: glowing eyes + night stage on home
- Home hero: `src/components/GlowEyes.tsx` draws the glowing eyes in canvas at device resolution, so they stay sharp on any screen (4K included). No video file is used.
  - Each eye has a halo, blue glow, cyan rim and white core. The glow breathes, the eyes blink at random, and lightning strands crackle around the eyes and flare now and then. Blue sparks drift up.
- `src/components/StormBackground.tsx`: the home page is a night stage in both themes. It has a deep blue haze that drifts, rising blue dust and a faint distant lightning flash.
  It is mounted in `App.tsx`, outside the transformed page, so `position: fixed` covers the viewport.
- The sphere is removed (component and `public/sphere/`).

## v3.3.1: home page follows day/night
- Night: deep blue storm with white-hot eyes (as before).
- Day: pale blue sky. The eyes are deep blue with a bright centre, a cyan rim and blue lightning, and the dust is blue.
- Palettes live in `GlowEyes.tsx` (`PALETTE`) and `StormBackground.tsx` (`SKY`). Switching theme changes colours live, without restarting the animation.
