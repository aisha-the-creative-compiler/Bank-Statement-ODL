"""
Multi-line merger for bank statement transaction descriptions.
Merges wrapped lines belonging to the same transaction, collapses whitespace,
and extracts secondary metadata into notes (e.g. cheque numbers, transaction IDs).
"""

import re
from typing import List, Dict, Any, Optional


class MultilineMerger:
    """
    Handles merging of description text wrapped across multiple physical lines.
    Collapses excess whitespace and strips noise.
    """

    # Patterns indicating lines that should NOT be merged as transaction descriptions
    PAGE_BREAK_PATTERNS = [
        r"page\s+\d+\s+of\s+\d+",
        r"continued\s+on\s+next\s+page",
        r"carried\s+forward",
        r"brought\s+forward",
        r"statement\s+of\s+account",
        r"balance\s+carried\s+forward",
        r"^date\s+particulars",
        r"^date\s+description",
        r"^value\s+date\s+post\s+date",
        r"^total\s+debits?",
        r"^total\s+credits?",
        r"^closing\s+balance",
        r"^opening\s+balance",
    ]

    def is_noise_or_header(self, text: str) -> bool:
        """Checks if a line is a repeated header, page counter, or summary noise."""
        clean = text.strip().lower()
        if not clean:
            return True
        for pattern in self.PAGE_BREAK_PATTERNS:
            if re.search(pattern, clean):
                return True
        return False

    def collapse_whitespace(self, text: str) -> str:
        """Collapses consecutive spaces, tabs, and newlines into a single clean space."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text).strip()

    def merge_descriptions(self, lines: List[str]) -> str:
        """
        Merges a sequence of description lines into a single coherent title.
        Eliminates duplicate consecutive phrases and trims noise.
        """
        cleaned_parts = []
        for line in lines:
            if self.is_noise_or_header(line):
                continue
            trimmed = self.collapse_whitespace(line)
            if trimmed and trimmed not in cleaned_parts:
                cleaned_parts.append(trimmed)

        joined = " ".join(cleaned_parts)
        return self.collapse_whitespace(joined)

    def extract_notes_and_clean_title(self, full_description: str) -> Dict[str, str]:
        """
        Separates reference codes, cheque numbers, IBANs, or transaction IDs
        from the main merchant/transaction description.
        Returns {'title': str, 'notes': str}.
        """
        text = self.collapse_whitespace(full_description)
        notes = []

        # Extract cheque number: e.g. "CHQ# 102948" or "Cheque No: 99421"
        chq_match = re.search(r"\b(CHQ#?|CHEQUE\s*(?:NO\.?)?)\s*[:\-]?\s*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
        if chq_match:
            notes.append(f"Cheque: {chq_match.group(2)}")
            text = text.replace(chq_match.group(0), "")

        # Extract IBAN or Account ref: e.g. "PK36MEZN00..." or "FT240192837"
        iban_match = re.search(r"\b([A-Z]{2}\d{2}[A-Z0-9]{12,24})\b", text)
        if iban_match:
            notes.append(f"IBAN: {iban_match.group(1)}")
            text = text.replace(iban_match.group(0), "")

        # Extract FT / Reference ID: e.g. "Ref: 99281726" or "TRX-102938"
        ref_match = re.search(r"\b(REF#?|TRX|TXN|ID)\s*[:\-]?\s*([A-Za-z0-9\-]{6,20})", text, re.IGNORECASE)
        if ref_match:
            notes.append(f"Ref: {ref_match.group(2)}")
            text = text.replace(ref_match.group(0), "")

        clean_title = self.collapse_whitespace(re.sub(r"[\s\-_/]+$", "", text))
        return {
            "title": clean_title or full_description,
            "notes": "; ".join(notes)
        }
