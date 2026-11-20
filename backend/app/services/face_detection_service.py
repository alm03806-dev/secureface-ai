"""Face Detection & Quality Service.
Provides high-accuracy single-face detection using OpenCV YuNet DNN with
Haar Cascade fallback, multi-face rejection, bounding box extraction,
and image quality checks (sharpness via Laplacian variance, minimum resolution).
Uses pretrained OpenCV inference only (zero training).
"""
import logging
from pathlib import Path
from typing import Tuple, Optional, List, Dict, Any
import cv2
import numpy as np
from PIL import Image
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class FaceDetectionService:
    def __init__(self):
        # 1. Primary: YuNet DNN face detector
        self.yunet_model_path = ROOT_DIR / "backend" / "models" / "face_detection_yunet.onnx"
        self.yunet_detector = None
        self._init_yunet()

        # 2. Secondary fallback: OpenCV's Haar Cascade
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        logger.info("FaceDetectionService initialized with YuNet DNN and Haar Cascade fallback.")

    def _init_yunet(self, width: int = 320, height: int = 320):
        if self.yunet_model_path.exists():
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    str(self.yunet_model_path),
                    "",
                    (width, height),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=10
                )
            except Exception as e:
                logger.warning(f"Could not load YuNet model: {e}. Falling back to Haar Cascade.")
                self.yunet_detector = None

    def detect_faces_yunet(self, image_bgr: np.ndarray) -> Optional[np.ndarray]:
        """Runs YuNet detection. Returns raw face detections array or None."""
        if self.yunet_detector is None:
            return None
        h, w = image_bgr.shape[:2]
        self.yunet_detector.setInputSize((w, h))
        _, faces = self.yunet_detector.detect(image_bgr)
        return faces

    def detect_faces_haar(self, image_bgr: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Fallback Haar Cascade face detection."""
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        gray_eq = cv2.equalizeHist(gray)
        faces = self.face_cascade.detectMultiScale(
            gray_eq,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(settings.MIN_FACE_RESOLUTION, settings.MIN_FACE_RESOLUTION),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]

    def check_blur(self, face_bgr: np.ndarray) -> float:
        """Calculates blur metric using the variance of the Laplacian."""
        if face_bgr is None or face_bgr.size == 0:
            return 0.0
        gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return float(laplacian_var)

    def analyze_frame(self, pil_image: Image.Image) -> Dict[str, Any]:
        """Comprehensive analysis of input image:
        - Detects human faces (YuNet / Haar fallback)
        - Enforces single-face constraint
        - Computes blur and resolution metrics
        - Returns face box, raw face data (for alignment), and cropped face
        """
        rgb_arr = np.array(pil_image.convert("RGB"))
        bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
        h_img, w_img = bgr_arr.shape[:2]

        # 1. Attempt YuNet detection
        yunet_faces = self.detect_faces_yunet(bgr_arr)
        
        detected_box = None
        face_info_for_alignment = None
        num_faces = 0

        if yunet_faces is not None and len(yunet_faces) > 0:
            # Filter low confidence if any
            valid_faces = [f for f in yunet_faces if f[-1] >= 0.55]
            num_faces = len(valid_faces)
            if num_faces == 1:
                f = valid_faces[0]
                detected_box = [int(f[0]), int(f[1]), int(f[2]), int(f[3])]
                face_info_for_alignment = f
        else:
            # Fallback to Haar Cascade
            haar_faces = self.detect_faces_haar(bgr_arr)
            num_faces = len(haar_faces)
            if num_faces == 1:
                detected_box = list(haar_faces[0])

        if num_faces == 0:
            return {
                "status": "NO_FACE",
                "face_detected": False,
                "face_count": 0,
                "face_box": None,
                "face_raw_info": None,
                "face_crop": None,
                "quality": {
                    "passed": False,
                    "blur_score": 0.0,
                    "face_resolution": None,
                    "issues": ["No human face detected in frame. Please center your face inside the biometric reticle."]
                }
            }

        if num_faces > 1:
            return {
                "status": "MULTI_FACE",
                "face_detected": True,
                "face_count": num_faces,
                "face_box": detected_box,
                "face_raw_info": None,
                "face_crop": None,
                "quality": {
                    "passed": False,
                    "blur_score": 0.0,
                    "face_resolution": None,
                    "issues": [f"Multiple faces detected ({num_faces}). Security policy strictly permits only one person at a time."]
                }
            }

        # Single face detected
        x, y, w, h = detected_box
        # Bound coordinates to image dimensions
        x = max(0, x)
        y = max(0, y)
        w = min(w, w_img - x)
        h = min(h, h_img - y)

        # Context padding
        pad_x = int(0.12 * w)
        pad_y = int(0.18 * h)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w_img, x + w + pad_x)
        y2 = min(h_img, y + h + pad_y)

        face_crop_bgr = bgr_arr[y1:y2, x1:x2]
        blur_score = self.check_blur(face_crop_bgr)
        
        quality_issues = []
        if w < settings.MIN_FACE_RESOLUTION or h < settings.MIN_FACE_RESOLUTION:
            quality_issues.append(f"Face resolution ({w}x{h}px) below threshold ({settings.MIN_FACE_RESOLUTION}px). Move closer.")

        if blur_score < settings.BLUR_THRESHOLD:
            quality_issues.append(f"Defocus or motion blur detected (score: {blur_score:.1f}, threshold: {settings.BLUR_THRESHOLD}). Hold steady.")

        quality_passed = len(quality_issues) == 0

        face_crop_rgb = cv2.cvtColor(face_crop_bgr, cv2.COLOR_BGR2RGB)
        face_crop_pil = Image.fromarray(face_crop_rgb)

        return {
            "status": "SUCCESS" if quality_passed else "QUALITY_FAIL",
            "face_detected": True,
            "face_count": 1,
            "face_box": [x, y, w, h],
            "face_raw_info": face_info_for_alignment,
            "face_crop": face_crop_pil,
            "face_crop_bgr": face_crop_bgr,
            "bgr_frame": bgr_arr,
            "quality": {
                "passed": quality_passed,
                "blur_score": round(blur_score, 2),
                "face_resolution": [w, h],
                "issues": quality_issues
            }
        }

face_detection_service = FaceDetectionService()
