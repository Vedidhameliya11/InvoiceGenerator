import os
import re
import secrets
import string
import smtplib
import bcrypt
from typing import Optional
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from bson import ObjectId
from bson.errors import InvalidId

from database import db

router = APIRouter()

# Only these email domains are accepted for shop-owner accounts.
ALLOWED_EMAIL_DOMAINS = {"gmail.com", "yahoo.com"}


def _validate_owner_name(value: str) -> str:
    cleaned = value.strip()
    if len(cleaned) < 2:
        raise ValueError("Owner name should have at least 2 characters")
    return cleaned


def _validate_shop_email(value: EmailStr) -> str:
    domain = str(value).split("@")[-1].lower()
    if domain not in ALLOWED_EMAIL_DOMAINS:
        raise ValueError("Email format invalid")
    return str(value).strip().lower()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")
ADMIN_NOTIFY_EMAIL = os.getenv("ADMIN_NOTIFY_EMAIL") or os.getenv("ADMIN_EMAIL")
# Deployed frontend URL for emails
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://invoice-generator-ozot.vercel.app")


# ---------- Models ----------

class ShopIn(BaseModel):
    owner_name: str
    email: EmailStr
    contact_no: str
    shop_name: str
    shop_address: str

    _validate_owner_name = field_validator("owner_name")(_validate_owner_name)
    _validate_email_domain = field_validator("email")(_validate_shop_email)


class ShopOut(BaseModel):
    id: str
    owner_name: str
    email: EmailStr
    contact_no: str
    shop_name: str
    shop_address: str
    status: str  # "pending" or "approved"


class ShopLoginIn(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class ShopProfileUpdate(BaseModel):
    owner_name: str
    email: EmailStr
    shop_name: str

    _validate_owner_name = field_validator("owner_name")(_validate_owner_name)
    _validate_email_domain = field_validator("email")(_validate_shop_email)


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
    """Generate a random, readable password for a newly approved shop owner.
    Avoids visually ambiguous characters (like 0, O, 1, l, I) so it is
    easy to read and type accurately from an email."""
    alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.isdigit() for c in pwd) and any(c.islower() for c in pwd) and any(c.isupper() for c in pwd):
            return pwd


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.strip().encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.strip().encode("utf-8"), hashed.strip().encode("utf-8"))
    except Exception:
        return False


def _send_email(to_email: str, subject: str, body: str):
    """Low-level helper: sends a plain-text email, or silently no-ops
    (logging instead of raising) when email isn't configured, so that
    endpoints which email as a side-effect (e.g. registration) don't
    break the primary action just because SMTP isn't set up yet."""
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        print(f"[email skipped - not configured] to={to_email} subject={subject!r}")
        return

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
        print(f"[email failed] to={to_email} subject={subject!r} error={e}")


def send_registration_email(to_email: str, owner_name: str, shop_name: str):
    """Sent immediately after someone submits the Register form, just to
    confirm we received it. This is best-effort: if it fails, the
    registration itself should still succeed."""
    subject = "We've received your registration"
    body = (
        f"Hi {owner_name},\n\n"
        f"Thanks for registering \"{shop_name}\" with Invoice App!\n\n"
        f"Your details have been received and are now waiting for admin "
        f"approval. This usually doesn't take long — we'll send you a "
        f"second email with your login password as soon as your shop is "
        f"approved.\n\n"
        f"No action is needed from you right now.\n\n"
        f"Thanks,\nInvoice App Team"
    )
    _send_email(to_email, subject, body)


