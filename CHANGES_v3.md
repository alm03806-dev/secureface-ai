# SecureFace AI: v3 update (PAD model retrained, face crop)

## What changed
- `exports/mobilenetv3.onnx` and `project/mobilenetv3.onnx`: new PAD model (trained on LCC-FASD, NUAA, MSU-MFSD and own phone videos).
  The first model is kept at `exports/archive/mobilenetv3_lcc_nuaa_v1.onnx`.
- Threshold is now 0.0851 (was 0.905). The old and new thresholds are NOT interchangeable.
- PAD now receives a face crop (detected face box x 1.4, `PAD_CROP_MARGIN`) instead of the whole frame, because the training data are face crops.
- Results of the new model: `evaluation/pad_v3/README_RESULTS.md`.
- Updated: frontend threshold texts, tests, README, AGENTS.md (training policy), `project/handoff.json`.

## Run
`run_all.ps1` (or `run_backend.bat` and `run_frontend.bat`). No webcam: use UPLOAD PHOTO / UPLOAD FILE, enroll your face first.

## Back to the old model (no code change)
```
set PAD_MODEL_PATH=exports\archive\mobilenetv3_lcc_nuaa_v1.onnx
set PAD_THRESHOLD=0.905
set PAD_CROP_MARGIN=0
```
