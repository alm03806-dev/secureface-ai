# System Architecture & Technical Specifications

## 1. High-Level System Architecture

SECUREFACE AI is structured as a decoupled, microservice-ready system separating the high-performance computer vision inference backend (FastAPI) from the 3D cybernetic user interface (React + TypeScript + Vite + R3F).

```
+-------------------------------------------------------------------------------+
|                             CLIENT BROWSER (Vite + React)                     |
|  - React Three Fiber 3D Cyber Core                                            |
|  - Live Webcam Scanner + Cybernetic HUD Reticle                               |
|  - Synthesized Web Audio API Sci-Fi Feedback (Scan sweeps, Alerts, Chimes)    |
|  - Framer Motion 3D Tilt Cards & Animated Page Transitions                    |
+----------------------------------------+--------------------------------------+
                                         |
                       REST API / JSON Base64 Streaming
                                         |
+----------------------------------------v--------------------------------------+
|                           FASTAPI INFERENCE BACKEND                           |
|  1. Pre-validation: Format verification, size limit gate                      |
|  2. Stage 1: OpenCV YuNet DNN Face Detection & Quality Assessment             |
|     - Single-face enforcement (rejection of multi-face & no-face frames)     |
|     - Laplacian variance blur detection (threshold >= 30.0)                  |
|     - Bounding box dimension gate (w >= 80px, h >= 80px)                     |
|                                                                               |
|  3. Stage 2: Presentation Attack Detection (Primary PAD Model)                |
|     - Trained MobileNetV3-Large ONNX Runtime Model                           |
|     - Exact Preprocessing: Gray aspect pad (127,127,127) -> 224x224 Bilinear |
|     - Normalization: Mean [0.485, 0.456, 0.406], Std [0.229, 0.224, 0.225]   |
|     - Classification: Index 0 = LIVE, Index 1 = SPOOF                         |
|     - Decision Threshold: attack_score >= 0.905 => SPOOF REJECTED             |
|                                                                               |
|  4. Stage 3: Deep Facial Embedding Extraction (Inference Only)                |
|     - Pretrained SFace DNN Model (OpenCV Zoo)                                 |
|     - 128-D L2-Normalized feature vector extraction                          |
|     - Cosine similarity matching: sim(u, v) >= 0.60 => MATCH                  |
|                                                                               |
|  5. Cryptographic Storage & Biometric Privacy Engine                          |
|     - Fernet AES-256-CBC with SHA256 HMAC authentication                     |
|     - ZERO raw facial images stored to disk or database                       |
|     - Explicit consent recorded at enrollment timestamp                       |
|     - Full GDPR right-to-be-forgotten template purge endpoint                 |
+----------------------------------------+--------------------------------------+
                                         |
                              SQLAlchemy ORM + SQLite
                                         |
+----------------------------------------v--------------------------------------+
|                           PERSISTENT DATA STORE                               |
|  - users: User credentials (PBKDF2-HMAC-SHA256 salted hashes)                |
|  - biometric_templates: AES-256 ciphertext vectors (128-D)                   |
|  - verification_logs: Non-biometric audit trail (scores, verdicts, IP)        |
|  - system_settings: Dynamic threshold adjustments                             |
+-------------------------------------------------------------------------------+
```

---

## 2. Model Specifications & Provenance

### Primary Presentation Attack Detection (PAD) Model
- **File**: `exports/mobilenetv3.onnx` (and `project/mobilenetv3.onnx`)
- **Architecture**: MobileNetV3-Large
- **Engine**: ONNX Runtime (CPUExecutionProvider)
- **Input Tensor**: `(1, 3, 224, 224)`, RGB
- **Threshold**: `0.905` (Fixed from development validation on LCC/NUAA protocol)
- **Zero Retraining Policy**: Preserved with 100% fidelity. No weights altered.

### Face Localization (Inference Only)
- **Model**: OpenCV YuNet (`face_detection_yunet.onnx`)
- **Capabilities**: 5 facial landmarks (right eye, left eye, nose tip, right mouth, left mouth)
- **Fallback**: OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`)

### Feature Embedding (Inference Only)
- **Model**: OpenCV SFace (`face_recognition_sface.onnx`)
- **Output**: 128-D unit vector
- **Metric**: Cosine Similarity
- **Default Cutoff**: `0.60` (Configurable via Admin Panel)
