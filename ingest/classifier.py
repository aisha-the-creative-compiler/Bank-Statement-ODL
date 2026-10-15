"""
File ingest and classification module.
Classifies input documents as:
1. DIGITAL_PDF: PDF with native selectable text layer.
2. SCANNED_PDF: PDF containing scanned images with no or negligible text layer.
3. IMAGE: Raster images (PNG, JPG, TIFF, WEBP).
"""

import os
from typing import Tuple, Dict, Any
from parse.models import DocumentType


class DocumentClassifier:
    """
    Inspects document headers, MIME types, and text layers
    to determine the optimal extraction strategy.
    """

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".webp", ".bmp"}
    PDF_EXTENSIONS = {".pdf"}

    def classify_file(self, file_path: str) -> Tuple[DocumentType, Dict[str, Any]]:
        """
        Classifies the file located at file_path.
        Returns:
            (DocumentType, diagnostic_info_dict)
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = os.path.getsize(file_path)
        ext = os.path.splitext(file_path)[1].lower()

        if ext in self.IMAGE_EXTENSIONS:
            return DocumentType.IMAGE, {
                "file_type": "image",
                "format": ext.lstrip("."),
                "size_bytes": file_size,
                "strategy": "image_ocr_pipeline"
            }

        if ext in self.PDF_EXTENSIONS:
            # Probe PDF text density
            is_digital, text_density, page_count = self._probe_pdf_text_layer(file_path)
            if is_digital:
                return DocumentType.DIGITAL_PDF, {
                    "file_type": "pdf",
                    "text_density_chars": text_density,
                    "pages": page_count,
                    "strategy": "native_text_extraction"
                }
            else:
                return DocumentType.SCANNED_PDF, {
                    "file_type": "scanned_pdf",
                    "text_density_chars": text_density,
                    "pages": page_count,
                    "strategy": "pdf_raster_and_ocr"
                }

        # Check magic bytes if extension is missing/ambiguous
        with open(file_path, "rb") as f:
            header = f.read(16)
            if header.startswith(b"%PDF"):
                is_digital, text_density, page_count = self._probe_pdf_text_layer(file_path)
                dtype = DocumentType.DIGITAL_PDF if is_digital else DocumentType.SCANNED_PDF
                return dtype, {"file_type": "pdf", "magic": "%PDF", "strategy": "native_text_extraction" if is_digital else "ocr"}
            elif header.startswith(b"\x89PNG") or header.startswith(b"\xff\xd8\xff"):
                return DocumentType.IMAGE, {"file_type": "image", "magic": "raster", "strategy": "image_ocr_pipeline"}

        return DocumentType.UNKNOWN, {"error": "Unsupported file format"}

    def _probe_pdf_text_layer(self, file_path: str) -> Tuple[bool, int, int]:
        """
        Inspects PDF text stream without heavy external dependencies.
        Uses pdfplumber or pypdf if installed, or parses standard PDF text stream objects.
        """
        # Try pdfplumber first if installed in user's python environment
        try:
            import pdfplumber  # type: ignore
            total_chars = 0
            with pdfplumber.open(file_path) as pdf:
                pages = len(pdf.pages)
                for page in pdf.pages[:3]:
                    txt = page.extract_text() or ""
                    total_chars += len(txt.strip())
                is_digital = total_chars > 80
                return is_digital, total_chars, pages
        except ImportError:
            pass

        # Try pypdf / PyPDF2
        try:
            import pypdf  # type: ignore
            reader = pypdf.PdfReader(file_path)
            pages = len(reader.pages)
            total_chars = 0
            for page in reader.pages[:3]:
                txt = page.extract_text() or ""
                total_chars += len(txt.strip())
            return (total_chars > 80), total_chars, pages
        except ImportError:
            pass

        # Fallback raw byte inspection for standard text blocks in PDF
        total_chars = 0
        pages = 1
        try:
            with open(file_path, "rb") as f:
                content = f.read()
                # Count /Page indicators
                pages = max(1, content.count(b"/Type /Page"))
                # Look for stream /BT (begin text) ... /ET (end text)
                bt_count = content.count(b"BT")
                # Look for text markers /Tj
                tj_count = content.count(b"Tj") + content.count(b"TJ")
                is_digital = (bt_count > 5 and tj_count > 10)
                return is_digital, tj_count * 10, pages
        except Exception:
            return False, 0, 1
