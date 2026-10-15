"""
Amount parser for bank statements.
Strictly normalizes amounts to signed decimals:
- Debits: negative (e.g. -1500.00)
- Credits: positive (e.g. 5000.00)
- Strips currency signs (PKR, Rs, $, etc.) and comma separators.
- Handles (parentheses) as negative, DR / CR suffixes/prefixes.
"""

import re
from typing import Optional, Tuple


class AmountParser:
    """
    Parses currency amounts into signed float numbers.
    Debits = Negative, Credits = Positive.
    """

    CURRENCY_SYMBOLS = [
        r"PKR", r"RS\.?", r"USD", r"\$", r"EUR", r"€", r"GBP", r"£", r"AED", r"SAR"
    ]

    def parse(
        self,
        raw_val: str,
        is_debit: Optional[bool] = None,
        is_credit: Optional[bool] = None
    ) -> Tuple[Optional[float], float]:
        """
        Parses raw text into a signed float.
        If is_debit is True, forces negative sign.
        If is_credit is True, forces positive sign.
        Otherwise detects sign from parentheses, - sign, DR/CR tokens.
        
        Returns:
            (signed_float_or_none, confidence)
        """
        if not raw_val or not raw_val.strip():
            return None, 0.0

        text = raw_val.strip()

        # Clean non-breaking spaces
        text = text.replace("\u00a0", " ").replace("\u202f", " ")

        # Check for DR/CR indicators in the string
        has_dr = bool(re.search(r"\bDR\b|\(DR\)", text, re.IGNORECASE))
        has_cr = bool(re.search(r"\bCR\b|\(CR\)", text, re.IGNORECASE))

        # Check for parentheses: e.g. (1,500.00) or (1500)
        has_parentheses = bool(re.search(r"\(\s*[\d,.\s]+\s*\)", text))

        # Check for leading/trailing minus sign
        has_minus = bool(re.search(r"-\s*[\d,.]|[\d,.]\s*-", text))

        # Strip currency symbols
        for sym in self.CURRENCY_SYMBOLS:
            text = re.sub(sym, "", text, flags=re.IGNORECASE)

        # Strip DR / CR tags
        text = re.sub(r"\b(DR|CR)\b", "", text, flags=re.IGNORECASE)

        # Strip brackets, parentheses, and any non-numeric except dot and comma
        text = re.sub(r"[^\d.,]", "", text)

        if not text:
            return None, 0.0

        # Standardize decimal separator:
        # e.g., "1,234.56" -> 1234.56
        # e.g., "1.234,56" (German/French style) -> 1234.56
        if "," in text and "." in text:
            # If comma comes before dot: standard 1,234.56
            if text.rfind(",") < text.rfind("."):
                text = text.replace(",", "")
            else:
                # Comma is decimal separator: 1.234,56
                text = text.replace(".", "").replace(",", ".")
        elif "," in text:
            # Only commas. Check if it's thousands or decimal:
            parts = text.split(",")
            if len(parts[-1]) == 2:  # Likely decimal, e.g. "150,00"
                text = text.replace(",", ".")
            else:
                text = text.replace(",", "")

        try:
            val = float(text)
        except ValueError:
            return None, 0.0

        # Determine signedness:
        # Explicit debit flag has highest priority
        if is_debit is True:
            signed_val = -abs(val)
        elif is_credit is True:
            signed_val = abs(val)
        elif has_dr or has_parentheses or has_minus:
            signed_val = -abs(val)
        elif has_cr:
            signed_val = abs(val)
        else:
            # Default to positive if no negative indicator
            signed_val = abs(val)

        conf = 1.0 if (has_dr or has_cr or is_debit is not None or is_credit is not None or has_parentheses) else 0.92
        return signed_val, conf
