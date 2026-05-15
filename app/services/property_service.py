from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.models import Property, PropertyImage, PropertyStatus, User, UserRole
from app.schemas.property import PropertyCreate, PropertyUpdate


def create_property(db: Session, payload: PropertyCreate, landlord: User) -> Property:
    if landlord.role != UserRole.landlord:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only landlords can add properties")

    prop = Property(**payload.model_dump(), landlord_id=landlord.id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


def get_property_or_404(db: Session, property_id: int) -> Property:
    prop = (
        db.query(Property)
        .options(joinedload(Property.images))
        .filter(Property.id == property_id)
        .first()
    )
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return prop


def update_property(db: Session, prop: Property, payload: PropertyUpdate) -> Property:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop


def delete_property(db: Session, prop: Property) -> None:
    db.delete(prop)
    db.commit()


def list_properties(
    db: Session, page: int, size: int, location: str | None = None, min_price: float | None = None,
    max_price: float | None = None, rooms: int | None = None, status_filter: PropertyStatus | None = None
) -> tuple[list[Property], int]:
    query = db.query(Property).options(joinedload(Property.images))

    filters = []
    if location:
        filters.append(Property.location.ilike(f"%{location}%"))
    if min_price is not None:
        filters.append(Property.price >= min_price)
    if max_price is not None:
        filters.append(Property.price <= max_price)
    if rooms is not None:
        filters.append(Property.number_of_rooms == rooms)
    if status_filter:
        filters.append(Property.status == status_filter)

    if filters:
        query = query.filter(and_(*filters))

    total = query.count()
    items = (
        query.order_by(Property.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return items, total


def add_property_images(db: Session, prop: Property, file_paths: list[str]) -> Property:
    for path in file_paths:
        db.add(PropertyImage(property_id=prop.id, file_path=path))
    db.commit()
    db.refresh(prop)
    return prop
