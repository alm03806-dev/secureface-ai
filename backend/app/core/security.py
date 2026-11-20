import base64
import hashlib
import hmac
import os
import struct
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
import jwt
from cryptography.fernet import Fernet
from backend.app.core.config import settings

# -------------------------------------------------------------
# Password Hashing via Salted PBKDF2-HMAC-SHA256 (Robust & Secure)
# -------------------------------------------------------------
def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 120_000)
    return f"pbkdf2_sha256${base64.b64encode(salt).decode('ascii')}${base64.b64encode(key).decode('ascii')}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split('$')
        if len(parts) != 3 or parts[0] != 'pbkdf2_sha256':
            return False
        salt = base64.b64decode(parts[1].encode('ascii'))
        expected_key = base64.b64decode(parts[2].encode('ascii'))
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 120_000)
        return hmac.compare_digest(expected_key, new_key)
    except Exception:
        return False

# -------------------------------------------------------------
# JWT Authentication Tokens
# -------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None

# -------------------------------------------------------------
# Biometric Vector Encryption / Decryption (Fernet AES-128-CBC)
# -------------------------------------------------------------
def get_cipher() -> Fernet:
    try:
        key = settings.FERNET_KEY.encode('utf-8')
        return Fernet(key)
    except Exception:
        # Fallback to deterministic key derived from SECRET_KEY if invalid
        derived = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
        return Fernet(derived)

def encrypt_embedding(vector: np.ndarray) -> str:
    """Serializes a float32 embedding vector and encrypts it."""
    cipher = get_cipher()
    raw_bytes = vector.astype(np.float32).tobytes()
    encrypted = cipher.encrypt(raw_bytes)
    return base64.b64encode(encrypted).decode('ascii')

def decrypt_embedding(encrypted_str: str) -> np.ndarray:
    """Decrypts ciphertext and reconstructs the float32 embedding vector."""
    cipher = get_cipher()
    encrypted_bytes = base64.b64decode(encrypted_str.encode('ascii'))
    decrypted_bytes = cipher.decrypt(encrypted_bytes)
    return np.frombuffer(decrypted_bytes, dtype=np.float32)
