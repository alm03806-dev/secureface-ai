import base64
import io
from typing import Optional
from fastapi import UploadFile, HTTPException
from PIL import Image

def parse_image_from_bytes(data: bytes) -> Image.Image:
    if len(data) > 10_000_000:
        raise HTTPException(status_code=413, detail="Image size exceeds maximum 10MB limit.")
    try:
        bio = io.BytesIO(data)
        im = Image.open(bio)
        im.load()
        return im.convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image data: {str(e)}")

def parse_image_upload(file: Optional[UploadFile] = None, base64_image: Optional[str] = None) -> Image.Image:
    if file is not None:
        if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
            raise HTTPException(status_code=415, detail="Unsupported image format. Allowed: JPEG, PNG, WEBP.")
        content = file.file.read()
        return parse_image_from_bytes(content)
        
    if base64_image:
        try:
            if "," in base64_image:
                base64_image = base64_image.split(",", 1)[1]
            raw_bytes = base64.b64decode(base64_image)
            return parse_image_from_bytes(raw_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode base64 image: {str(e)}")

    raise HTTPException(status_code=400, detail="No image provided. Please provide an image file or base64 string.")
