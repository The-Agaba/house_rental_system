from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models import Favorite, UserRole
from app.schemas.favorite import FavoriteCreate
from app.services.favorite_service import add_favorite

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("")
def create(payload: FavoriteCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != UserRole.tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can add favorites")
    favorite = add_favorite(db, current_user, payload.property_id)
    return {"id": favorite.id, "property_id": favorite.property_id}


@router.get("")
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rows = db.query(Favorite).filter(Favorite.tenant_id == current_user.id).all()
    return [{"id": item.id, "property_id": item.property_id} for item in rows]
