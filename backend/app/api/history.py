from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.biometric import BiometricTemplate
from backend.app.models.verification_log import VerificationLog
from backend.app.schemas.history import VerificationLogOut, HistoryResponse, StatsSummary, DailyActivity
from backend.app.api.deps import get_current_user_optional

router = APIRouter(prefix="/history", tags=["Verification History & Analytics"])

@router.get("", response_model=HistoryResponse)
def get_verification_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    verdict: Optional[str] = Query(None, description="Filter by PAD verdict: LIVE or SPOOF"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(VerificationLog)
    if verdict:
        query = query.filter(VerificationLog.pad_verdict == verdict.upper())
    if status_filter:
        query = query.filter(VerificationLog.status == status_filter.upper())

    total = query.count()
    items = query.order_by(desc(VerificationLog.timestamp)).offset(offset).limit(limit).all()

    return HistoryResponse(
        total=total,
        items=[VerificationLogOut.model_validate(item) for item in items]
    )

@router.get("/stats", response_model=StatsSummary)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(VerificationLog).count()
    live_cnt = db.query(VerificationLog).filter(VerificationLog.pad_verdict == "LIVE").count()
    spoof_cnt = db.query(VerificationLog).filter(VerificationLog.pad_verdict == "SPOOF").count()
    verified_cnt = db.query(VerificationLog).filter(VerificationLog.is_verified == True).count()
    rejected_cnt = total - verified_cnt
    
    spoof_rate = (spoof_cnt / total * 100.0) if total > 0 else 0.0
    active_users = db.query(User).filter(User.is_active == True).count()
    active_templates = db.query(BiometricTemplate).filter(BiometricTemplate.is_active == True).count()

    # Daily trend for the past 7 days
    now = datetime.now(timezone.utc)
    daily_trend: List[DailyActivity] = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_logs = db.query(VerificationLog).filter(
            VerificationLog.timestamp >= day_start,
            VerificationLog.timestamp < day_end
        ).all()
        
        day_total = len(day_logs)
        day_live = sum(1 for l in day_logs if l.pad_verdict == "LIVE")
        day_spoof = sum(1 for l in day_logs if l.pad_verdict == "SPOOF")
        day_verified = sum(1 for l in day_logs if l.is_verified)

        daily_trend.append(DailyActivity(
            date=day_start.strftime("%b %d"),
            total=day_total,
            live=day_live,
            spoof=day_spoof,
            verified=day_verified
        ))

    latest_logs = db.query(VerificationLog).order_by(desc(VerificationLog.timestamp)).limit(10).all()

    return StatsSummary(
        total_verifications=total,
        live_count=live_cnt,
        spoof_count=spoof_cnt,
        verified_count=verified_cnt,
        spoof_rejection_rate=round(spoof_rate, 2),
        active_registered_users=active_users,
        active_biometric_templates=active_templates,
        daily_trend=daily_trend,
        latest_logs=[VerificationLogOut.model_validate(l) for l in latest_logs]
    )
