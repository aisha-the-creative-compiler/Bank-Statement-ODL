"""
OCR engine and document text layer extractor.
Provides unified interface:
- Digital PDFs: Extracts native text layer (fast, deterministic, confidence = 1.0)
- Scanned documents / images: Preprocesses and applies OCR (Tesseract / PaddleOCR / Vision)
"""

import os
from typing import List, Tuple, Optional, Any
from parse.models import RawLine, DocumentType
from ocr.preprocessor import ImagePreprocessor


class OCREngine:
    """
    Handles text extraction across digital PDFs, scanned PDFs, and raster images.
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        self.preprocessor = ImagePreprocessor()
        self.tesseract_cmd = tesseract_cmd

    def extract_lines_from_document(
        self,
        file_path: str,
        doc_type: DocumentType
    ) -> List[RawLine]:
        """
        Dispatches to native text extraction or OCR pipeline based on document type.
        """
        if doc_type == DocumentType.DIGITAL_PDF:
            return self._extract_digital_pdf(file_path)
        elif doc_type == DocumentType.SCANNED_PDF:
            return self._extract_scanned_pdf(file_path)
        elif doc_type == DocumentType.IMAGE:
            return self._extract_image(file_path)
        else:
            # Attempt digital first, then image
            try:
                lines = self._extract_digital_pdf(file_path)
                if lines and len(lines) > 5:
                    return lines
            except Exception:
                pass
            return self._extract_image(file_path)

    def _extract_digital_pdf(self, pdf_path: str) -> List[RawLine]:
        """
        Extracts native text lines from a digital PDF using pdfplumber, pypdf, or pypdfium2.
        Assigns confidence = 1.0 because native digital text is authoritative.
        """
        lines: List[RawLine] = []

        # Try pdfplumber
        try:
            import pdfplumber  # type: ignore
            with pdfplumber.open(pdf_path) as pdf:
                line_no = 0
                for page_idx, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text(layout=True) or ""
                    for raw_l in text.splitlines():
                        trimmed = raw_l.strip()
                        if trimmed:
                            line_no += 1
                            lines.append(RawLine(
                                text=trimmed,
                                page=page_idx,
                                line_number=line_no,
                                confidence=1.0
                            ))
                if lines:
                    return lines
        except ImportError:
            pass

        # Try pypdf
        try:
            import pypdf  # type: ignore
            reader = pypdf.PdfReader(pdf_path)
            line_no = 0
            for page_idx, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                for raw_l in text.splitlines():
                    trimmed = raw_l.strip()
                    if trimmed:
                        line_no += 1
                        lines.append(RawLine(
                            text=trimmed,
                            page=page_idx,
                            line_number=line_no,
                            confidence=0.99
                        ))
            if lines:
                return lines
        except ImportError:
            pass

        return lines

    def _extract_scanned_pdf(self, pdf_path: str) -> List[RawLine]:
        """
        Renders PDF pages to images and runs OCR on each page.
        """
        lines: List[RawLine] = []
        try:
            import pypdfium2 as pdfium  # type: ignore
            pdf = pdfium.PdfDocument(pdf_path)
            line_no = 0
            for page_idx in range(len(pdf)):
                page = pdf[page_idx]
                image = page.render(scale=2.5).to_pil()
                prep_img, _ = self.preprocessor.preprocess(image)
                page_lines = self._run_ocr_on_pil_image(prep_img, page_number=page_idx + 1, start_line=line_no)
                lines.extend(page_lines)
                line_no += len(page_lines)
            return lines
        except ImportError:
            pass

        # If pypdfium2 not installed, check if pdf2image or fitz exists
        try:
            import fitz  # PyMuPDF # type: ignore
            doc = fitz.open(pdf_path)
            line_no = 0
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                pix = page.get_pixmap(dpi=300)
                from PIL import Image  # type: ignore
                import io
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                prep_img, _ = self.preprocessor.preprocess(img)
                page_lines = self._run_ocr_on_pil_image(prep_img, page_number=page_idx + 1, start_line=line_no)
                lines.extend(page_lines)
                line_no += len(page_lines)
            return lines
        except ImportError:
            pass

        return self._extract_digital_pdf(pdf_path)

    def _extract_image(self, image_path: str) -> List[RawLine]:
        """Preprocesses image file and applies OCR."""
        prep_img, _ = self.preprocessor.preprocess(image_path)
        return self._run_ocr_on_pil_image(prep_img, page_number=1, start_line=0)

    def _run_ocr_on_pil_image(self, img: Any, page_number: int = 1, start_line: int = 0) -> List[RawLine]:
        """Runs Tesseract or fallback on PIL Image, extracting text lines and confidence."""
        lines: List[RawLine] = []

        try:
            import pytesseract  # type: ignore
            if self.tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            n_boxes = len(data["text"])
            current_line_words = []
            current_confidences = []
            last_line_num = None

            line_idx = start_line

            for i in range(n_boxes):
                word = data["text"][i].strip()
                line_num = data["line_num"][i]
                conf = float(data["conf"][i])

                if not word:
                    continue

                if last_line_num is not None and line_num != last_line_num:
                    if current_line_words:
                        line_idx += 1
                        avg_conf = max(0.0, min(1.0, (sum(current_confidences) / len(current_confidences)) / 100.0))
                        lines.append(RawLine(
                            text=" ".join(current_line_words),
                            page=page_number,
                            line_number=line_idx,
                            confidence=round(avg_conf, 2)
                        ))
                        current_line_words = []
                        current_confidences = []

                current_line_words.append(word)
                if conf >= 0:
                    current_confidences.append(conf)
                else:
                    current_confidences.append(70.0)
                last_line_num = line_num

            if current_line_words:
                line_idx += 1
                avg_conf = max(0.0, min(1.0, (sum(current_confidences) / len(current_confidences)) / 100.0))
                lines.append(RawLine(
                    text=" ".join(current_line_words),
                    page=page_number,
                    line_number=line_idx,
                    confidence=round(avg_conf, 2)
                ))

            if lines:
                return lines

        except (ImportError, Exception):
            pass

        return lines
