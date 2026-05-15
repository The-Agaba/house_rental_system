from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id", ondelete="CASCADE"), index=True)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)

    property = relationship("Property", back_populates="images")
