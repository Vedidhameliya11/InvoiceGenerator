from fastapi import APIRouter, HTTPException
from bson import ObjectId

from database import db
from models import TemplateIn, TemplateOut

router = APIRouter()


def serialize(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "template": doc["template"],
        "pricing": doc["pricing"],
        "price": doc.get("price"),
        "status": doc["status"],
        "font": doc.get("font", "Helvetica"),
        "color": doc.get("color", "#2563EB"),
    }


@router.get("/templates", response_model=list[TemplateOut])
async def list_templates():
    cursor = db.templates.find().sort("_id", -1)
    templates = [serialize(doc) async for doc in cursor]
    return templates


@router.post("/templates", response_model=TemplateOut)
async def create_template(template: TemplateIn):
    result = await db.templates.insert_one(template.model_dump())
    doc = await db.templates.find_one({"_id": result.inserted_id})
    return serialize(doc)


@router.put("/templates/{template_id}", response_model=TemplateOut)
async def update_template(template_id: str, template: TemplateIn):
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template id")

    result = await db.templates.update_one(
        {"_id": oid}, {"$set": template.model_dump()}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")

    doc = await db.templates.find_one({"_id": oid})
    return serialize(doc)


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    try:
        oid = ObjectId(template_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid template id")

    result = await db.templates.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"message": "Template deleted"}
