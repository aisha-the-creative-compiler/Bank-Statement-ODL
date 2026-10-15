"""
Date parser for bank statements.
Converts heterogeneous date strings into strict ISO 8601 (YYYY-MM-DD).
Infers missing years based on statement period context.
"""

import re
from datetime import datetime
from typing import Optional, Tuple


MONTH_NAMES = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12
}


class DateParser:
    """
    Parses date tokens found in statement transactions.
    Supports DD/MM/YYYY, MM/DD/YYYY, DD-Mon-YYYY, and handles year inference.
    """

    def __init__(self, default_year: Optional[int] = None, convention: str = "DD/MM/YYYY"):
        self.default_year = default_year or datetime.now().year
        self.convention = convention.upper()

    def parse(self, raw_date: str, period_year: Optional[int] = None) -> Tuple[Optional[str], float]:
        """
        Parses a date string into ISO 8601 (YYYY-MM-DD) and a confidence score (0.0 to 1.0).
        Returns:
            (iso_date_string_or_none, confidence)
        """
        if not raw_date:
            return None, 0.0

        cleaned = raw_date.strip().replace(",", " ").replace(".", "/")
        cleaned = re.sub(r"\s+", " ", cleaned)
        year_to_use = period_year or self.default_year

        # 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
        match_iso = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", cleaned)
        if match_iso:
            y, m, d = int(match_iso.group(1)), int(match_iso.group(2)), int(match_iso.group(3))
            return self._format_date(y, m, d, 1.0)

        # 2. Textual month with year: e.g. "15-Jan-2024", "15 Jan 2024", "Jan 15, 2024"
        match_text_ym = re.match(r"^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$", cleaned)
        if match_text_ym:
            d, mon_str, y_str = int(match_text_ym.group(1)), match_text_ym.group(2).lower(), match_text_ym.group(3)
            m = MONTH_NAMES.get(mon_str[:3])
            if m:
                y = int(y_str)
                if y < 100:
                    y += 2000
                return self._format_date(y, m, d, 0.98)

        # Textual month prefix: e.g. "Jan 15 2024"
        match_mon_first = re.match(r"^([A-Za-z]{3,9})[-/\s](\d{1,2})[-/\s](\d{2,4})$", cleaned)
        if match_mon_first:
            mon_str, d, y_str = match_mon_first.group(1).lower(), int(match_mon_first.group(2)), match_mon_first.group(3)
            m = MONTH_NAMES.get(mon_str[:3])
            if m:
                y = int(y_str)
                if y < 100:
                    y += 2000
                return self._format_date(y, m, d, 0.98)

        # 3. Textual month without year: e.g. "15-Jan", "15 Jan", "Jan 15" -> Infer year
        match_no_year = re.match(r"^(\d{1,2})[-/\s]([A-Za-z]{3,9})$", cleaned)
        if match_no_year:
            d, mon_str = int(match_no_year.group(1)), match_no_year.group(2).lower()
            m = MONTH_NAMES.get(mon_str[:3])
            if m:
                return self._format_date(year_to_use, m, d, 0.88)

        match_no_year_rev = re.match(r"^([A-Za-z]{3,9})[-/\s](\d{1,2})$", cleaned)
        if match_no_year_rev:
            mon_str, d = match_no_year_rev.group(1).lower(), int(match_no_year_rev.group(2))
            m = MONTH_NAMES.get(mon_str[:3])
            if m:
                return self._format_date(year_to_use, m, d, 0.88)

        # 4. Numeric formats with 3 parts: e.g. "15/01/2024" or "01/15/2024"
        match_num_3 = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$", cleaned)
        if match_num_3:
            p1, p2, y_str = int(match_num_3.group(1)), int(match_num_3.group(2)), match_num_3.group(3)
            y = int(y_str)
            if y < 100:
                y += 2000

            if self.convention == "MM/DD/YYYY":
                m, d = p1, p2
            else:  # Default DD/MM/YYYY
                d, m = p1, p2

            # Disambiguate if day > 12
            if d > 12 and m <= 12:
                # Valid DD/MM
                pass
            elif m > 12 and d <= 12:
                # Swap if accidentally mapped
                d, m = m, d

            return self._format_date(y, m, d, 0.95)

        # 5. Numeric format with 2 parts: e.g. "15/01" -> infer year
        match_num_2 = re.match(r"^(\d{1,2})[-/](\d{1,2})$", cleaned)
        if match_num_2:
            p1, p2 = int(match_num_2.group(1)), int(match_num_2.group(2))
            if self.convention == "MM/DD/YYYY":
                m, d = p1, p2
            else:
                d, m = p1, p2
            if d > 12 and m <= 12:
                pass
            elif m > 12 and d <= 12:
                d, m = m, d
            return self._format_date(year_to_use, m, d, 0.85)

        return None, 0.0

    def _format_date(self, year: int, month: int, day: int, base_conf: float) -> Tuple[Optional[str], float]:
        try:
            dt = datetime(year, month, day)
            return dt.strftime("%Y-%m-%d"), base_conf
        except ValueError:
            return None, 0.0
