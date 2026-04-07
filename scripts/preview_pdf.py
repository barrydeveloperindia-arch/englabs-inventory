from pdf2image import convert_from_path
import os

pdf_path = 'Swati_Anand_Brochure_v3.pdf'
output_folder = 'pdf_previews'

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

try:
    # This might fail if poppler is not in PATH
    images = convert_from_path(pdf_path)
    
    for i, image in enumerate(images):
        fname = f"{output_folder}/page_{i + 1}.jpg"
        image.save(fname, "JPEG")
        print(f"Saved {fname}")
except Exception as e:
    print(f"Error converting PDF: {e}")
    print("Likely missing poppler. Please view the PDF file directly.")
