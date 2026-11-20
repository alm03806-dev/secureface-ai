# SECUREFACE AI API Reference

Base URL: `http://localhost:8000/api`

Interactive Swagger Docs: `http://localhost:8000/docs`

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST /auth/register`
- **Body**:
  ```json
  {
    "username": "operator1",
    "email": "operator1@secureface.ai",
    "password": "SecurePassword2026!",
    "full_name": "Agent Smith",
    "role": "user"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "user",
    "username": "operator1",
    "user_id": 2
  }
  ```

### Login
- **Method**: `POST /auth/login`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "SecureFace@2026"
  }
  ```

### Get Profile
- **Method**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`

---

## 2. Presentation Attack Detection (Anti-Spoofing)

### Predict PAD (JSON Base64)
- **Method**: `POST /pad/predict-json`
- **Body**:
  ```json
  {
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "label": "LIVE",
    "attack_score": 0.124500,
    "threshold": 0.905,
    "is_live": true,
    "model_scores": {
      "mobilenetv3": 0.124500
    },
    "face_detected": true,
    "face_box": [120, 80, 200, 240],
    "quality": {
      "passed": true,
      "blur_score": 114.5,
      "face_resolution": [200, 240],
      "issues": []
    },
    "note": "Primary trained MobileNetV3-Large PAD model inference."
  }
  ```

---

## 3. Biometric Verification & Enrollment

### Enroll Template
- **Method**: `POST /biometrics/enroll`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body**:
  ```json
  {
    "image_base64": "...",
    "consent": true
  }
  ```

### Verify Identity
- **Method**: `POST /biometrics/verify`
- **Body**:
  ```json
  {
    "image_base64": "...",
    "claimed_username": "operator1"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "verified": true,
    "status": "VERIFIED",
    "pad_verdict": "LIVE",
    "attack_score": 0.084120,
    "pad_threshold": 0.905,
    "match_score": 0.812400,
    "match_threshold": 0.60,
    "matched_user": {
      "user_id": 2,
      "username": "operator1",
      "email": "operator1@secureface.ai"
    },
    "face_box": [115, 78, 205, 245],
    "message": "Verification successful: Identity confirmed as 'operator1' (Cosine Sim: 0.8124)"
  }
  ```

### Purge Biometric Template (GDPR)
- **Method**: `DELETE /biometrics/template/{user_id}`
- **Headers**: `Authorization: Bearer <TOKEN>`

---

## 4. Audit History & Analytics

- `GET /history?limit=50&verdict=SPOOF`
- `GET /history/stats`

---

## 5. Administration

- `GET /admin/users`
- `PUT /admin/users/{user_id}/toggle-status`
- `DELETE /admin/users/{user_id}`
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/diagnostics`
