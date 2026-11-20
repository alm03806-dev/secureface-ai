from typing import Optional, List, Dict
from pydantic import BaseModel

class VerifyJsonRequest(BaseModel):
    image_base64: str
    claimed_username: Optional[str] = None

class EnrollJsonRequest(BaseModel):
    image_base64: str
    consent: bool

class EnrollResponse(BaseModel):
    success: bool
    message: str
    user_id: int
    username: str
    enrolled_at: str
    template_dim: int
    attack_score: float
    pad_verdict: str
    face_box: Optional[List[int]] = None

class MatchedUserInfo(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    email: str

class VerifyResponse(BaseModel):
    verified: bool
    status: str  # VERIFIED, SPOOF_REJECTED, IDENTITY_MISMATCH, NO_FACE, MULTI_FACE, QUALITY_FAIL
    pad_verdict: str
    attack_score: float
    pad_threshold: float
    match_score: Optional[float] = None
    match_threshold: float
    matched_user: Optional[MatchedUserInfo] = None
    face_box: Optional[List[int]] = None
    message: str
    log_id: Optional[int] = None
