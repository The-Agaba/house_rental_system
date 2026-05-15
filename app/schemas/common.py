from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(ORMBase):
    total: int
    page: int
    size: int
