from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white, HexColor

PDF_PATH = "invoice.pdf"

BOLD_VARIANT = {
    "Helvetica": "Helvetica-Bold",
    "Times-Roman": "Times-Bold",
    "Courier": "Courier-Bold",
}


def get_font(invoice):
    font = getattr(invoice, "font", None) or "Helvetica"
    if font not in BOLD_VARIANT:
        font = "Helvetica"
    return font, BOLD_VARIANT[font]


def get_color(invoice, default):
    color = getattr(invoice, "color", None) or default
    try:
        return HexColor(color)
    except Exception:
        return HexColor(default)


def generate_classic(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#111827")

    c.setFillColor(accent)
    c.setFont(bold_font, 22)
    c.drawCentredString(width/2, 800, "INVOICE")

    c.setFillColor(black)
    c.line(40,785,555,785)

    c.setFont(bold_font,12)
    c.drawString(50,750,"Organization:")
    c.drawString(50,725,"Customer:")

    c.setFont(font,12)
    c.drawString(160,750,invoice.organizationName)
    c.drawString(160,725,invoice.customerName)

    c.line(40,690,555,690)

    c.setFont(bold_font,12)
    c.drawString(50,670,"Product")
    c.drawString(250,670,"Price")
    c.drawString(350,670,"Qty")
    c.drawString(450,670,"Total")

    c.line(40,655,555,655)

    total = invoice.productPrice * invoice.productQuantity

    c.setFont(font,12)
    c.drawString(50,630,invoice.productName)
    c.drawString(250,630,f"₹ {invoice.productPrice}")
    c.drawString(350,630,str(invoice.productQuantity))
    c.drawString(450,630,f"₹ {total}")

    c.line(40,600,555,600)

    c.setFillColor(accent)
    c.setFont(bold_font,13)
    c.drawString(340,570,"Grand Total :")
    c.drawString(460,570,f"₹ {total}")

    c.save()

    return FileResponse(PDF_PATH,media_type="application/pdf",filename="invoice.pdf")



def generate_modern(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#2563EB")

    # Accent Header
    c.setFillColor(accent)
    c.rect(0,770,width,72,fill=1)

    c.setFillColor(white)
    c.setFont(bold_font,26)
    c.drawCentredString(width/2,795,"MODERN INVOICE")

    c.setFillColor(black)

    c.setFont(bold_font,13)
    c.drawString(50,730,"Organization")
    c.drawString(50,705,"Customer")

    c.setFont(font,12)
    c.drawString(170,730,invoice.organizationName)
    c.drawString(170,705,invoice.customerName)

    # Table Header
    c.setFillColor(accent)
    c.rect(40,650,515,28,fill=1)

    c.setFillColor(white)
    c.setFont(bold_font,12)
    c.drawString(55,660,"Product")
    c.drawString(240,660,"Price")
    c.drawString(340,660,"Qty")
    c.drawString(445,660,"Amount")

    total = invoice.productPrice * invoice.productQuantity

    c.setFillColor(black)
    c.setFont(font,12)

    c.drawString(55,625,invoice.productName)
    c.drawString(240,625,f"₹ {invoice.productPrice}")
    c.drawString(340,625,str(invoice.productQuantity))
    c.drawString(445,625,f"₹ {total}")

    c.setFont(bold_font,14)
    c.drawString(340,570,"Grand Total")
    c.drawString(455,570,f"₹ {total}")

    c.setFillColor(accent)
    c.rect(0,0,width,45,fill=1)

    c.setFillColor(white)
    c.drawCentredString(width/2,18,"Thank You For Your Purchase!")

    c.save()

    return FileResponse(PDF_PATH,media_type="application/pdf",filename="invoice.pdf")



def generate_corporate(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#374151")

    total = invoice.productPrice * invoice.productQuantity

    # Header
    c.setFillColor(accent)
    c.rect(0, 780, width, 62, fill=1)

    c.setFillColor(white)
    c.setFont(bold_font, 24)
    c.drawString(40, 800, "CORPORATE INVOICE")

    c.setFillColor(black)

    c.setFont(bold_font, 12)
    c.drawString(40, 740, "Organization")
    c.drawString(320, 740, "Customer")

    c.setFont(font, 12)
    c.drawString(40, 720, invoice.organizationName)
    c.drawString(320, 720, invoice.customerName)

    # Table
    c.rect(40, 610, 515, 90)

    c.line(40, 670, 555, 670)
    c.line(250, 610, 250, 700)
    c.line(340, 610, 340, 700)
    c.line(430, 610, 430, 700)

    c.setFont(bold_font, 11)
    c.drawString(50, 680, "Product")
    c.drawString(265, 680, "Price")
    c.drawString(355, 680, "Qty")
    c.drawString(450, 680, "Amount")

    c.setFont(font, 11)
    c.drawString(50, 640, invoice.productName)
    c.drawString(265, 640, f"₹ {invoice.productPrice}")
    c.drawString(360, 640, str(invoice.productQuantity))
    c.drawString(450, 640, f"₹ {total}")

    c.setFillColor(accent)
    c.setFont(bold_font, 14)
    c.drawRightString(540, 560, f"Grand Total : ₹ {total}")

    # Signature
    c.setFillColor(black)
    c.line(370, 180, 540, 180)
    c.setFont(font, 10)
    c.drawString(410, 165, "Authorized Signature")

    c.save()

    return FileResponse(
        PDF_PATH,
        media_type="application/pdf",
        filename="invoice.pdf"
    )


def generate_minimal(invoice):

    c = canvas.Canvas(PDF_PATH)

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#000000")

    total = invoice.productPrice * invoice.productQuantity

    c.setFillColor(accent)
    c.setFont(bold_font, 26)
    c.drawString(50, 800, "Invoice")

    c.setFillColor(black)
    c.setFont(font, 12)

    c.drawString(50, 740, f"Organization : {invoice.organizationName}")
    c.drawString(50, 715, f"Customer : {invoice.customerName}")

    c.line(50,690,540,690)

    c.drawString(50,660,f"Product : {invoice.productName}")
    c.drawString(50,635,f"Price : ₹ {invoice.productPrice}")
    c.drawString(50,610,f"Quantity : {invoice.productQuantity}")

    c.line(50,585,540,585)

    c.setFillColor(accent)
    c.setFont(bold_font,14)
    c.drawString(50,550,f"Total : ₹ {total}")

    c.save()

    return FileResponse(
        PDF_PATH,
        media_type="application/pdf",
        filename="invoice.pdf"
    )


def generate_premium(invoice):

    c = canvas.Canvas(PDF_PATH)
    width = 595

    font, bold_font = get_font(invoice)
    gold = get_color(invoice, "#B8860B")

    total = invoice.productPrice * invoice.productQuantity

    c.setStrokeColor(gold)
    c.setLineWidth(3)

    c.rect(25,25,545,790)

    c.setFillColor(gold)
    c.setFont(bold_font,28)
    c.drawCentredString(width/2,785,"PREMIUM INVOICE")

    c.setFillColor(black)

    c.setFont(bold_font,13)

    c.drawString(50,730,"Organization")
    c.drawString(50,700,invoice.organizationName)

    c.drawString(330,730,"Customer")
    c.drawString(330,700,invoice.customerName)

    c.line(40,660,550,660)

    c.drawString(50,630,"Product")
    c.drawString(230,630,"Price")
    c.drawString(330,630,"Qty")
    c.drawString(430,630,"Amount")

    c.line(40,615,550,615)

    c.setFont(font,12)

    c.drawString(50,590,invoice.productName)
    c.drawString(230,590,f"₹ {invoice.productPrice}")
    c.drawString(330,590,str(invoice.productQuantity))
    c.drawString(430,590,f"₹ {total}")

    c.line(40,550,550,550)

    c.setFillColor(gold)
    c.setFont(bold_font,16)
    c.drawRightString(530,520,f"Grand Total : ₹ {total}")

    c.setFillColor(black)
    c.setFont(font,12)
    c.drawCentredString(width/2,80,"Thank You For Choosing Us!")

    c.save()

    return FileResponse(
        PDF_PATH,
        media_type="application/pdf",
        filename="invoice.pdf"
    )
