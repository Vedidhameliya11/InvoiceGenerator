from pydantic import BaseModel
from typing import Optional


class TemplateIn(BaseModel):
    name: str
    template: str
    pricing: str
    price: Optional[float] = None
    status: str
    font: Optional[str] = "Helvetica"
    color: Optional[str] = "#2563EB"


class TemplateOut(TemplateIn):
    id: str


class ShopIn(BaseModel):
    ownerName: str
    email: str
    contactNo: str
    shopName: str
    shopAddress: str


class ShopOut(ShopIn):
    id: str
    status: str
