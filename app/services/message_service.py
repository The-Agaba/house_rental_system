from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Message, Property, User


def send_message(db: Session, sender: User, receiver_id: int, content: str, property_id: int | None = None) -> Message:
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")

    if property_id and not db.query(Property).filter(Property.id == property_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    message = Message(sender_id=sender.id, receiver_id=receiver_id, content=content, property_id=property_id)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
