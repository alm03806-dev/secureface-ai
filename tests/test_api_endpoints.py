import io
import uuid
import pytest
from PIL import Image
import numpy as np

from backend.main import app, health_check, root, init_database_and_admin
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.schemas.auth import UserRegister, UserLogin
from backend.app.schemas.pad import PADJsonRequest
from backend.app.schemas.biometric import EnrollJsonRequest, VerifyJsonRequest
from backend.app.api.auth import register, login, get_me
from backend.app.api.pad import predict_anti_spoofing_json
from backend.app.api.biometrics import enroll_biometric, verify_biometric, delete_biometric_template
from backend.app.api.history import get_verification_history, get_dashboard_stats
from backend.app.api.admin import get_system_settings, get_diagnostics
from backend.app.models.user import User
import base64

def create_test_image_b64():
    im = Image.new("RGB", (250, 250), color=(180, 180, 180))
    bio = io.BytesIO()
    im.save(bio, format="JPEG")
    return base64.b64encode(bio.getvalue()).decode("ascii")

def test_database_and_admin_init():
    init_database_and_admin()
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        assert admin is not None
        assert admin.role == "admin"
    finally:
        db.close()

def test_health_and_root_endpoints():
    h = health_check()
    assert h["status"] == "online"
    assert h["pad_threshold"] == settings.PAD_THRESHOLD

    r = root()
    assert "message" in r

def test_auth_flow_direct():
    db = SessionLocal()
    try:
        rand_user = f"user_{uuid.uuid4().hex[:8]}"
        reg_payload = UserRegister(
            username=rand_user,
            email=f"{rand_user}@secureface.ai",
            password="SecurePassword2026!",
            full_name="Direct Test User"
        )
        token_out = register(reg_payload, db=db)
        assert token_out["username"] == rand_user
        assert token_out["access_token"] is not None

        login_payload = UserLogin(username=rand_user, password="SecurePassword2026!")
        login_out = login(login_payload, db=db)
        assert login_out["username"] == rand_user

        user_db = db.query(User).filter(User.username == rand_user).first()
        me_out = get_me(current_user=user_db, db=db)
        assert me_out.username == rand_user
        assert me_out.has_biometric_template is False
    finally:
        db.close()

def test_pad_prediction_json():
    img_b64 = create_test_image_b64()
    req = PADJsonRequest(image_base64=img_b64)
    res = predict_anti_spoofing_json(req)
    assert res.label in ("LIVE", "SPOOF")
    assert res.threshold == settings.PAD_THRESHOLD
    assert 0.0 <= res.attack_score <= 1.0

def test_history_and_stats_endpoints():
    db = SessionLocal()
    try:
        hist = get_verification_history(limit=10, offset=0, verdict=None, status_filter=None, db=db)
        assert hasattr(hist, "total")
        assert hasattr(hist, "items")

        stats = get_dashboard_stats(db=db)
        assert hasattr(stats, "total_verifications")
        assert hasattr(stats, "spoof_rejection_rate")
        assert len(stats.daily_trend) == 7
    finally:
        db.close()

def test_admin_settings_and_diagnostics():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        settings_res = get_system_settings(db=db, admin=admin_user)
        assert settings_res["pad_threshold"] == settings.PAD_THRESHOLD
        assert settings_res["face_match_threshold"] == 0.60

        diag = get_diagnostics(db=db, admin=admin_user)
        assert diag.system_status == "HEALTHY"
        assert diag.pad_model_loaded is True
    finally:
        db.close()
