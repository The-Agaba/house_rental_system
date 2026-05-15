import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PropertyStatus(str, enum.Enum):
    available = "available"
    rented = "rented"
    unavailable = "unavailable"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    number_of_rooms: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    status: Mapped[PropertyStatus] = mapped_column(Enum(PropertyStatus), default=PropertyStatus.available, nullable=False)
    landlord_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    landlord = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="property", cascade="all, delete")
    favorites = relationship("Favorite", back_populates="property", cascade="all, delete")
