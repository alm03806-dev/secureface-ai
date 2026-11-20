from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class VerificationLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    claimed_identifier: Optional[str] = None
    detected_identity: Optional[str] = None
    pad_verdict: str
    attack_score: float
    threshold: float
    match_score: Optional[float] = None
    is_verified: bool
    status: str
    timestamp: datetime
    client_ip: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    total: int
    items: List[VerificationLogOut]

class DailyActivity(BaseModel):
    date: str
    total: int
    live: int
    spoof: int
    verified: int

class StatsSummary(BaseModel):
    total_verifications: int
    live_count: int
    spoof_count: int
    verified_count: int
    spoof_rejection_rate: float
    active_registered_users: int
    active_biometric_templates: int
    daily_trend: List[DailyActivity]
    latest_logs: List[VerificationLogOut]
