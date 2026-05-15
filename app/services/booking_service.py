from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Booking, BookingStatus, Property, PropertyStatus, User, UserRole


def create_booking(db: Session, property_id: int, tenant: User) -> Booking:
    if tenant.role != UserRole.tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only tenants can book properties")

    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.status != PropertyStatus.available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Property is not available")

    booking = Booking(tenant_id=tenant.id, property_id=property_id)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def list_bookings(db: Session, user: User) -> list[Booking]:
    query = db.query(Booking).options(joinedload(Booking.property))
    if user.role == UserRole.tenant:
        return query.filter(Booking.tenant_id == user.id).all()
    if user.role == UserRole.landlord:
        return query.join(Property, Property.id == Booking.property_id).filter(Property.landlord_id == user.id).all()
    return query.all()


def update_booking_status(db: Session, booking_id: int, status_value: BookingStatus, actor: User) -> Booking:
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    prop = db.query(Property).filter(Property.id == booking.property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    if actor.role == UserRole.landlord and prop.landlord_id != actor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify this booking")
    if actor.role == UserRole.tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenants cannot update booking status")

    booking.status = status_value
    if status_value == BookingStatus.approved:
        prop.status = PropertyStatus.rented
    db.commit()
    db.refresh(booking)
    return booking
