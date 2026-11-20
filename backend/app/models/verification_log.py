from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    claimed_identifier = Column(String(100), nullable=True)
    detected_identity = Column(String(100), nullable=True)
    pad_verdict = Column(String(20), nullable=False)  # "LIVE", "SPOOF", "ERROR"
    attack_score = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    match_score = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    status = Column(String(40), nullable=False)  # SUCCESS, SPOOF_REJECTED, NO_FACE, MULTI_FACE, MISMATCH, QUALITY_FAIL
    client_ip = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="verification_logs")
