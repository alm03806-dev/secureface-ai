# SECUREFACE AI — Futuristic Face Verification and Anti-Spoofing System

[![Python 3.11](https://img.shields.io/badge/Python-3.11-cyan.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.17+-blue.svg)](https://onnxruntime.ai)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/R3F-Three.js-black.svg)](https://docs.pmnd.rs/react-three-fiber)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Cyberpunk-38bdf8.svg)](https://tailwindcss.com)

**SECUREFACE AI** is an advanced, production-grade biometric verification and presentation attack detection (PAD / anti-spoofing) platform. It merges a trained **MobileNetV3 ONNX** anti-spoofing model with **OpenCV YuNet DNN** single-face localization, **SFace 128-D** deep facial embeddings, **AES-256 (Fernet) biometric template encryption**, and a **3D cybernetic user interface** built with React, Vite, Framer Motion, and React Three Fiber.

---

## 🛡️ Key System Highlights

1. **ML Rules**:
   - The primary anti-spoofing model is `exports/mobilenetv3.onnx` (v3: retrained on LCC-FASD, NUAA, MSU-MFSD and own-camera videos; results in `evaluation/pad_v3/`). The first model (LCC+NUAA only) is kept in `exports/archive/`.
   - PAD input is a face crop: detected face box x `PAD_CROP_MARGIN` (default 1.4), because all training data are face crops.
   - Exact preprocessing strictly matches `handoff.json` and `project/predictor.py` (neutral gray aspect ratio padding, bilinear interpolation to 224x224, ImageNet mean/std normalization).
   - PAD decision threshold: **0.50** (default balanced threshold for multi-device & laptop webcams; configurable via `.env` or the Admin panel).
   - Pretrained OpenCV YuNet and SFace models are strictly used for inference only.
2. **Dual-Stage Verification Pipeline**:
   - **Stage 1 (Liveness Defense)**: MobileNetV3 PAD inference blocks presentation attacks (printed photos, high-res screen replays, masks).
   - **Stage 2 (Identity Matching)**: 128-D unit-normalized feature extraction with cosine similarity comparison against enrolled templates.
3. **Biometric Privacy & GDPR Right-to-be-Forgotten**:
   - **Zero Raw Face Image Persistence**: Frames are processed purely in-memory and discarded immediately.
   - **Encrypted Templates**: Vector embeddings are serialized and encrypted with AES-256 (Fernet) prior to database persistence.
   - **One-Click Purge**: Users and administrators can irreversibly purge biometric templates at any time.
4. **Futuristic 3D & Cyber-Tech UI**:
   - Interactive 3D Cyber Core with rotating orbital wireframe rings and floating particle swarms using React Three Fiber.
   - 3D mouse hover tilt cards with dynamic lighting and glare.
   - Live webcam scanner HUD with bracketed targeting reticle and animated laser scanline sweeps.
   - Synthesized Web Audio API sound effects (laser sweeps, verification chimes, and security breach sirens).

---

## 📂 Project Structure

```
surface ai (antigravity)/
├── AGENTS.md                  # Project instructions & strict ML zero-retraining policy
├── errors.md                  # Active unresolved errors tracker
├── memory.md                  # Chronological milestones, tests, and deliverables
├── README.md                  # System overview and quickstart (this file)
├── docker-compose.yml         # Containerized multi-service deployment
├── .env.example               # Template environment configuration
├── run_backend.bat            # Windows 1-click backend runner
├── run_frontend.bat           # Windows 1-click frontend runner
├── run_all.bat                # Windows 1-click dual service launcher
├── run_all.ps1                # PowerShell launcher script
├── exports/                   # Preserved trained model artifacts
│   ├── mobilenetv3.onnx       # Primary MobileNetV3-Large PAD ONNX model
│   └── onnx_export_report.json
├── project/                   # Preserved original research prototype
│   ├── predictor.py           # Original inference logic & preprocessing
│   ├── app.py
│   ├── handoff.json           # Model configuration, mean/std, threshold (updated to 0.0851)
│   └── pad_models.py
├── evaluation/                # Preserved evaluation metrics & benchmark CSVs
├── reports/                   # Preserved audit reports & checkpoint discovery
├── backend/                   # FastAPI Production Application
│   ├── app/
│   │   ├── api/               # API routers (auth, pad, biometrics, history, admin)
│   │   ├── core/              # Config, security, database session
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   └── services/          # PAD predictor, face detector, embedding service
│   ├── models/                # Pretrained OpenCV Zoo inference models
│   │   ├── face_detection_yunet.onnx
│   │   └── face_recognition_sface.onnx
│   ├── requirements.txt       # Backend dependencies
│   └── main.py                # Server entry point
├── frontend/                  # React 18 + Vite + Tailwind + R3F Frontend
│   ├── src/
│   │   ├── components/3d/     # R3F 3D Cyber Core & particle fields
│   │   ├── components/ui/     # 3D Tilt cards, Cyber buttons, Badges
│   │   ├── components/webcam/ # LiveWebcam and ScannerHUD reticle overlay
│   │   ├── context/           # AuthContext & Web Audio SoundContext
│   │   ├── pages/             # All 7 futuristic pages
│   │   └── api/               # Axios REST API clients
│   ├── package.json
│   └── vite.config.ts
├── tests/                     # Automated backend test suite
│   ├── test_pad_predictor.py
│   ├── test_face_pipeline.py
│   └── test_api_endpoints.py
├── docs/                      # Technical documentation
│   ├── architecture.md
│   ├── security_and_privacy.md
│   └── api_reference.md
└── docker/                    # Docker containerization files
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```

---

## ⚡ Quickstart: Local Windows Run

### 1. Requirements
- Python 3.11+
- Node.js 18+ (tested on Node 24)

### 2. Automatic Windows 1-Click Launch
Double-click `run_all.bat` (or run `.\run_all.ps1` in PowerShell).
This automatically starts:
- **FastAPI Backend**: `http://localhost:8000`
- **Vite 3D Frontend**: `http://localhost:5173`

### 3. Manual Step-by-Step Launch

#### Start Backend
```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🐳 Quickstart: Docker Compose

```bash
docker-compose up --build
```
Access the application at `http://localhost:5173` and backend API at `http://localhost:8000`.

---

## 🔑 Default Credentials

- **Username**: `admin`
- **Password**: `SecureFace@2026`
- **Role**: `admin`

*You may also click "Auto-fill Default Admin" on the login screen for 1-click access.*

---

## 🧪 Automated Testing

Run the full automated test suite covering PAD inference, aspect-ratio padding, threshold boundary logic, blur estimations, face embeddings, vector encryption fidelity, and API endpoints:

```powershell
.\.venv\Scripts\python.exe -m pytest -v tests
```

Result: **13 of 13 tests passing (100% test pass rate)**.

---

## 📑 7 Complete Application Pages

1. **Landing Page (`/`)**: 3D Cyber Core visual scene, technology architecture overview, animated CTA buttons.
2. **Login / Register Page (`/login`)**: Secure cyber access terminal with JWT authentication and demo credential autofill.
3. **Dashboard (`/dashboard`)**: KPI cards, system telemetry, 7-day activity bar chart, live audit feed.
4. **Enrollment Page (`/enroll`)**: Live webcam scanner with biometric guidance reticle, explicit consent agreement, quality validation, and encrypted enrollment.
5. **Verification Page (`/verify`)**: Live webcam scanner, 1:1 and 1:N verification modes, real-time PAD and match score gauges, animated full-screen verdict banners.
6. **Audit History Page (`/history`)**: Filterable table by PAD verdict and status, search bar, CSV export, and telemetry inspection modal.
7. **Admin Control Panel (`/admin`)**: Real-time node diagnostics, configurable threshold sliders (PAD threshold, match threshold, blur gate, min resolution), user management, and GDPR template purge.

---

## 🔒 Security Disclaimer
SECUREFACE AI is an engineered research demonstration platform. While it strictly executes trained anti-spoofing inference and encrypted template storage, it has not undergone formal FIDO Biometric or iBeta PAD Level 1/2 compliance certification.
