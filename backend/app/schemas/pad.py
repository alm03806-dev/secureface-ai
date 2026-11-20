from typing import Optional, Dict, List
from pydantic import BaseModel

class PADJsonRequest(BaseModel):
    image_base64: str

class QualityCheckResult(BaseModel):
    passed: bool
    blur_score: float
    face_resolution: Optional[List[int]] = None
    issues: List[str] = []

class PADResponse(BaseModel):
    label: str  # "LIVE" or "SPOOF"
    attack_score: float
    threshold: float
    is_live: bool
    model_scores: Dict[str, float]
    face_detected: bool
    face_box: Optional[List[int]] = None  # [x, y, w, h]
    quality: QualityCheckResult
    note: str
