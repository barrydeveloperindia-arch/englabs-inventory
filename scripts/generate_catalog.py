from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
import os

# Ensure output directory exists
output_dir = "output"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

file_path = os.path.join(output_dir, "Hop-in_Express_Poster_and_Catalog.pdf")

doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
styles = getSampleStyleSheet()
story = []

# Custom styles
title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Title"],
    fontSize=26,
    textColor=colors.black,
    spaceAfter=20
)

subtitle_style = ParagraphStyle(
    "SubtitleStyle",
    parent=styles["Normal"],
    fontSize=14,
    textColor=colors.grey,
    spaceAfter=14
)

section_style = ParagraphStyle(
    "SectionStyle",
    parent=styles["Heading2"],
    textColor=colors.black,
    spaceBefore=16,
    spaceAfter=10
)

# --- Poster / Cover Page ---
story.append(Paragraph("Hop-in Express", title_style))
story.append(Paragraph("Your Everyday Convenience Store", subtitle_style))

story.append(Paragraph(
    "<b>Address:</b> 37 High St, Eastleigh SO50 5LG, United Kingdom<br/>"
    "<b>Contact:</b> +44 7453 313017<br/>"
    "<b>Owner:</b> Mr. Salil Anand<br/>"
    "<b>Website:</b> www.hopinexpress.com",
    styles["Normal"]
))

story.append(Spacer(1, 20))

story.append(Paragraph(
    "Spirits • Tobacco • Vapes • Grocery • Fresh Items • International Products",
    styles["Italic"]
))

story.append(PageBreak())

# --- Catalog Section ---
story.append(Paragraph("Product Catalog", section_style))

catalog_data = [
    ["Category", "Available Items"],
    ["Spirits & Alcohol", "Whisky, Vodka, Rum, Wine, Beer"],
    ["Tobacco Products", "Cigarettes, Rolling Tobacco"],
    ["Vapes", "Disposable Vapes, E-Liquids"],
    ["Grocery", "Snacks, Biscuits, Drinks"],
    ["Fresh Items", "Bread, Milk, Fruits"],
    ["International Items", "Imported Snacks & Beverages"],
]

table = Table(catalog_data, colWidths=[150, 300])
table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
    ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
    ("FONT", (0,0), (-1,0), "Helvetica-Bold"),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
]))

story.append(table)

story.append(Spacer(1, 20))

story.append(Paragraph(
    "Scan in-store or visit our website to view live prices and updated inventory.",
    styles["Normal"]
))

doc.build(story)

print(f"PDF generated successfully at: {file_path}")
