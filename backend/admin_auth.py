import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")


class AdminLoginIn(BaseModel):
    email: str
    password: str


@router.post("/admin-login")
async def admin_login(payload: AdminLoginIn):
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Admin credentials are not configured on the server.",
        )

    if payload.email.strip().lower() != ADMIN_EMAIL.lower() or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    return {"status": "success", "role": "admin"}
