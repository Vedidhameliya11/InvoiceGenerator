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


def get_line_items(invoice):
    """Returns a list of (name, price, quantity, line_total) tuples plus
    the subtotal (sum of all line totals, before GST), working whether
    the invoice has multiple `items` or (for backward compatibility) the
    old single product fields."""
    items = getattr(invoice, "items", None)

    if items:
        rows = [
            (it.name, it.price, it.quantity, it.price * it.quantity)
            for it in items
        ]
    else:
        rows = [
            (
                invoice.productName,
                invoice.productPrice,
                invoice.productQuantity,
                invoice.productPrice * invoice.productQuantity,
            )
        ]

    subtotal = sum(r[3] for r in rows)
    return rows, subtotal


def get_totals(invoice, subtotal):
    """Returns (gst_percent, gst_amount, grand_total) where grand_total
    is the subtotal plus GST. gstPercent defaults to 0 for older
    invoices/requests that don't include it."""
    gst_percent = getattr(invoice, "gstPercent", 0) or 0
    gst_amount = subtotal * gst_percent / 100
    grand_total = subtotal + gst_amount
    return gst_percent, gst_amount, grand_total


def fmt(n):
    """Format a number without a trailing .0 for whole numbers, but keep
    2 decimal places when there are cents."""
    if float(n) == int(n):
        return str(int(n))
    return f"{n:.2f}"


