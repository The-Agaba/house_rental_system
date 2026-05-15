from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.schemas.booking import BookingCreate, BookingOut, BookingUpdate
from app.services.booking_service import create_booking, list_bookings, update_booking_status

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingOut)
def create(payload: BookingCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_booking(db, payload.property_id, current_user)


@router.get("", response_model=list[BookingOut])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_bookings(db, current_user)


@router.put("/{booking_id}", response_model=BookingOut)
def update(booking_id: int, payload: BookingUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return update_booking_status(db, booking_id, payload.status, current_user)
