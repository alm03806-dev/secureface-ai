from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
import numpy as np

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import encrypt_embedding, decrypt_embedding
from backend.app.models.user import User
from backend.app.models.biometric import BiometricTemplate
from backend.app.models.verification_log import VerificationLog
from backend.app.schemas.biometric import (
    EnrollResponse, VerifyResponse, MatchedUserInfo, EnrollJsonRequest, VerifyJsonRequest
)
from backend.app.services.pad_service import pad_service
from backend.app.services.face_detection_service import face_detection_service
from backend.app.services.face_embedding_service import face_embedding_service
from backend.app.api.deps import get_current_user, get_current_user_optional
from backend.app.api.utils import parse_image_upload

router = APIRouter(prefix="/biometrics", tags=["Biometric Verification"])

@router.post("/enroll", response_model=EnrollResponse)
def enroll_biometric(
    payload: EnrollJsonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enrolls a user's facial biometric template:
    1. Validates explicit biometric consent.
    2. Enforces single-face detection and quality criteria.
    3. Runs MobileNetV3 PAD inference (attacks/spoofs rejected).
    4. Extracts 128-D face embedding vector using pretrained SFace.
    5. Encrypts template vector with AES-256 (Fernet) before storing.
    6. Raw face image is NEVER saved to disk or database.
    """
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Biometric enrollment requires explicit user consent."
        )

    image = parse_image_upload(base64_image=payload.image_base64)

    # 1. Face detection & quality assessment
    face_analysis = face_detection_service.analyze_frame(image)
    if face_analysis["status"] == "NO_FACE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected. Please ensure your face is clearly visible inside the guide."
        )
    if face_analysis["status"] == "MULTI_FACE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiple faces detected. Biometric enrollment requires strictly one person in view."
        )
    if not face_analysis["quality"]["passed"]:
        issues = "; ".join(face_analysis["quality"]["issues"])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image quality issue: {issues}"
        )

    # 2. Strict Presentation Attack Detection (Anti-Spoofing)
    pad_result = pad_service.predict(image, face_box=face_analysis["face_box"])
    if pad_result["label"] == "SPOOF":
        # Log failed attempt
        log = VerificationLog(
            user_id=current_user.id,
            claimed_identifier=current_user.username,
            pad_verdict="SPOOF",
            attack_score=pad_result["attack_score"],
            threshold=pad_result["threshold"],
            is_verified=False,
            status="SPOOF_REJECTED",
            notes=f"Enrollment spoof attack rejected (attack score: {pad_result['attack_score']:.4f})"
        )
        db.add(log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Biometric enrollment rejected: Presentation attack detected (score: {pad_result['attack_score']:.4f})."
        )

    # 3. Extract 128-D Pretrained Embedding Vector
    embedding = face_embedding_service.extract_embedding(
        bgr_frame=face_analysis["bgr_frame"],
        face_raw_info=face_analysis["face_raw_info"],
        face_crop_bgr=face_analysis["face_crop_bgr"]
    )

    # 4. Encrypt Vector & Save to Database (Zero Raw Image Persistence)
    encrypted_vector = encrypt_embedding(embedding)

    existing_template = db.query(BiometricTemplate).filter(
        BiometricTemplate.user_id == current_user.id
    ).first()

    now = datetime.now(timezone.utc)
    if existing_template:
        existing_template.encrypted_embedding = encrypted_vector
        existing_template.embedding_dim = len(embedding)
        existing_template.consent_recorded = True
        existing_template.consent_timestamp = now
        existing_template.enrolled_at = now
        existing_template.is_active = True
    else:
        new_template = BiometricTemplate(
            user_id=current_user.id,
            encrypted_embedding=encrypted_vector,
            embedding_dim=len(embedding),
            consent_recorded=True,
            consent_timestamp=now,
            enrolled_at=now,
            is_active=True
        )
        db.add(new_template)

    # Log successful enrollment event
    log = VerificationLog(
        user_id=current_user.id,
        claimed_identifier=current_user.username,
        pad_verdict="LIVE",
        attack_score=pad_result["attack_score"],
        threshold=pad_result["threshold"],
        is_verified=True,
        status="ENROLLED",
        notes="Biometric template enrolled and encrypted successfully."
    )
    db.add(log)
    db.commit()

    return EnrollResponse(
        success=True,
        message="Biometric template securely enrolled with full encryption.",
        user_id=current_user.id,
        username=current_user.username,
        enrolled_at=now.isoformat(),
        template_dim=len(embedding),
        attack_score=pad_result["attack_score"],
        pad_verdict=pad_result["label"],
        face_box=face_analysis["face_box"]
    )

@router.post("/verify", response_model=VerifyResponse)
def verify_biometric(
    payload: VerifyJsonRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Executes full face verification pipeline:
    1. Single-face detection and multi-face rejection.
    2. Strict Presentation Attack Detection with trained MobileNetV3 model.
    3. Facial embedding extraction and cosine similarity comparison against
       encrypted templates (1:1 or 1:N).
    4. Comprehensive audit log recording.
    """
    client_ip = request.client.host if request.client else "unknown"
    image = parse_image_upload(base64_image=payload.image_base64)

    # 1. Face detection & quality assessment
    face_analysis = face_detection_service.analyze_frame(image)
    if face_analysis["status"] == "NO_FACE":
        log = VerificationLog(
            claimed_identifier=payload.claimed_username,
            pad_verdict="UNKNOWN",
            attack_score=0.0,
            threshold=settings.PAD_THRESHOLD,
            is_verified=False,
            status="NO_FACE",
            client_ip=client_ip,
            notes="No face found in camera frame."
        )
        db.add(log)
        db.commit()
        return VerifyResponse(
            verified=False,
            status="NO_FACE",
            pad_verdict="UNKNOWN",
            attack_score=0.0,
            pad_threshold=settings.PAD_THRESHOLD,
            match_score=None,
            match_threshold=settings.FACE_MATCH_THRESHOLD,
            face_box=None,
            message="No face detected. Please position face in scanner frame.",
            log_id=log.id
        )

    if face_analysis["status"] == "MULTI_FACE":
        log = VerificationLog(
            claimed_identifier=payload.claimed_username,
            pad_verdict="UNKNOWN",
            attack_score=0.0,
            threshold=settings.PAD_THRESHOLD,
            is_verified=False,
            status="MULTI_FACE",
            client_ip=client_ip,
            notes=f"Multiple faces detected ({face_analysis['face_count']})."
        )
        db.add(log)
        db.commit()
        return VerifyResponse(
            verified=False,
            status="MULTI_FACE",
            pad_verdict="UNKNOWN",
            attack_score=0.0,
            pad_threshold=settings.PAD_THRESHOLD,
            match_score=None,
            match_threshold=settings.FACE_MATCH_THRESHOLD,
            face_box=face_analysis["face_box"],
            message=f"Multiple faces detected ({face_analysis['face_count']}). Single individual required.",
            log_id=log.id
        )

    # 2. Strict Presentation Attack Detection (PAD)
    pad_result = pad_service.predict(image, face_box=face_analysis["face_box"])
    if pad_result["label"] == "SPOOF":
        log = VerificationLog(
            claimed_identifier=payload.claimed_username,
            pad_verdict="SPOOF",
            attack_score=pad_result["attack_score"],
            threshold=pad_result["threshold"],
            is_verified=False,
            status="SPOOF_REJECTED",
            client_ip=client_ip,
            notes=f"Presentation attack detected! Score: {pad_result['attack_score']:.4f} >= {pad_result['threshold']}"
        )
        db.add(log)
        db.commit()
        return VerifyResponse(
            verified=False,
            status="SPOOF_REJECTED",
            pad_verdict="SPOOF",
            attack_score=pad_result["attack_score"],
            pad_threshold=pad_result["threshold"],
            match_score=None,
            match_threshold=settings.FACE_MATCH_THRESHOLD,
            face_box=face_analysis["face_box"],
            message="SECURITY ALERT: Presentation attack (spoof) detected! Verification blocked.",
            log_id=log.id
        )

    # 3. Extract candidate embedding
    candidate_embedding = face_embedding_service.extract_embedding(
        bgr_frame=face_analysis["bgr_frame"],
        face_raw_info=face_analysis["face_raw_info"],
        face_crop_bgr=face_analysis["face_crop_bgr"]
    )

    # 4. Identity Matching (1:1 or 1:N)
    templates = db.query(BiometricTemplate).filter(BiometricTemplate.is_active == True).all()
    if not templates:
        log = VerificationLog(
            claimed_identifier=payload.claimed_username,
            pad_verdict="LIVE",
            attack_score=pad_result["attack_score"],
            threshold=pad_result["threshold"],
            is_verified=False,
            status="NO_TEMPLATES_ENROLLED",
            client_ip=client_ip,
            notes="No biometric templates enrolled in system."
        )
        db.add(log)
        db.commit()
        return VerifyResponse(
            verified=False,
            status="NO_TEMPLATES_ENROLLED",
            pad_verdict="LIVE",
            attack_score=pad_result["attack_score"],
            pad_threshold=pad_result["threshold"],
            match_score=None,
            match_threshold=settings.FACE_MATCH_THRESHOLD,
            face_box=face_analysis["face_box"],
            message="No enrolled biometric templates found in system. Please enroll first.",
            log_id=log.id
        )

    best_similarity = -1.0
    matched_template: Optional[BiometricTemplate] = None

    if payload.claimed_username:
        claimed_user = db.query(User).filter(User.username == payload.claimed_username.strip()).first()
        if not claimed_user or not claimed_user.biometric_template:
            log = VerificationLog(
                claimed_identifier=payload.claimed_username,
                pad_verdict="LIVE",
                attack_score=pad_result["attack_score"],
                threshold=pad_result["threshold"],
                is_verified=False,
                status="USER_NOT_ENROLLED",
                client_ip=client_ip,
                notes=f"Claimed user '{payload.claimed_username}' not enrolled."
            )
            db.add(log)
            db.commit()
            return VerifyResponse(
                verified=False,
                status="USER_NOT_ENROLLED",
                pad_verdict="LIVE",
                attack_score=pad_result["attack_score"],
                pad_threshold=pad_result["threshold"],
                match_score=None,
                match_threshold=settings.FACE_MATCH_THRESHOLD,
                face_box=face_analysis["face_box"],
                message=f"Claimed identity '{payload.claimed_username}' has no active biometric enrollment.",
                log_id=log.id
            )
        enrolled_vec = decrypt_embedding(claimed_user.biometric_template.encrypted_embedding)
        sim = face_embedding_service.compute_cosine_similarity(candidate_embedding, enrolled_vec)
        best_similarity = sim
        if sim >= settings.FACE_MATCH_THRESHOLD:
            matched_template = claimed_user.biometric_template
    else:
        for t in templates:
            enrolled_vec = decrypt_embedding(t.encrypted_embedding)
            sim = face_embedding_service.compute_cosine_similarity(candidate_embedding, enrolled_vec)
            if sim > best_similarity:
                best_similarity = sim
                if sim >= settings.FACE_MATCH_THRESHOLD:
                    matched_template = t

    is_verified = (matched_template is not None) and (best_similarity >= settings.FACE_MATCH_THRESHOLD)
    matched_user_info = None
    target_user_id = None
    detected_name = None

    if is_verified and matched_template and matched_template.user:
        target_user_id = matched_template.user.id
        detected_name = matched_template.user.username
        matched_user_info = MatchedUserInfo(
            user_id=matched_template.user.id,
            username=matched_template.user.username,
            full_name=matched_template.user.full_name,
            email=matched_template.user.email
        )

    status_str = "VERIFIED" if is_verified else "IDENTITY_MISMATCH"
    msg = (
        f"Verification successful: Identity confirmed as '{detected_name}' (Cosine Sim: {best_similarity:.4f})"
        if is_verified
        else f"Identity mismatch: Cosine similarity {best_similarity:.4f} is below verification threshold {settings.FACE_MATCH_THRESHOLD:.2f}"
    )

    log = VerificationLog(
        user_id=target_user_id,
        claimed_identifier=payload.claimed_username,
        detected_identity=detected_name,
        pad_verdict="LIVE",
        attack_score=pad_result["attack_score"],
        threshold=pad_result["threshold"],
        match_score=best_similarity,
        is_verified=is_verified,
        status=status_str,
        client_ip=client_ip,
        notes=msg
    )
    db.add(log)
    db.commit()

    return VerifyResponse(
        verified=is_verified,
        status=status_str,
        pad_verdict="LIVE",
        attack_score=pad_result["attack_score"],
        pad_threshold=pad_result["threshold"],
        match_score=best_similarity,
        match_threshold=settings.FACE_MATCH_THRESHOLD,
        matched_user=matched_user_info,
        face_box=face_analysis["face_box"],
        message=msg,
        log_id=log.id
    )

@router.delete("/template/{user_id}", status_code=status.HTTP_200_OK)
def delete_biometric_template(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete biometric templates belonging to other users."
        )

    template = db.query(BiometricTemplate).filter(BiometricTemplate.user_id == user_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biometric template not found."
        )

    db.delete(template)
    
    log = VerificationLog(
        user_id=user_id,
        pad_verdict="UNKNOWN",
        attack_score=0.0,
        threshold=settings.PAD_THRESHOLD,
        is_verified=False,
        status="TEMPLATE_PURGED",
        notes=f"Biometric template purged by user {current_user.username} (id: {current_user.id})."
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": "Biometric template securely and irreversibly purged."}
