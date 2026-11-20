# Biometric Security, Cryptography & Privacy Policy

## 1. Zero Raw Image Persistence Principle
In strict compliance with privacy standards (GDPR Art. 9, CCPA, BIPA):
- Raw camera frames and image uploads are held transiently in memory for the duration of the inference request.
- Frames are never saved to disk, object storage, or database tables.
- Once the 128-dimensional embedding vector is extracted, the image buffer is immediately collected by memory management.

## 2. Cryptographic Template Protection
Biometric feature vectors are mathematical representations of facial geometry. If stored as plaintext, they represent privacy liabilities. SECUREFACE AI implements:
- **Symmetric Encryption**: AES-128-CBC / AES-256 with HMAC-SHA256 authenticated encryption via Python's standard `cryptography.fernet` library.
- **Key Management**: Fernet key managed via the `FERNET_KEY` environment variable.
- **Non-Invertibility**: Deep neural network embeddings are one-way transforms and cannot be directly inverted back into the original photographic image.

## 3. Explicit Consent & Audit Tracking
- Enrollment requires an affirmative consent confirmation boolean from the user.
- The consent event records the exact UTC timestamp in the `biometric_templates` table.
- Verification audit trails record only operational telemetry (verdict, attack score, match score, status, client IP). No biometrics are stored in audit logs.

## 4. GDPR Right-to-be-Forgotten (Template Purging)
- Users retain the right to delete their biometric enrollment at any time.
- The `DELETE /api/biometrics/template/{user_id}` endpoint performs an irreversible database purge of the encrypted ciphertext.
- All template deletion events are audited.

## 5. Security Limitations & Disclaimer
- **Not Certified Biometric Standard**: SECUREFACE AI is an advanced research demonstration and engineered application. It has not undergone formal FIDO Biometric Certification or iBeta PAD Level 1/2 compliance testing.
- **Identity Threshold Advisory**: The face matching threshold (0.60) is configurable in the Admin Panel and should be calibrated according to specific operational lighting and camera hardware conditions.
