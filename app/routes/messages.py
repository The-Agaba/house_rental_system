from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models import Message
from app.schemas.message import MessageCreate, MessageOut
from app.services.message_service import send_message

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("", response_model=MessageOut)
def create(payload: MessageCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return send_message(db, current_user, payload.receiver_id, payload.content, payload.property_id)


@router.get("", response_model=list[MessageOut])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return (
        db.query(Message)
        .filter(or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id))
        .order_by(Message.created_at.desc())
        .all()
    )