def generate_classic(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#111827")

    rows, subtotal = get_line_items(invoice)
    gst_percent, gst_amount, grand_total = get_totals(invoice, subtotal)
    row_height = 22

    c.setFillColor(accent)
    c.setFont(bold_font, 22)
    c.drawCentredString(width / 2, 800, "INVOICE")

    c.setFillColor(black)
    c.line(40, 785, 555, 785)

    c.setFont(bold_font, 12)
    c.drawString(50, 750, "Organization:")
    c.drawString(50, 725, "Customer:")

    c.setFont(font, 12)
    c.drawString(160, 750, invoice.organizationName)
    c.drawString(160, 725, invoice.customerName)

    c.line(40, 690, 555, 690)

    c.setFont(bold_font, 12)
    c.drawString(50, 670, "Product")
    c.drawString(250, 670, "Price")
    c.drawString(350, 670, "Qty")
    c.drawString(450, 670, "Total")

    c.line(40, 655, 555, 655)

    c.setFont(font, 11)
    row_start_y = 635
    for i, (name, price, qty, line_total) in enumerate(rows):
        y = row_start_y - i * row_height
        c.drawString(50, y, name)
        c.drawString(250, y, f"₹ {fmt(price)}")
        c.drawString(350, y, str(qty))
        c.drawString(450, y, f"₹ {fmt(line_total)}")

    table_bottom_y = row_start_y - len(rows) * row_height + 5
    c.line(40, table_bottom_y, 555, table_bottom_y)

    c.setFillColor(black)
    c.setFont(font, 12)
    subtotal_y = table_bottom_y - 25
    c.drawString(340, subtotal_y, "Subtotal :")
    c.drawString(460, subtotal_y, f"₹ {fmt(subtotal)}")

    gst_y = subtotal_y - 20
    c.drawString(340, gst_y, f"GST ({fmt(gst_percent)}%) :")
    c.drawString(460, gst_y, f"₹ {fmt(gst_amount)}")

    c.setFillColor(accent)
    c.setFont(bold_font, 13)
    grand_total_y = gst_y - 25
    c.drawString(340, grand_total_y, "Grand Total :")
    c.drawString(460, grand_total_y, f"₹ {fmt(grand_total)}")

    c.save()

    return FileResponse(PDF_PATH, media_type="application/pdf", filename="invoice.pdf")


def generate_modern(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#2563EB")

    rows, subtotal = get_line_items(invoice)
    gst_percent, gst_amount, grand_total = get_totals(invoice, subtotal)
    row_height = 22

    # Accent Header
    c.setFillColor(accent)
    c.rect(0, 770, width, 72, fill=1)

    c.setFillColor(white)
    c.setFont(bold_font, 26)
    c.drawCentredString(width / 2, 795, "MODERN INVOICE")

    c.setFillColor(black)

    c.setFont(bold_font, 13)
    c.drawString(50, 730, "Organization")
    c.drawString(50, 705, "Customer")

    c.setFont(font, 12)
    c.drawString(170, 730, invoice.organizationName)
    c.drawString(170, 705, invoice.customerName)

    # Table Header
    c.setFillColor(accent)
    c.rect(40, 650, 515, 28, fill=1)

    c.setFillColor(white)
    c.setFont(bold_font, 12)
    c.drawString(55, 660, "Product")
    c.drawString(240, 660, "Price")
    c.drawString(340, 660, "Qty")
    c.drawString(445, 660, "Amount")

    c.setFillColor(black)
    c.setFont(font, 11)
    row_start_y = 630
    for i, (name, price, qty, line_total) in enumerate(rows):
        y = row_start_y - i * row_height
        c.drawString(55, y, name)
        c.drawString(240, y, f"₹ {fmt(price)}")
        c.drawString(340, y, str(qty))
        c.drawString(445, y, f"₹ {fmt(line_total)}")

    subtotal_y = row_start_y - len(rows) * row_height - 15
    c.setFont(font, 12)
    c.drawString(340, subtotal_y, "Subtotal")
    c.drawString(455, subtotal_y, f"₹ {fmt(subtotal)}")

    gst_y = subtotal_y - 20
    c.drawString(340, gst_y, f"GST ({fmt(gst_percent)}%)")
    c.drawString(455, gst_y, f"₹ {fmt(gst_amount)}")

    total_y = gst_y - 25
    c.setFont(bold_font, 14)
    c.drawString(340, total_y, "Grand Total")
    c.drawString(455, total_y, f"₹ {fmt(grand_total)}")

    c.setFillColor(accent)
    c.rect(0, 0, width, 45, fill=1)

    c.setFillColor(white)
    c.drawCentredString(width / 2, 18, "Thank You For Your Purchase!")

    c.save()

    return FileResponse(PDF_PATH, media_type="application/pdf", filename="invoice.pdf")


def generate_corporate(invoice):

    c = canvas.Canvas(PDF_PATH)
    width, height = 595, 842

    font, bold_font = get_font(invoice)
    accent = get_color(invoice, "#374151")

    rows, subtotal = get_line_items(invoice)
    gst_percent, gst_amount, grand_total = get_totals(invoice, subtotal)
    row_height = 22

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

    # Table — box height grows with the number of rows
    table_top = 700
    header_row_h = 30
    table_height = header_row_h + len(rows) * row_height
    table_bottom = table_top - table_height

    c.rect(40, table_bottom, 515, table_height)

    header_divider_y = table_top - header_row_h
    c.line(40, header_divider_y, 555, header_divider_y)
    c.line(250, table_bottom, 250, table_top)
    c.line(340, table_bottom, 340, table_top)
    c.line(430, table_bottom, 430, table_top)

    c.setFont(bold_font, 11)
    c.drawString(50, table_top - 20, "Product")
    c.drawString(265, table_top - 20, "Price")
    c.drawString(355, table_top - 20, "Qty")
    c.drawString(450, table_top - 20, "Amount")

    c.setFont(font, 11)
    row_start_y = header_divider_y - 15
    for i, (name, price, qty, line_total) in enumerate(rows):
        y = row_start_y - i * row_height
        c.drawString(50, y, name)
        c.drawString(265, y, f"₹ {fmt(price)}")
        c.drawString(360, y, str(qty))
        c.drawString(450, y, f"₹ {fmt(line_total)}")

    c.setFillColor(black)
    c.setFont(font, 12)
    c.drawRightString(540, table_bottom - 25, f"Subtotal : ₹ {fmt(subtotal)}")
    c.drawRightString(540, table_bottom - 45, f"GST ({fmt(gst_percent)}%) : ₹ {fmt(gst_amount)}")

    c.setFillColor(accent)
    c.setFont(bold_font, 14)
    c.drawRightString(540, table_bottom - 70, f"Grand Total : ₹ {fmt(grand_total)}")

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

    rows, subtotal = get_line_items(invoice)
    gst_percent, gst_amount, grand_total = get_totals(invoice, subtotal)
    row_height = 22

    c.setFillColor(accent)
    c.setFont(bold_font, 26)
    c.drawString(50, 800, "Invoice")

    c.setFillColor(black)
    c.setFont(font, 12)

    c.drawString(50, 740, f"Organization : {invoice.organizationName}")
    c.drawString(50, 715, f"Customer : {invoice.customerName}")

    c.line(50, 690, 540, 690)

    c.setFont(bold_font, 11)
    c.drawString(50, 668, "Product")
    c.drawString(280, 668, "Price")
    c.drawString(380, 668, "Qty")
    c.drawString(460, 668, "Total")

    c.setFont(font, 11)
    row_start_y = 648
    for i, (name, price, qty, line_total) in enumerate(rows):
        y = row_start_y - i * row_height
        c.drawString(50, y, name)
        c.drawString(280, y, f"₹ {fmt(price)}")
        c.drawString(380, y, str(qty))
        c.drawString(460, y, f"₹ {fmt(line_total)}")

    line_y = row_start_y - len(rows) * row_height + 5
    c.line(50, line_y, 540, line_y)

    c.setFillColor(black)
    c.setFont(font, 12)
    c.drawString(50, line_y - 25, f"Subtotal : ₹ {fmt(subtotal)}")
    c.drawString(50, line_y - 45, f"GST ({fmt(gst_percent)}%) : ₹ {fmt(gst_amount)}")

    c.setFillColor(accent)
    c.setFont(bold_font, 14)
    c.drawString(50, line_y - 70, f"Total : ₹ {fmt(grand_total)}")

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

    rows, subtotal = get_line_items(invoice)
    gst_percent, gst_amount, grand_total = get_totals(invoice, subtotal)
    row_height = 22

    c.setStrokeColor(gold)
    c.setLineWidth(3)

    c.rect(25, 25, 545, 790)

    c.setFillColor(gold)
    c.setFont(bold_font, 28)
    c.drawCentredString(width / 2, 785, "PREMIUM INVOICE")

    c.setFillColor(black)

    c.setFont(bold_font, 13)

    c.drawString(50, 730, "Organization")
    c.drawString(50, 700, invoice.organizationName)

    c.drawString(330, 730, "Customer")
    c.drawString(330, 700, invoice.customerName)

    c.line(40, 660, 550, 660)

    c.drawString(50, 630, "Product")
    c.drawString(230, 630, "Price")
    c.drawString(330, 630, "Qty")
    c.drawString(430, 630, "Amount")

    c.line(40, 615, 550, 615)

    c.setFont(font, 11)
    row_start_y = 595
    for i, (name, price, qty, line_total) in enumerate(rows):
        y = row_start_y - i * row_height
        c.drawString(50, y, name)
        c.drawString(230, y, f"₹ {fmt(price)}")
        c.drawString(330, y, str(qty))
        c.drawString(430, y, f"₹ {fmt(line_total)}")

    line_y = row_start_y - len(rows) * row_height + 5
    c.line(40, line_y, 550, line_y)

    c.setFillColor(black)
    c.setFont(font, 12)
    c.drawRightString(530, line_y - 25, f"Subtotal : ₹ {fmt(subtotal)}")
    c.drawRightString(530, line_y - 45, f"GST ({fmt(gst_percent)}%) : ₹ {fmt(gst_amount)}")

    c.setFillColor(gold)
    c.setFont(bold_font, 16)
    c.drawRightString(530, line_y - 70, f"Grand Total : ₹ {fmt(grand_total)}")

    c.setFillColor(black)
    c.setFont(font, 12)
    c.drawCentredString(width / 2, 80, "Thank You For Choosing Us!")

    c.save()

    return FileResponse(
        PDF_PATH,
        media_type="application/pdf",
        filename="invoice.pdf"
    )