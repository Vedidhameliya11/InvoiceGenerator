from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from database import db
from admin_shops import _send_email

router = APIRouter()


class AnnouncementIn(BaseModel):
    title: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)


def _serialize(doc, unread: bool = False) -> dict:
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "message": doc.get("message", ""),
        "created_at": doc["created_at"].isoformat()
        if isinstance(doc.get("created_at"), datetime)
        else doc.get("created_at"),
        "emailed_count": doc.get("emailed_count", 0),
        "unread": unread,
    }


# ---------- Admin: compose + view sent history ----------

@router.post("/admin/announcements")
async def create_announcement(payload: AnnouncementIn):
    """Admin composes a new update/feature announcement. It's saved so
    every shop owner sees it in their own dashboard feed, AND is emailed
    to every currently-approved shop owner right away."""
    shops_cursor = db.shops.find({"status": "approved"})
    shops = [s async for s in shops_cursor]

    doc = {
        "title": payload.title.strip(),
        "message": payload.message.strip(),
        "created_at": datetime.now(timezone.utc),
        "emailed_count": len(shops),
    }
    result = await db.announcements.insert_one(doc)
    doc["_id"] = result.inserted_id

    subject = f"📢 {payload.title.strip()}"
    for shop in shops:
        body = (
            f"Hi {shop.get('owner_name', 'there')},\n\n"
            f"{payload.message.strip()}\n\n"
            f"— Invoice App Team"
        )
        _send_email(shop["email"], subject, body)

    return _serialize(doc)


@router.get("/admin/announcements")
async def list_announcements_admin(limit: int = Query(50, ge=1, le=200)):
    """History of updates the admin has sent, most recent first."""
    cursor = db.announcements.find().sort("created_at", -1).limit(limit)
    return [_serialize(doc) async for doc in cursor]


# ---------- Shop owner: read-only feed of what's new ----------

@router.get("/shop/announcements")
async def list_announcements_for_shop(
    shop_id: str = Query(...), limit: int = Query(30, ge=1, le=100)
):
    """Feed of updates for a shop owner to see inside their own
    dashboard, with an 'unread' flag based on when they last opened it."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    shop = await db.shops.find_one({"_id": oid})
    last_seen = shop.get("last_seen_announcements_at") if shop else None

    cursor = db.announcements.find().sort("created_at", -1).limit(limit)
    result = []
    async for doc in cursor:
        created_at = doc.get("created_at")
        unread = bool(
            isinstance(created_at, datetime)
            and (last_seen is None or created_at > last_seen)
        )
        result.append(_serialize(doc, unread=unread))
    return result


@router.get("/shop/announcements/unread-count")
async def unread_announcement_count(shop_id: str = Query(...)):
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    shop = await db.shops.find_one({"_id": oid})
    last_seen = shop.get("last_seen_announcements_at") if shop else None

    query = {"created_at": {"$gt": last_seen}} if last_seen else {}
    count = await db.announcements.count_documents(query)
    return {"unread_count": count}


@router.post("/shop/announcements/mark-seen")
async def mark_announcements_seen(shop_id: str = Query(...)):
    """Called when a shop owner opens the 'What's New' bell — records
    that moment so future unread counts are measured from here."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    await db.shops.update_one(
        {"_id": oid}, {"$set": {"last_seen_announcements_at": datetime.now(timezone.utc)}}
    )
    return {"status": "ok"}