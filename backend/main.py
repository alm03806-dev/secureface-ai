import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import engine, SessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.services.pad_service import pad_service
from backend.app.services.face_detection_service import face_detection_service
from backend.app.services.face_embedding_service import face_embedding_service
from backend.app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("secureface")

def init_database_and_admin():
    """Initializes tables and creates default admin account if not present."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == settings.DEFAULT_ADMIN_USERNAME).first()
        if not admin:
            logger.info(f"Creating default admin account '{settings.DEFAULT_ADMIN_USERNAME}'...")
            admin = User(
                username=settings.DEFAULT_ADMIN_USERNAME,
                email=settings.DEFAULT_ADMIN_EMAIL,
                full_name="SecureFace Root Administrator",
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin created successfully.")
    except Exception as e:
        logger.error(f"Error during admin seed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    init_database_and_admin()
    # Prewarm services
    try:
        _ = pad_service.session or pad_service.net
        logger.info(f"PAD ONNX Engine online via {pad_service.engine}.")
    except Exception as e:
        logger.warning(f"PAD prewarm note: {e}")
        
    yield
    logger.info("Shutting down SECUREFACE AI backend.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Futuristic Face Verification and Presentation Attack Detection (Anti-Spoofing) System",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "pad_model": "MobileNetV3-Large ONNX",
        "pad_threshold": settings.PAD_THRESHOLD,
        "match_threshold": settings.FACE_MATCH_THRESHOLD,
        "database": "sqlite/sqlalchemy"
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Welcome to SECUREFACE AI API Server",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_prefix": settings.API_PREFIX
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
