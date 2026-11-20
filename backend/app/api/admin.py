import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.user import User
from backend.app.models.biometric import BiometricTemplate
from backend.app.models.verification_log import VerificationLog
from backend.app.models.system_setting import SystemSetting
from backend.app.schemas.auth import UserOut
from backend.app.schemas.admin import SystemConfigUpdate, DiagnosticsResponse
from backend.app.services.pad_service import pad_service
from backend.app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Management & Diagnostics"])
START_TIME = time.time()

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    users = db.query(User).order_by(desc(User.created_at)).all()
    results = []
    for u in users:
        has_template = db.query(BiometricTemplate).filter(
            BiometricTemplate.user_id == u.id,
            BiometricTemplate.is_active == True
        ).first() is not None
        results.append(UserOut(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            has_biometric_template=has_template,
            created_at=u.created_at
        ))
    return results

@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    db.commit()
    return {"success": True, "user_id": user.id, "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User '{user.username}' deleted."}

@router.get("/settings")
def get_system_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return {
        "pad_threshold": settings.PAD_THRESHOLD,
        "face_match_threshold": settings.FACE_MATCH_THRESHOLD,
        "blur_threshold": settings.BLUR_THRESHOLD,
        "min_face_resolution": settings.MIN_FACE_RESOLUTION,
        "pad_model_path": settings.PAD_MODEL_PATH,
        "pad_image_size": settings.PAD_IMAGE_SIZE,
        "pad_mean": settings.PAD_MEAN,
        "pad_std": settings.PAD_STD
    }

@router.put("/settings")
def update_system_settings(
    update_data: SystemConfigUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if update_data.pad_threshold is not None:
        settings.PAD_THRESHOLD = update_data.pad_threshold
        pad_service.threshold = update_data.pad_threshold
    if update_data.face_match_threshold is not None:
        settings.FACE_MATCH_THRESHOLD = update_data.face_match_threshold
    if update_data.blur_threshold is not None:
        settings.BLUR_THRESHOLD = update_data.blur_threshold
    if update_data.min_face_resolution is not None:
        settings.MIN_FACE_RESOLUTION = update_data.min_face_resolution

    return {
        "success": True,
        "updated_settings": {
            "pad_threshold": settings.PAD_THRESHOLD,
            "face_match_threshold": settings.FACE_MATCH_THRESHOLD,
            "blur_threshold": settings.BLUR_THRESHOLD,
            "min_face_resolution": settings.MIN_FACE_RESOLUTION
        }
    }

@router.get("/diagnostics", response_model=DiagnosticsResponse)
def get_diagnostics(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    providers = pad_service.session.get_providers() if pad_service.session else ["OpenCV_DNN_CPU"]
    total_users = db.query(User).count()
    total_templates = db.query(BiometricTemplate).count()
    total_logs = db.query(VerificationLog).count()
    uptime = time.time() - START_TIME

    return DiagnosticsResponse(
        system_status="HEALTHY",
        pad_model_loaded=(pad_service.session is not None) or (pad_service.net is not None),
        pad_model_name=f"MobileNetV3-Large ONNX ({pad_service.engine})",
        pad_model_path=pad_service.model_path or "Unknown",
        onnx_providers=providers,
        database_status="CONNECTED",
        total_users=total_users,
        total_templates=total_templates,
        total_logs=total_logs,
        uptime_seconds=round(uptime, 2)
    )
