from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class MessageCreate(BaseModel):
    receiver_id: int
    property_id: int | None = None
    content: str = Field(min_length=1, max_length=1500)


class MessageOut(ORMBase):
    id: int
    sender_id: int
    receiver_id: int
    property_id: int | None
    content: str
    created_at: datetime
