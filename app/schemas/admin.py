from pydantic import BaseModel


class AdminStatsOut(BaseModel):
    total_users: int
    total_properties: int
    total_bookings: int
