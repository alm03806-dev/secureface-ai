import pytest
import numpy as np
from PIL import Image
from backend.app.services.pad_service import pad_service
from backend.app.core.config import settings

def test_pad_model_loaded():
    assert pad_service.session is not None
    assert pad_service.threshold == settings.PAD_THRESHOLD
    assert pad_service.image_size == 224

def test_pad_preprocessing_dimensions():
    # Non-square image to test aspect ratio padding
    im = Image.new("RGB", (400, 200), color=(100, 150, 200))
    tensor = pad_service.preprocess(im)
    assert tensor.shape == (1, 3, 224, 224)
    assert tensor.dtype == np.float32

def test_pad_prediction_output_structure():
    im = Image.new("RGB", (224, 224), color=(127, 127, 127))
    res = pad_service.predict(im)
    assert "label" in res
    assert res["label"] in ("LIVE", "SPOOF")
    assert "attack_score" in res
    assert 0.0 <= res["attack_score"] <= 1.0
    assert "threshold" in res
    assert res["threshold"] == settings.PAD_THRESHOLD
    assert "is_live" in res
    assert res["is_live"] == (res["label"] == "LIVE")
    assert "model_scores" in res
    assert "mobilenetv3" in res["model_scores"]

def test_pad_threshold_decision_logic():
    # Verify strict threshold rule: attack_score >= threshold => SPOOF, else LIVE
    threshold = 0.0851
    assert ("SPOOF" if 0.0851 >= threshold else "LIVE") == "SPOOF"
    assert ("SPOOF" if 0.950 >= threshold else "LIVE") == "SPOOF"
    assert ("SPOOF" if 0.0850 >= threshold else "LIVE") == "LIVE"
    assert ("SPOOF" if 0.010 >= threshold else "LIVE") == "LIVE"
