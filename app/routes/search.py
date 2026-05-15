from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import PropertyStatus
from app.schemas.property import PropertyListResponse
from app.services.property_service import list_properties

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=PropertyListResponse)
def search_properties(
    location: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    price: float | None = Query(default=None, ge=0, description="Alias for max_price"),
    rooms: int | None = Query(default=None, ge=1),
    availability: PropertyStatus | None = None,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    upper_price = max_price if max_price is not None else price
    items, total = list_properties(
        db=db,
        page=page,
        size=size,
        location=location,
        min_price=min_price,
        max_price=upper_price,
        rooms=rooms,
        status_filter=availability,
    )
    return {"items": items, "total": total, "page": page, "size": size}
