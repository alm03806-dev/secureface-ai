# AGENTS.md — SECUREFACE AI Project Instructions & Guidelines

## 1. Project Goal & Overview
**SECUREFACE AI** is a futuristic, full-stack biometric verification and presentation attack detection (PAD / anti-spoofing) application.
It integrates a trained MobileNetV3 ONNX presentation attack detection model with pretrained face detection, pretrained facial feature embedding extraction, secure encrypted biometric template storage, and a 3D cyber-tech interface built with React, TypeScript, Tailwind CSS, Framer Motion, and React Three Fiber (R3F).

---

## 2. Machine Learning Rules
1. **TRAINING POLICY (updated for PAD v3)**:
   - Face detection (OpenCV YuNet) and face embedding (SFace) stay pretrained and are used for inference only.
   - The PAD model is NOT trained inside the application. It may only be retrained offline in the Kaggle notebook (`secureface_pad_training_v3.ipynb`).
   - The current PAD model is v3 (LCC-FASD + NUAA + MSU-MFSD + own-camera videos). The first model is archived at `exports/archive/mobilenetv3_lcc_nuaa_v1.onnx`. Keep old models when replacing one.
   - Every new PAD model needs held-out evaluation, stored under `evaluation/` (v3: `evaluation/pad_v3/`).
   - Do NOT fabricate benchmark metrics or alter historical evaluation files (`evaluation/`, `reports/`).
2. **PAD Model Specifications**:
   - Architecture: MobileNetV3-Large
   - File location: `exports/mobilenetv3.onnx` and `project/mobilenetv3.onnx`
   - Input format: Tensor `(1, 3, 224, 224)`, RGB channel order
   - Normalization: Mean `[0.485, 0.456, 0.406]`, Std `[0.229, 0.224, 0.225]`
   - Padding & Resizing: Aspect-ratio preserving square padding with neutral gray `(127, 127, 127)` followed by bilinear interpolation to `224x224`.
   - Classification Logic: Index 0 = `LIVE`, Index 1 = `SPOOF`.
   - Decision Boundary: Attack score $\ge$ `PAD_THRESHOLD` $\implies \text{SPOOF}$, otherwise LIVE (v3: 0.0851, v1: 0.905).
   - Input: face crop = detected face box x `PAD_CROP_MARGIN` (1.4), then the padding and resizing below.
   - Preprocessing and inference pipeline must strictly match `project/predictor.py` and `project/handoff.json`.
3. **Face Recognition & Detection**:
   - Use pretrained face detection (e.g. OpenCV YuNet / Haar Cascade / DNN) strictly for bounding box localization.
   - Use pretrained facial embedding model (or OpenCV SFace / lightweight ONNX face embedder) strictly for cosine similarity vector comparison.
   - Single-face requirement: reject frames containing multiple faces or no faces during enrollment and verification.
   - Face match threshold is configurable (default cosine similarity $\ge 0.60$ or distance $\le 0.40$), explicitly documented as subject to environmental calibration.

---

## 3. Architecture & Directory Structure
```
surface ai (antigravity)/
├── AGENTS.md                  # Permanent instructions & guidelines (this file)
├── errors.md                  # Active unresolved errors log
├── memory.md                  # Chronological milestones, tests, and deliverables
├── README.md                  # Complete system documentation & quickstart
├── docker-compose.yml         # Containerized multi-service deployment
├── .env.example               # Template environment configuration
├── exports/                   # Preserved model artifacts (mobilenetv3.onnx, reports)
├── project/                   # Preserved original predictor & minimal demo
├── evaluation/                # Preserved evaluation metrics & reports
├── reports/                   # Preserved configuration & benchmark JSONs
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── api/               # API routers (auth, pad, enroll, verify, history, admin)
│   │   ├── core/              # Config, security, encryption, database session
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── services/          # PAD predictor, face detector, embedding service
│   ├── requirements.txt       # Backend Python dependencies
│   └── main.py                # Server entry point
├── frontend/                  # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/        # 3D canvas, HUD overlays, glassmorphic cards, navbar
│   │   ├── pages/             # Landing, Login, Dashboard, Enroll, Verify, History, Admin
│   │   ├── services/          # Axios / API clients
│   │   └── styles/            # Tailwind theme, cyberpunk/neon glow styles
│   ├── package.json
│   └── vite.config.ts
├── tests/                     # Unit and integration test suites
│   ├── test_pad_predictor.py
│   ├── test_face_pipeline.py
│   └── test_api_endpoints.py
└── docs/                      # Technical docs, architecture, security analysis
```

---

## 4. UI / UX Design & Aesthetic Standards
- **Futuristic Cyber-Security Aesthetic**: Dark sleek theme (`#080B10`, `#0D111A`, `#131B2E`), subtle matrix/grid scanline backgrounds, soft glassmorphism (`backdrop-blur-md`, subtle border glow), cyan (`#00F2FE`), neon blue (`#4FACFE`), electric purple (`#8A2387`, `#7F00FF`), and warning amber/crimson accents.
- **3D & Interactive Elements**:
  - React Three Fiber (Three.js) interactive background: particle grid, rotating cybernetic security shield / biometric wireframe ring.
  - 3D card tilt on hover with dynamic glare.
  - Parallax motion linked to cursor coordinate shifts.
  - Animated biometric scanning HUD: animated bracketed reticle, scanning laser bar, target corners, confidence meters.
  - Smooth route transitions and modal micro-interactions using Framer Motion.
  - Real-time animated charts (verification trends, spoof attack breakdown).
- **Usability & Graceful Fallbacks**:
  - WebGL context loss recovery and reduced-motion fallback options for lower-powered systems.
  - Responsive design supporting standard desktop displays and laptops.

---

## 5. Security & Biometric Privacy Policy
1. **Consent-Driven Enrollment**: Users must check and provide cryptographic confirmation of biometric consent before template registration.
2. **Zero Raw Image Persistence**: Raw face images are never stored to disk or database. Frames are processed transiently in-memory and immediately discarded.
3. **Encrypted Biometric Templates**: Face embedding vectors are serialized, encrypted with AES-256-GCM (via Fernet / cryptography library), and stored as ciphertext in the database.
4. **Authentication & Access Control**: Passwords hashed with standard Argon2 / Bcrypt / PBKDF2 with SHA-256. Admin endpoints protected by JWT role-based access control.
5. **Audit Trail**: Every verification attempt logs timestamp, PAD verdict, spoof attack score, match confidence, and masked user ID without capturing biometrics.

---

## 6. Testing & Quality Assurance
- All backend components (PAD predictor, face detection, embedding matching, encryption, database operations) must be covered with automated unit tests using `pytest`.
- Frontend code must type-check cleanly with TypeScript and build successfully with Vite.
- Every milestone must be validated and logged in `memory.md`. Any persistent error must be logged in `errors.md`.
