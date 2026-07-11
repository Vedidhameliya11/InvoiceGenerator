from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from database import db

router = APIRouter()


class ProductIn(BaseModel):
    shop_id: str
    name: str = Field(..., min_length=1)
    details: str = ""
    price: float = Field(..., ge=0)


class ProductUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    details: str = ""
    price: float = Field(..., ge=0)


def _serialize(product) -> dict:
    return {
        "id": str(product["_id"]),
        "name": product["name"],
        "details": product.get("details", ""),
        "price": product.get("price", 0),
    }


@router.get("/products")
async def list_products(shop_id: str = Query(...)):
    cursor = db.products.find({"shop_id": shop_id}).sort("name", 1)
    return [_serialize(p) async for p in cursor]


@router.post("/products")
async def create_product(payload: ProductIn):
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Product name is required.")

    doc = {
        "shop_id": payload.shop_id,
        "name": clean_name,
        "details": payload.details.strip(),
        "price": payload.price,
    }
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductUpdate):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid product id")

    existing = await db.products.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Product name is required.")

    await db.products.update_one(
        {"_id": oid},
        {
            "$set": {
                "name": clean_name,
                "details": payload.details.strip(),
                "price": payload.price,
            }
        },
    )

    updated = await db.products.find_one({"_id": oid})
    return _serialize(updated)


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid product id")

    result = await db.products.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"status": "deleted"}