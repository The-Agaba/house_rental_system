from sqlalchemy.orm import Session

from app.models import Booking, Property, User


def get_stats(db: Session) -> dict[str, int]:
    return {
        "total_users": db.query(User).count(),
        "total_properties": db.query(Property).count(),
        "total_bookings": db.query(Booking).count(),
    }
