from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.schemas.pad import PADResponse, PADJsonRequest
from backend.app.services.pad_service import pad_service
from backend.app.services.face_detection_service import face_detection_service
from backend.app.api.utils import parse_image_upload

router = APIRouter(prefix="/pad", tags=["Presentation Attack Detection"])

@router.post("/predict", response_model=PADResponse)
def predict_anti_spoofing(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None)
):
    """Executes Presentation Attack Detection (PAD) inference using the
    trained MobileNetV3-Large ONNX model.
    Checks face detection and image quality metrics.
    """
    image = parse_image_upload(file=file, base64_image=image_base64)
    face_analysis = face_detection_service.analyze_frame(image)
    pad_result = pad_service.predict(image, face_box=face_analysis["face_box"])

    return PADResponse(
        label=pad_result["label"],
        attack_score=pad_result["attack_score"],
        threshold=pad_result["threshold"],
        is_live=pad_result["is_live"],
        model_scores=pad_result["model_scores"],
        face_detected=face_analysis["face_detected"],
        face_box=face_analysis["face_box"],
        quality=face_analysis["quality"],
        note=pad_result["note"]
    )

@router.post("/predict-json", response_model=PADResponse)
def predict_anti_spoofing_json(payload: PADJsonRequest):
    """JSON-based endpoint convenient for high-frequency frontend webcam streams."""
    image = parse_image_upload(base64_image=payload.image_base64)
    face_analysis = face_detection_service.analyze_frame(image)
    pad_result = pad_service.predict(image, face_box=face_analysis["face_box"])

    return PADResponse(
        label=pad_result["label"],
        attack_score=pad_result["attack_score"],
        threshold=pad_result["threshold"],
        is_live=pad_result["is_live"],
        model_scores=pad_result["model_scores"],
        face_detected=face_analysis["face_detected"],
        face_box=face_analysis["face_box"],
        quality=face_analysis["quality"],
        note=pad_result["note"]
    )
