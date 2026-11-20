from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class BiometricTemplate(Base):
    __tablename__ = "biometric_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    encrypted_embedding = Column(Text, nullable=False)
    embedding_dim = Column(Integer, default=128, nullable=False)
    consent_recorded = Column(Boolean, default=True, nullable=False)
    consent_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="biometric_template")
