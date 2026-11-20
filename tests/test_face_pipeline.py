import pytest
import numpy as np
from PIL import Image
from backend.app.services.face_detection_service import face_detection_service
from backend.app.services.face_embedding_service import face_embedding_service
from backend.app.core.security import encrypt_embedding, decrypt_embedding

def test_blur_calculation():
    # Solid flat color image has 0 variance (very blurry/flat)
    flat = np.ones((100, 100, 3), dtype=np.uint8) * 128
    score_flat = face_detection_service.check_blur(flat)
    assert score_flat < 1.0

    # High frequency noise pattern has high variance
    np.random.seed(42)
    noisy = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
    score_noisy = face_detection_service.check_blur(noisy)
    assert score_noisy > 100.0

def test_embedding_extraction_and_cosine_similarity():
    # Create synthetic face crops
    crop1 = np.full((112, 112, 3), 100, dtype=np.uint8)
    crop2 = np.full((112, 112, 3), 200, dtype=np.uint8)

    vec1 = face_embedding_service.extract_embedding(bgr_frame=crop1, face_crop_bgr=crop1)
    vec2 = face_embedding_service.extract_embedding(bgr_frame=crop2, face_crop_bgr=crop2)

    assert vec1.shape == (128,)
    assert vec2.shape == (128,)
    assert np.isclose(np.linalg.norm(vec1), 1.0, atol=1e-4)

    # Self similarity must be 1.0
    self_sim = face_embedding_service.compute_cosine_similarity(vec1, vec1)
    assert np.isclose(self_sim, 1.0, atol=1e-4)

    # Verification threshold function
    is_match, sim = face_embedding_service.verify_match(vec1, vec1, threshold=0.60)
    assert is_match is True
    assert sim >= 0.60

def test_biometric_encryption_fidelity():
    original_vector = np.random.randn(128).astype(np.float32)
    # Normalize
    original_vector /= np.linalg.norm(original_vector)

    encrypted_str = encrypt_embedding(original_vector)
    assert isinstance(encrypted_str, str)
    assert len(encrypted_str) > 0

    decrypted_vector = decrypt_embedding(encrypted_str)
    assert decrypted_vector.shape == (128,)
    assert decrypted_vector.dtype == np.float32
    assert np.allclose(original_vector, decrypted_vector, atol=1e-6)
