from datetime import datetime

from pydantic import BaseModel, Field

from app.models import PropertyStatus
from app.schemas.common import ORMBase, PaginatedResponse


class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10)
    location: str = Field(min_length=2, max_length=150)
    price: float = Field(gt=0)
    number_of_rooms: int = Field(gt=0)
    status: PropertyStatus = PropertyStatus.available


class PropertyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=150)
    description: str | None = Field(default=None, min_length=10)
    location: str | None = Field(default=None, min_length=2, max_length=150)
    price: float | None = Field(default=None, gt=0)
    number_of_rooms: int | None = Field(default=None, gt=0)
    status: PropertyStatus | None = None


class PropertyImageOut(ORMBase):
    id: int
    file_path: str


class PropertyOut(ORMBase):
    id: int
    title: str
    description: str
    location: str
    price: float
    number_of_rooms: int
    status: PropertyStatus
    landlord_id: int
    created_at: datetime
    images: list[PropertyImageOut] = []


class PropertyListResponse(PaginatedResponse):
    items: list[PropertyOut]
