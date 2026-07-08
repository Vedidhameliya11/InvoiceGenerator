import re

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from database import db

router = APIRouter()


class CustomerIn(BaseModel):
    shop_id: str
    name: str = Field(..., min_length=1)
    address: str = ""
    contact_no: str = ""


def _serialize(customer) -> dict:
    return {
        "id": str(customer["_id"]),
        "name": customer["name"],
        "address": customer.get("address", ""),
        "contact_no": customer.get("contact_no", ""),
    }


@router.get("/customers/lookup")
async def lookup_customer(shop_id: str = Query(...), name: str = Query(...)):
    """Used by the Add Invoice form: as the shop owner types a customer
    name, the frontend calls this to see if that customer already exists
    for this shop, so it can auto-fill their address/contact number."""
    clean_name = name.strip()
    if not clean_name:
        return {"found": False}

    customer = await db.customers.find_one(
        {
            "shop_id": shop_id,
            "name": {"$regex": f"^{re.escape(clean_name)}$", "$options": "i"},
        }
    )

    if not customer:
        return {"found": False}

    return {"found": True, "customer": _serialize(customer)}


@router.get("/customers")
async def list_customers(shop_id: str = Query(...)):
    cursor = db.customers.find({"shop_id": shop_id}).sort("name", 1)
    return [_serialize(c) async for c in cursor]


@router.post("/customers")
async def create_customer(payload: CustomerIn):
    """Used by the '+ Add New Customer' popup when a typed name doesn't
    match any existing customer for this shop."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Customer name is required.")

    existing = await db.customers.find_one(
        {
            "shop_id": payload.shop_id,
            "name": {"$regex": f"^{re.escape(clean_name)}$", "$options": "i"},
        }
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="A customer with this name already exists."
        )

    doc = {
        "shop_id": payload.shop_id,
        "name": clean_name,
        "address": payload.address.strip(),
        "contact_no": payload.contact_no.strip(),
    }
    result = await db.customers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)