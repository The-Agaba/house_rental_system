from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models import User, UserRole
from app.schemas.admin import AdminStatsOut
from app.schemas.user import UserOut, UserStatusUpdate
from app.services.admin_service import get_stats

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    return db.query(User).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = payload.status
    user.is_active = payload.status != "suspended"
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/stats", response_model=AdminStatsOut)
def stats(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    return get_stats(db)
