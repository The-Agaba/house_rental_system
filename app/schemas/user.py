from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models import UserRole, UserStatus
from app.schemas.common import ORMBase


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class UserOut(ORMBase):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    is_active: bool
    created_at: datetime


class UserStatusUpdate(BaseModel):
    status: UserStatus
