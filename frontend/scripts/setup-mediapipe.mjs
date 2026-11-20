// Copies the MediaPipe wasm runtime into public/ and downloads the face model once.
// Runs automatically after `npm install`. Safe to run again.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const out = 'public/mediapipe';
mkdirSync(out, { recursive: true });
cpSync('node_modules/@mediapipe/tasks-vision/wasm', `${out}/wasm`, { recursive: true });

const model = `${out}/face_landmarker.task`;
const url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
if (!existsSync(model)) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(model, Buffer.from(await res.arrayBuffer()));
    console.log('[mediapipe] face model downloaded');
  } catch (e) {
    console.warn(`[mediapipe] model download failed (${e.message}); the app will load it from the internet at runtime.`);
  }
}
