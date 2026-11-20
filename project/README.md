# SecureFace AI Image PAD Handoff

This folder is a standalone **image-based** presentation attack demo. It does **not** perform identity verification. Threshold was selected using LCC development only.

## Run (after valid ONNX files exist)

```bash
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

Browse http://127.0.0.1:8000 ; enable camera permission. The webcam sends a single captured frame only when asked. No dataset images or original NUAA/LCC files are packaged.

Before deployment, separately validate PAD calibration under local webcam conditions, privacy/security, spoof bypasses, liveness challenge design, integration with a face verifier and template encryption. Do not claim presentation-attack certification or digital-injection defense.

Model architectures `LWFLNetStyle` and `GhostAFFStyle` are engineering reconstructions, not verified exact reproductions of their published-paper source code. See notebook and `handoff.json`.

NUAA is research-only and restricts redistribution. Do not use this demo for commercial biometric decisions without verifying all model/dataset licences and regulatory obligations.
