from datetime import datetime, timezone
from collections import OrderedDict

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from database import db

router = APIRouter()


class InvoiceItemIn(BaseModel):
    name: str
    price: float
    quantity: float


class InvoiceRecordIn(BaseModel):
    shop_id: str
    organizationName: str
    customerName: str
    items: list[InvoiceItemIn] = Field(..., min_length=1)
    gstPercent: float = 0
    template: str = ""
    grandTotal: float


def _serialize(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "shop_id": doc["shop_id"],
        "organizationName": doc.get("organizationName", ""),
        "customerName": doc.get("customerName", ""),
        "items": doc.get("items", []),
        "gstPercent": doc.get("gstPercent", 0),
        "template": doc.get("template", ""),
        "grandTotal": doc.get("grandTotal", 0),
        "generatedAt": doc["generatedAt"].isoformat()
        if isinstance(doc.get("generatedAt"), datetime)
        else doc.get("generatedAt"),
    }


def _last_n_months(n: int):
    """Ordered dict of the last n month keys ('YYYY-MM') -> label,
    oldest first, ending with the current month."""
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month

    months = OrderedDict()
    for i in range(n - 1, -1, -1):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        key = f"{y:04d}-{m:02d}"
        label = datetime(y, m, 1).strftime("%b %Y")
        months[key] = {"month": label, "count": 0, "revenue": 0.0}
    return months


def _month_key(dt: datetime) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"


# ---------- Routes ----------
# NOTE: shop_id is always required for shop-owner-facing endpoints so that
# a shop only ever sees invoices it created — never another shop's data.

@router.post("/invoices")
async def create_invoice(payload: InvoiceRecordIn):
    doc = payload.model_dump()
    doc["generatedAt"] = datetime.now(timezone.utc)
    result = await db.invoices.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/invoices")
async def list_invoices(shop_id: str = Query(...)):
    cursor = db.invoices.find({"shop_id": shop_id}).sort("generatedAt", -1)
    return [_serialize(doc) async for doc in cursor]


@router.get("/invoices/stats")
async def shop_invoice_stats(shop_id: str = Query(...)):
    """Dashboard card + chart data for a single shop owner — scoped
    strictly to their own shop_id, never anyone else's invoices."""
    cursor = db.invoices.find({"shop_id": shop_id})
    invoices = [doc async for doc in cursor]

    months = _last_n_months(6)
    total_revenue = 0.0

    for inv in invoices:
        total_revenue += inv.get("grandTotal", 0) or 0
        generated_at = inv.get("generatedAt")
        if isinstance(generated_at, datetime):
            key = _month_key(generated_at)
            if key in months:
                months[key]["count"] += 1
                months[key]["revenue"] += inv.get("grandTotal", 0) or 0

    return {
        "total_invoices": len(invoices),
        "total_revenue": round(total_revenue, 2),
        "monthly": list(months.values()),
    }


@router.get("/admin/invoices/stats")
async def admin_invoice_stats():
    """Dashboard card + chart data for the admin — aggregated across
    ALL shops, broken down per shop so the admin can compare them."""
    shops_cursor = db.shops.find()
    shops = {str(s["_id"]): s.get("shop_name", "Unnamed shop") async for s in shops_cursor}

    invoices_cursor = db.invoices.find()
    invoices = [doc async for doc in invoices_cursor]

    months = _last_n_months(6)
    total_revenue = 0.0
    per_shop = {}

    for inv in invoices:
        shop_id = inv.get("shop_id")
        total_revenue += inv.get("grandTotal", 0) or 0

        if shop_id not in per_shop:
            per_shop[shop_id] = {
                "shop_id": shop_id,
                "shop_name": shops.get(shop_id, "Unknown shop"),
                "count": 0,
                "revenue": 0.0,
            }
        per_shop[shop_id]["count"] += 1
        per_shop[shop_id]["revenue"] += inv.get("grandTotal", 0) or 0

        generated_at = inv.get("generatedAt")
        if isinstance(generated_at, datetime):
            key = _month_key(generated_at)
            if key in months:
                months[key]["count"] += 1
                months[key]["revenue"] += inv.get("grandTotal", 0) or 0

    by_shop = sorted(per_shop.values(), key=lambda s: s["revenue"], reverse=True)
    for s in by_shop:
        s["revenue"] = round(s["revenue"], 2)

    return {
        "total_shops": len(shops),
        "total_invoices": len(invoices),
        "total_revenue": round(total_revenue, 2),
        "monthly": list(months.values()),
        "by_shop": by_shop,
    }