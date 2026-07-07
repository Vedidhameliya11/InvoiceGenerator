import os
import secrets
import string
import smtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from bson.errors import InvalidId

from database import db

router = APIRouter()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")


# ---------- Models ----------

class ShopIn(BaseModel):
    owner_name: str
    email: EmailStr
    contact_no: str
    shop_name: str
    shop_address: str


class ShopOut(BaseModel):
    id: str
    owner_name: str
    email: EmailStr
    contact_no: str
    shop_name: str
    shop_address: str
    status: str  # "pending" or "approved"


def serialize(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "owner_name": doc["owner_name"],
        "email": doc["email"],
        "contact_no": doc["contact_no"],
        "shop_name": doc["shop_name"],
        "shop_address": doc["shop_address"],
        "status": doc["status"],
    }


# ---------- Helpers ----------

def generate_password(length: int = 10) -> str:
    """Generate a random, readable password (letters + digits, at least
    one of each) for a newly approved shop owner."""
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.isdigit() for c in pwd) and any(c.isalpha() for c in pwd):
            return pwd


def hash_password(plain: str) -> str:
    import bcrypt
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def send_email(to_email: str, subject: str, body: str):
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email sending is not configured on the server (missing EMAIL_ADDRESS / EMAIL_APP_PASSWORD in .env).",
        )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_APP_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, [to_email], msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")


def send_registration_received_email(to_email: str, owner_name: str, shop_name: str):
    subject = "We received your shop registration"
    body = (
        f"Hi {owner_name},\n\n"
        f"Thanks for registering \"{shop_name}\" with Invoice App.\n\n"
        f"Your registration is now pending review. You'll receive another "
        f"email with your login details as soon as an admin approves your account.\n\n"
        f"Thanks,\nInvoice App Team"
    )
    send_email(to_email, subject, body)


def send_approval_email(to_email: str, owner_name: str, shop_name: str, password: str):
    subject = "Your shop has been approved!"
    body = (
        f"Hi {owner_name},\n\n"
        f"Your shop \"{shop_name}\" has been approved.\n\n"
        f"You can now log in with the following credentials:\n"
        f"Email: {to_email}\n"
        f"Password: {password}\n\n"
        f"Please log in and change your password after your first login.\n\n"
        f"Thanks,\nInvoice App Team"
    )
    send_email(to_email, subject, body)


async def approve_shop_doc(oid: ObjectId) -> dict:
    """Shared approval logic: generate password, hash + store it, mark
    the shop approved, and email the plaintext password to the owner."""
    doc = await db.shops.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Shop not found")

    plain_password = generate_password()
    hashed = hash_password(plain_password)

    await db.shops.update_one(
        {"_id": oid},
        {"$set": {"status": "approved", "password_hash": hashed}},
    )

    send_approval_email(doc["email"], doc["owner_name"], doc["shop_name"], plain_password)

    updated = await db.shops.find_one({"_id": oid})
    return serialize(updated)


# ---------- Routes ----------

@router.post("/register", response_model=ShopOut)
async def public_register(shop: ShopIn):
    """Public endpoint used by the shop-owner Register page. Always
    creates the shop as 'pending' — only an admin approval can promote it."""
    doc = shop.model_dump()
    doc["email"] = shop.email.strip().lower()
    doc["status"] = "pending"
    result = await db.shops.insert_one(doc)
    created = await db.shops.find_one({"_id": result.inserted_id})

    send_registration_received_email(shop.email, shop.owner_name, shop.shop_name)

    return serialize(created)


class ShopLoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/shop-login")
async def shop_login(payload: ShopLoginIn):
    """Real login check for shop owners: must be an APPROVED shop whose
    password matches the one that was generated + emailed at approval time."""
    import bcrypt

    doc = await db.shops.find_one({"email": payload.email.strip().lower()})

    if not doc or doc.get("status") != "approved" or "password_hash" not in doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.checkpw(payload.password.encode(), doc["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "status": "success",
        "role": "user",
        "shop": serialize(doc),
    }


@router.get("/admin/shops", response_model=list[ShopOut])
async def list_shops():
    cursor = db.shops.find().sort("_id", -1)
    return [serialize(doc) async for doc in cursor]


@router.post("/admin/shops", response_model=ShopOut)
async def create_shop(shop: ShopIn, approve: bool = False):
    """Create a new shop record.
    - approve=false (default, used by the Save button): saved as 'pending', no email sent.
    - approve=true (used by the Approve button): saved, then immediately
      approved — password generated and emailed right away.
    """
    doc = shop.model_dump()
    doc["email"] = shop.email.strip().lower()
    doc["status"] = "pending"
    result = await db.shops.insert_one(doc)

    if approve:
        return await approve_shop_doc(result.inserted_id)

    created = await db.shops.find_one({"_id": result.inserted_id})
    return serialize(created)


@router.post("/admin/shops/{shop_id}/approve", response_model=ShopOut)
async def approve_shop(shop_id: str):
    """Approve an already-saved (pending) shop from the list view."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    return await approve_shop_doc(oid)


@router.delete("/admin/shops/{shop_id}")
async def delete_shop(shop_id: str):
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    result = await db.shops.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")

    return {"status": "deleted"}
