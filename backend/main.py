from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from templates import (
    generate_classic,
    generate_modern,
    generate_corporate,
    generate_minimal,
    generate_premium,
)

from database import db
from routes import router as template_router
from admin_auth import router as admin_router
from admin_shops import router as admin_shops_router
from customers import router as customers_router

app = FastAPI()

import os

# Comma-separated list of allowed frontend origins. Locally this defaults
# to your Vite dev server ports. In production (Vercel), set
# ALLOWED_ORIGINS in the backend project's Environment Variables to your
# deployed frontend URL, e.g. https://your-frontend-project.vercel.app
default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
allowed_origins = os.getenv("ALLOWED_ORIGINS", default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(template_router)
app.include_router(admin_router)
app.include_router(admin_shops_router)
app.include_router(customers_router)


class Invoice(BaseModel):
    organizationName: str
    customerName: str
    productName: str
    productPrice: float
    productQuantity: int
    template: str
    font: Optional[str] = "Helvetica"
    color: Optional[str] = "#2563EB"


@app.get("/")
async def home():
    try:
        await db.command("ping")
        return {"status": "success", "message": "MongoDB Connected Successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/generate-pdf")
def generate_pdf(invoice: Invoice):

    if invoice.template == "classic":
        return generate_classic(invoice)

    elif invoice.template == "modern":
        return generate_modern(invoice)

    elif invoice.template == "corporate":
        return generate_corporate(invoice)

    elif invoice.template == "minimal":
        return generate_minimal(invoice)

    elif invoice.template == "premium":
        return generate_premium(invoice)

    else:
        return generate_classic(invoice)