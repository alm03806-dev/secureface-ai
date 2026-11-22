from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.core.config import settings
from backend.app.models.user import User
from backend.app.models.biometric import BiometricTemplate
from backend.app.schemas.auth import UserRegister, UserLogin, Token, UserOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_username = user_in.username.strip()
    clean_email = user_in.email.strip().lower()

    # Check if username or email already exists (case-insensitive)
    if db.query(User).filter(func.lower(User.username) == clean_username.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )
    if db.query(User).filter(func.lower(User.email) == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # First user can be made admin if matching settings, else user_in.role
    assigned_role = user_in.role or "user"
    if db.query(User).count() == 0:
        assigned_role = "admin"

    user = User(
        username=clean_username,
        email=clean_email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=assigned_role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "user_id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user_id": user.id
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    identifier = user_in.username.strip().lower()
    # Support login with either username or email (case-insensitive)
    user = db.query(User).filter(
        or_(func.lower(User.username) == identifier, func.lower(User.email) == identifier)
    ).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated."
        )

    token = create_access_token({"sub": user.username, "user_id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user_id": user.id
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(BiometricTemplate).filter(
        BiometricTemplate.user_id == current_user.id,
        BiometricTemplate.is_active == True
    ).first()
    
    return UserOut(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        has_biometric_template=template is not None,
        created_at=current_user.created_at
    )
