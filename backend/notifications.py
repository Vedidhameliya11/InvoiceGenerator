from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from bson.errors import InvalidId

from database import db

router = APIRouter()


def _serialize(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "type": doc.get("type", "info"),       # "new_shop" | "new_invoice" | "info"
        "title": doc.get("title", ""),
        "message": doc.get("message", ""),
        "meta": doc.get("meta", {}),
        "read": doc.get("read", False),
        "created_at": doc["created_at"].isoformat()
        if isinstance(doc.get("created_at"), datetime)
        else doc.get("created_at"),
    }


async def create_notification(type_: str, title: str, message: str, meta: dict | None = None):
    """Persist a notification record so the admin sees a live in-app feed
    of 'new updates' (new shop signups, new invoices, ...), on top of the
    email that's sent separately. Best-effort — never raises, so a DB
    hiccup here can never break the action that triggered it."""
    try:
        await db.notifications.insert_one(
            {
                "type": type_,
                "title": title,
                "message": message,
                "meta": meta or {},
                "read": False,
                "created_at": datetime.now(timezone.utc),
            }
        )
    except Exception as e:
        print(f"[notification save failed] {e}")


# ---------- Routes (admin-only feed) ----------

@router.get("/admin/notifications")
async def list_notifications(
    limit: int = Query(50, ge=1, le=200), unread_only: bool = False
):
    query = {"read": False} if unread_only else {}
    cursor = db.notifications.find(query).sort("created_at", -1).limit(limit)
    return [_serialize(doc) async for doc in cursor]


@router.get("/admin/notifications/unread-count")
async def unread_notification_count():
    count = await db.notifications.count_documents({"read": False})
    return {"unread_count": count}


@router.post("/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    try:
        oid = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid notification id")

    result = await db.notifications.update_one({"_id": oid}, {"$set": {"read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.post("/admin/notifications/read-all")
async def mark_all_notifications_read():
    await db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"status": "ok"}


@router.delete("/admin/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    try:
        oid = ObjectId(notification_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid notification id")

    result = await db.notifications.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "deleted"}