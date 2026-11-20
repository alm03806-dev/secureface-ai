"""Face Embedding Extraction & Verification Service.
Uses pretrained OpenCV SFace deep neural network (128-D L2-normalized feature vector)
with cosine similarity verification. Zero model training.
"""
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class FaceEmbeddingService:
    def __init__(self):
        self.model_path = ROOT_DIR / "backend" / "models" / "face_recognition_sface.onnx"
        self.recognizer = None
        self._init_recognizer()

    def _init_recognizer(self):
        if self.model_path.exists():
            try:
                self.recognizer = cv2.FaceRecognizerSF.create(str(self.model_path), "")
                logger.info("FaceRecognizerSF (SFace) loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SFace model: {e}")
                self.recognizer = None
        else:
            logger.warning(f"SFace model not found at {self.model_path}")

    def extract_embedding(self, bgr_frame: np.ndarray, face_raw_info: Optional[np.ndarray] = None, face_crop_bgr: Optional[np.ndarray] = None) -> np.ndarray:
        """Extracts a 128-dimensional normalized embedding vector.
        If face_raw_info (from YuNet with 5 landmarks) is available, uses SFace alignCrop.
        Otherwise resizes face crop to 112x112 and runs SFace.
        """
        if self.recognizer is None:
            self._init_recognizer()

        if self.recognizer is None:
            raise RuntimeError("Face recognition model is not loaded.")

        if face_raw_info is not None:
            aligned_face = self.recognizer.alignCrop(bgr_frame, face_raw_info)
        else:
            if face_crop_bgr is None:
                raise ValueError("Either face_raw_info or face_crop_bgr must be provided.")
            aligned_face = cv2.resize(face_crop_bgr, (112, 112))

        features = self.recognizer.feature(aligned_face)
        # SFace features shape: (1, 128)
        feat_vec = features[0].astype(np.float32)
        # Ensure unit L2 norm
        norm = np.linalg.norm(feat_vec)
        if norm > 1e-6:
            feat_vec = feat_vec / norm
        return feat_vec

    @staticmethod
    def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Computes cosine similarity between two unit-normalized vectors.
        Output range: [-1.0, 1.0]. Higher value means higher similarity.
        """
        u = vec1.flatten().astype(np.float32)
        v = vec2.flatten().astype(np.float32)
        
        norm_u = np.linalg.norm(u)
        norm_v = np.linalg.norm(v)
        
        if norm_u < 1e-6 or norm_v < 1e-6:
            return 0.0
            
        sim = float(np.dot(u, v) / (norm_u * norm_v))
        return round(sim, 6)

    def verify_match(self, candidate_vec: np.ndarray, enrolled_vec: np.ndarray, threshold: Optional[float] = None) -> Tuple[bool, float]:
        """Compares candidate embedding against enrolled template."""
        match_threshold = threshold if threshold is not None else settings.FACE_MATCH_THRESHOLD
        similarity = self.compute_cosine_similarity(candidate_vec, enrolled_vec)
        is_match = similarity >= match_threshold
        return is_match, similarity

face_embedding_service = FaceEmbeddingService()
