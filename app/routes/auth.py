from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserOut
from app.services.auth_service import login_user, logout_user, register_user

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@router.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, payload)


@router.post("/login", response_model=TokenResponse)
@router.post("/auth/login", response_model=TokenResponse, include_in_schema=False)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token, user = login_user(db, payload)
    return TokenResponse(access_token=token, user=user)


@router.post("/logout")
@router.post("/auth/logout", include_in_schema=False)
def logout(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    logout_user(db, jti)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
@router.get("/auth/me", response_model=UserOut, include_in_schema=False)
def me(current_user=Depends(get_current_user)):
    return current_user