def send_approval_email(to_email: str, owner_name: str, shop_name: str, password: str):
    if not EMAIL_ADDRESS or not EMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email sending is not configured on the server (missing EMAIL_ADDRESS / EMAIL_APP_PASSWORD in .env).",
        )

    login_line = (
        f"Log in here: {FRONTEND_URL}\n\n" if FRONTEND_URL else ""
    )

    subject = "You're approved! Here's how to log in"
    body = (
        f"Hi {owner_name},\n\n"
        f"Great news — your shop \"{shop_name}\" has been approved and is "
        f"ready to go.\n\n"
        f"Here are your login details:\n"
        f"  Email:    {to_email}\n"
        f"  Password: {password}\n\n"
        f"{login_line}"
        f"For security, we recommend changing this password the first "
        f"time you log in.\n\n"
        f"If you didn't request this account, please ignore this email "
        f"or contact us.\n\n"
        f"Thanks,\nInvoice App Team"
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

    # Also synchronize password_hash to ANY other shop docs with this email
    # so the candidate can log in without conflicting with previous records
    email_clean = (doc.get("email") or "").strip().lower()
    if email_clean:
        await db.shops.update_many(
            {"email": {"$regex": f"^{re.escape(email_clean)}$", "$options": "i"}},
            {"$set": {"status": "approved", "password_hash": hashed}},
        )

    send_approval_email(doc["email"], doc["owner_name"], doc["shop_name"], plain_password)
    print(f"[SHOP APPROVED] id={oid} email={doc['email']} password={plain_password}")

    updated = await db.shops.find_one({"_id": oid})
    return serialize(updated)


# ---------- Routes ----------

@router.post("/register", response_model=ShopOut)
async def public_register(shop: ShopIn):
    """Public endpoint used by the shop-owner Register page. Always
    creates the shop as 'pending' — only an admin approval can promote it."""
    email_clean = str(shop.email).strip().lower()
    contact_clean = str(shop.contact_no).strip()

    doc = shop.model_dump()
    doc["owner_name"] = shop.owner_name.strip()
    doc["email"] = email_clean
    doc["contact_no"] = contact_clean
    doc["shop_name"] = shop.shop_name.strip()
    doc["shop_address"] = shop.shop_address.strip()
    doc["status"] = "pending"

    existing = await db.shops.find_one(
        {"email": {"$regex": f"^{re.escape(email_clean)}$", "$options": "i"}}
    )

    if existing:
        await db.shops.update_one({"_id": existing["_id"]}, {"$set": doc})
        created = await db.shops.find_one({"_id": existing["_id"]})
    else:
        result = await db.shops.insert_one(doc)
        created = await db.shops.find_one({"_id": result.inserted_id})

    # Best-effort confirmation email — registration still succeeds even
    # if this fails (e.g. SMTP not configured yet).
    send_registration_email(shop.email, shop.owner_name, shop.shop_name)

    return serialize(created)


@router.post("/login", response_model=dict)
async def shop_login(payload: ShopLoginIn):
    """Real shop-owner login. Checks the identifier (email or mobile) and password
    against the shop record created at registration + approval time."""
    ident = (payload.identifier or payload.email or "").strip()
    pwd = (payload.password or "").strip()

    if not ident or not pwd:
        raise HTTPException(status_code=400, detail="Please fill all fields.")

    ident_clean = ident.lower()
    phone_digits = "".join(c for c in ident if c.isdigit())

    or_conditions = [
        {"email": {"$regex": f"^{re.escape(ident_clean)}$", "$options": "i"}},
        {"contact_no": ident},
    ]
    if phone_digits:
        or_conditions.append({"contact_no": phone_digits})
        if len(phone_digits) == 10:
            or_conditions.append({"contact_no": f"+91{phone_digits}"})
            or_conditions.append({"contact_no": f"91{phone_digits}"})

    cursor = db.shops.find({"$or": or_conditions}).sort("_id", -1)
    matching = [doc async for doc in cursor]

    if not matching:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    approved_shops = [s for s in matching if s.get("status") == "approved"]

    if approved_shops:
        for shop_doc in approved_shops:
            pwd_hash = shop_doc.get("password_hash")
            if pwd_hash and verify_password(pwd, pwd_hash):
                return {"status": "success", "role": "user", "shop": serialize(shop_doc)}
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if any(s.get("status") == "pending" for s in matching):
        raise HTTPException(
            status_code=403,
            detail="Your account is still pending approval. Please wait for an approval email.",
        )

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/shops/{shop_id}", response_model=ShopOut)
async def get_shop(shop_id: str):
    """Fetch a single shop's current details — used by the Edit Profile
    screen so it always shows up-to-date data."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    doc = await db.shops.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Shop not found")

    return serialize(doc)


@router.put("/shops/{shop_id}/profile", response_model=ShopOut)
async def update_shop_profile(shop_id: str, payload: ShopProfileUpdate):
    """Shop-owner self-service profile update. Only owner_name, email,
    and shop_name are editable here — contact_no and shop_address are
    intentionally left out, matching the frontend's read-only fields."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    existing = await db.shops.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Shop not found")

    # Prevent taking over another shop's login email.
    conflict = await db.shops.find_one(
        {"email": payload.email, "_id": {"$ne": oid}}
    )
    if conflict:
        raise HTTPException(
            status_code=409, detail="That email is already used by another account."
        )

    await db.shops.update_one(
        {"_id": oid},
        {
            "$set": {
                "owner_name": payload.owner_name,
                "email": payload.email,
                "shop_name": payload.shop_name,
            }
        },
    )

    updated = await db.shops.find_one({"_id": oid})
    return serialize(updated)


@router.post("/shops/{shop_id}/change-password")
async def change_shop_password(shop_id: str, payload: ChangePasswordIn):
    """Allows an approved shop owner to change their account password."""
    try:
        oid = ObjectId(shop_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid shop id")

    doc = await db.shops.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Shop not found")

    stored_hash = doc.get("password_hash")
    if not stored_hash or not verify_password(payload.current_password, stored_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_pwd = payload.new_password.strip()
    if len(new_pwd) < 6:
        raise HTTPException(
            status_code=400, detail="New password must be at least 6 characters"
        )

    if payload.current_password == new_pwd:
        raise HTTPException(
            status_code=400,
            detail="New password cannot be the same as current password",
        )

    new_hash = hash_password(new_pwd)
    await db.shops.update_one({"_id": oid}, {"$set": {"password_hash": new_hash}})

    return {"status": "success", "message": "Password changed successfully"}


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