import os
import secrets
import string
import smtplib
import bcrypt
from datetime import datetime, timezone
from email.mime.text import MIMEText

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from bson.errors import InvalidId

from database import db
from notifications import create_notification

router = APIRouter()

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_APP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")
# Optional: used to build a "Log in now" link in emails. Set FRONTEND_URL
# in the backend's environment variables to your deployed frontend URL.
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
# Where "new update" notification emails (new shop signups, etc.) are
# sent to the admin. Falls back to ADMIN_EMAIL (the admin login email)
# if a separate notify address isn't set.
ADMIN_NOTIFY_EMAIL = os.getenv("ADMIN_NOTIFY_EMAIL") or os.getenv("ADMIN_EMAIL")


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


class ShopLoginIn(BaseModel):
    email: EmailStr
    password: str


class ShopProfileUpdate(BaseModel):
    owner_name: str
    email: EmailStr
    shop_name: str


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
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
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


def send_admin_new_signup_email(
    shop_email: str, owner_name: str, shop_name: str, contact_no: str, shop_address: str
):
    """Notification email to the ADMIN whenever a new shop signs up and
    is waiting for approval. Best-effort — never blocks or fails the
    registration itself if SMTP isn't configured or the send fails."""
    if not ADMIN_NOTIFY_EMAIL:
        print("[admin notify skipped - no ADMIN_NOTIFY_EMAIL / ADMIN_EMAIL configured]")
        return

    signed_up_at = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
    review_line = f"Review it here: {FRONTEND_URL}\n\n" if FRONTEND_URL else ""

    subject = f"🔔 New shop registration: {shop_name}"
    body = (
        f"A new shop just signed up and is waiting for your approval.\n\n"
        f"Shop name:   {shop_name}\n"
        f"Owner name:  {owner_name}\n"
        f"Email:       {shop_email}\n"
        f"Contact no:  {contact_no}\n"
        f"Address:     {shop_address}\n"
        f"Signed up:   {signed_up_at}\n\n"
        f"{review_line}"
        f"Log in to the admin dashboard to approve or reject this shop.\n\n"
        f"— Invoice App"
    )
    _send_email(ADMIN_NOTIFY_EMAIL, subject, body)


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

    send_approval_email(doc["email"], doc["owner_name"], doc["shop_name"], plain_password)

    updated = await db.shops.find_one({"_id": oid})
    return serialize(updated)


# ---------- Routes ----------

@router.post("/register", response_model=ShopOut)
async def public_register(shop: ShopIn):
    """Public endpoint used by the shop-owner Register page. Always
    creates the shop as 'pending' — only an admin approval can promote it."""
    doc = shop.model_dump()
    doc["status"] = "pending"
    result = await db.shops.insert_one(doc)
    created = await db.shops.find_one({"_id": result.inserted_id})

    # Best-effort confirmation email to the shop owner — registration
    # still succeeds even if this fails (e.g. SMTP not configured yet).
    send_registration_email(shop.email, shop.owner_name, shop.shop_name)

    # Best-effort "new update" notification to the admin, so they know
    # a new shop is waiting for approval without having to keep checking.
    send_admin_new_signup_email(
        shop.email, shop.owner_name, shop.shop_name, shop.contact_no, shop.shop_address
    )
    await create_notification(
        type_="new_shop",
        title=f"New shop signed up: {shop.shop_name}",
        message=f"{shop.owner_name} ({shop.email}) is waiting for approval.",
        meta={"shop_id": str(result.inserted_id), "shop_name": shop.shop_name},
    )

    return serialize(created)


@router.post("/login", response_model=dict)
async def shop_login(payload: ShopLoginIn):
    """Real shop-owner login. Checks the email/password against the
    shop record created at registration + approval time."""
    doc = await db.shops.find_one({"email": payload.email.strip().lower()})

    # Emails are stored as submitted at registration; fall back to a
    # case-insensitive match if an exact lowercase match isn't found.
    if not doc:
        doc = await db.shops.find_one(
            {"email": {"$regex": f"^{payload.email.strip()}$", "$options": "i"}}
        )

    if not doc or not doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if doc["status"] != "approved":
        raise HTTPException(
            status_code=403,
            detail="Your account is still pending approval. Please wait for an approval email.",
        )

    if not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"status": "success", "role": "user", "shop": serialize(doc)}


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