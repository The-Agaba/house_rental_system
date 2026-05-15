from datetime import datetime

from pydantic import BaseModel

from app.models import BookingStatus
from app.schemas.common import ORMBase
from app.schemas.property import PropertyOut


class BookingCreate(BaseModel):
    property_id: int


class BookingUpdate(BaseModel):
    status: BookingStatus


class BookingOut(ORMBase):
    booking_id: int
    tenant_id: int
    property_id: int
    request_date: datetime
    status: BookingStatus
    property: PropertyOut | None = None
