import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "SECUREFACE AI"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    
    # Security & Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "secureface-super-secret-jwt-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Biometric Template AES/Fernet Encryption Key (Base64 32 bytes)
    # Default is a persistent random 32-byte key base64 encoded
    FERNET_KEY: str = os.getenv("FERNET_KEY", "b3h8K0T7y8XpWz6L2Mv1Q4R9sA7dF5gH3jK1lZ0xN8w=")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{ROOT_DIR / 'secureface.db'}")
    
    # PAD Model Parameters strictly from handoff.json
    PAD_MODEL_PATH: str = os.getenv("PAD_MODEL_PATH", str(ROOT_DIR / "exports" / "mobilenetv3.onnx"))
    FALLBACK_PAD_MODEL_PATH: str = str(ROOT_DIR / "project" / "mobilenetv3.onnx")
    # v3 PAD model (LCC+NUAA+MSU+own camera); threshold calibrated for robust laptop & phone camera usage
    # Default 0.50 corresponds to the natural balanced decision boundary P(SPOOF) > P(LIVE).
    PAD_THRESHOLD: float = float(os.getenv("PAD_THRESHOLD", "0.50"))
    # Face-crop margin for PAD input: crop = detected face box x this factor (square, centred).
    # The PAD training data are face crops, so the model must not see the whole webcam frame.
    # Set env PAD_CROP_MARGIN=0 to switch the crop off (old behaviour) for comparison.
    PAD_CROP_MARGIN: float = float(os.getenv("PAD_CROP_MARGIN", "1.4"))
    PAD_IMAGE_SIZE: int = 224
    PAD_MEAN: List[float] = [0.485, 0.456, 0.406]
    PAD_STD: List[float] = [0.229, 0.224, 0.225]
    
    # Face Recognition Verification (Cosine Similarity: higher is more similar)
    FACE_MATCH_THRESHOLD: float = 0.60
    
    # Quality check thresholds
    MIN_FACE_RESOLUTION: int = 80
    BLUR_THRESHOLD: float = 30.0  # Laplacian variance threshold
    
    # Default Admin Credentials
    DEFAULT_ADMIN_USERNAME: str = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "SecureFace@2026")
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@secureface.ai")
    
    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
