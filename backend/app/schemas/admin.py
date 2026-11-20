from typing import Optional, Dict, Any
from pydantic import BaseModel

class SystemConfigUpdate(BaseModel):
    pad_threshold: Optional[float] = None
    face_match_threshold: Optional[float] = None
    min_face_resolution: Optional[int] = None
    blur_threshold: Optional[float] = None

class DiagnosticsResponse(BaseModel):
    system_status: str
    pad_model_loaded: bool
    pad_model_name: str
    pad_model_path: str
    onnx_providers: list
    database_status: str
    total_users: int
    total_templates: int
    total_logs: int
    uptime_seconds: float
