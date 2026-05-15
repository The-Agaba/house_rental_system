from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Favorite, Property, User


def add_favorite(db: Session, tenant: User, property_id: int) -> Favorite:
    if not db.query(Property).filter(Property.id == property_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    existing = db.query(Favorite).filter(Favorite.tenant_id == tenant.id, Favorite.property_id == property_id).first()
    if existing:
        return existing
    favorite = Favorite(tenant_id=tenant.id, property_id=property_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return favorite
