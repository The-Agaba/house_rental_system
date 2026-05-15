from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models import TokenBlocklist, User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate


def register_user(db: Session, payload: UserCreate) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, payload: LoginRequest) -> tuple[str, User]:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    return token, user


def logout_user(db: Session, jti: str) -> None:
    if db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first():
        return
    db.add(TokenBlocklist(jti=jti))
    db.commit()
