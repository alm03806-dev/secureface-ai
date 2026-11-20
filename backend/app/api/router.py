from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.pad import router as pad_router
from backend.app.api.biometrics import router as biometrics_router
from backend.app.api.history import router as history_router
from backend.app.api.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(pad_router)
api_router.include_router(biometrics_router)
api_router.include_router(history_router)
api_router.include_router(admin_router)
