# SecureFace AI: PAD training results

Datasets used: LCC, NUAA, MSU, OWN. Total notebook time: 34 min. Labels: 0 = live, 1 = spoof. Positive class = spoof.

## 1. Final model (trained on all datasets), test splits

Decision threshold (minimum ACER, taken from OWN dev sessions): **0.0851** (pooled-dev threshold 0.0721). Live-friendly threshold (dev BPCER <= 5 percent): 0.0851.

| dataset | n | n_live | n_spoof | APCER | BPCER | ACER | AUC | EER |
|---|---|---|---|---|---|---|---|---|
| LCC | 7580 | 314 | 7266 | 0.012 | 0.204 | 0.108 | 0.983 | 0.077 |
| MSU | 4807 | 2434 | 2373 | 0.044 | 0.115 | 0.080 | 0.987 | 0.064 |
| NUAA | 9123 | 3362 | 5761 | 0.019 | 0.168 | 0.094 | 0.985 | 0.061 |
| OWN | 1845 | 923 | 922 | 0.002 | 0.005 | 0.004 | 1.000 | 0.005 |

These datasets were all seen in training (different subjects/frames, same domain), so these numbers are the optimistic case.

## 2. Cross-dataset (leave-one-dataset-out): the honest generalisation test

Each row: train on the other datasets, threshold from their dev sets, test on the target dataset that the model never saw.

| target | trained_on | n | APCER | BPCER | ACER | AUC | EER |
|---|---|---|---|---|---|---|---|
| LCC | NUAA+MSU+OWN | 7580 | 0.027 | 0.720 | 0.373 | 0.868 | 0.216 |
| NUAA | LCC+MSU+OWN | 9123 | 0.160 | 0.585 | 0.372 | 0.718 | 0.326 |
| MSU | LCC+NUAA+OWN | 4807 | 0.306 | 0.189 | 0.247 | 0.846 | 0.233 |
| OWN | LCC+NUAA+MSU | 1845 | 0.000 | 0.472 | 0.236 | 0.971 | 0.109 |

Compare these rows with section 1. A large gap means the model depends on the camera/attack style of its training data.

The row with target OWN is the number that matters for a real demo: the model was trained on public data only and tested on YOUR camera. Section 1 (OWN row) shows what happens after the model has also seen other sessions of your camera; the test sessions are still held out.

## Files

- `exports/mobilenetv3.onnx`: new PAD model. Same I/O as the backend expects (input `image` 1x3x224x224, output 2 logits, softmax[1] = attack score).
- `exports/handoff.json`: threshold 0.0851 and preprocessing.
- `models/mobilenetv3_final.pth`: PyTorch weights.
- `results/`: metric tables (csv), per-image test scores, training history, data report, config.
- `plots/`: ROC, score histograms, seen vs unseen, training curves.

## How to use it in the backend

1. Copy the new `exports/mobilenetv3.onnx` from this zip over the project's `exports/mobilenetv3.onnx` (and `project/mobilenetv3.onnx`).
2. Set the threshold without editing code: environment variable `PAD_THRESHOLD=0.0851` (or change `PAD_THRESHOLD` in `backend/app/core/config.py`). The tests in `tests/test_pad_predictor.py` assert 0.905 and the old model, update them after you switch.
3. The backend must feed the PAD model a face crop (face box x 1.4), because every training set here is face crops. Use the `face_crop_pad` patch (`PAD_CROP_MARGIN`, default 1.4). With `PAD_CROP_MARGIN=0` you can compare against the old full-frame behaviour.
4. Test on your own camera: live face, printed photo, phone-screen replay. If live users are rejected too often, use the live-friendly threshold (0.0851) and check how many attacks get through.

## Limitations

Three public datasets, mostly print and replay attacks, no 3D masks. NUAA is old and low resolution. MSU frames were cropped with an OpenCV Haar detector (frames without a detected face were dropped). This is an image-only PAD research prototype, not a certified (iBeta/FIDO) system.
