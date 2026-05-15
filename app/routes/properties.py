from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models import PropertyStatus, UserRole
from app.schemas.property import PropertyCreate, PropertyListResponse, PropertyOut, PropertyUpdate
from app.services.property_service import (
    add_property_images,
    create_property,
    delete_property,
    get_property_or_404,
    list_properties,
    update_property,
)
from app.utils.file_upload import save_upload_files

router = APIRouter(prefix="/properties", tags=["Properties"])
settings = get_settings()


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create(payload: PropertyCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.landlord))):
    return create_property(db, payload, current_user)


@router.get("", response_model=PropertyListResponse)
def list_all(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    location: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    rooms: int | None = Query(default=None, ge=1),
    availability: PropertyStatus | None = None,
    db: Session = Depends(get_db),
):
    items, total = list_properties(db, page, size, location, min_price, max_price, rooms, availability)
    return {"items": items, "total": total, "page": page, "size": size}


@router.get("/{property_id}", response_model=PropertyOut)
def get_one(property_id: int, db: Session = Depends(get_db)):
    return get_property_or_404(db, property_id)


@router.put("/{property_id}", response_model=PropertyOut)
def update(
    property_id: int,
    payload: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prop = get_property_or_404(db, property_id)
    if current_user.role != UserRole.admin and prop.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this property")
    return update_property(db, prop, payload)


@router.delete("/{property_id}")
def delete(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    prop = get_property_or_404(db, property_id)
    if current_user.role != UserRole.admin and prop.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this property")
    delete_property(db, prop)
    return {"message": "Property deleted"}


@router.post("/{property_id}/images", response_model=PropertyOut)
def upload_images(
    property_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    prop = get_property_or_404(db, property_id)
    if current_user.role != UserRole.admin and prop.landlord_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to upload images")
    paths = save_upload_files(files, settings.upload_dir)
    return add_property_images(db, prop, paths)
