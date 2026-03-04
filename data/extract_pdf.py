import glob
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Please install PyMuPDF: pip install pymupdf")
    exit(1)

directory = r"d:\Work\VINYL"
pdf_files = glob.glob(os.path.join(directory, "*.pdf"))

for pdf_path in pdf_files:
    filename = os.path.basename(pdf_path)
    txt_path = os.path.splitext(pdf_path)[0] + ".txt"
    try:
        text_content = []
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text_content.append(page.get_text())
        
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(text_content))
            
    except Exception as e:
        pass
