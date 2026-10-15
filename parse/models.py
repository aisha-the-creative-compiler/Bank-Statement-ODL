"""
Data models for the bank statement extraction and review pipeline.
Strictly adheres to the required CSV output schema and audit metadata.
"""

from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
from enum import Enum


class DocumentType(str, Enum):
    DIGITAL_PDF = "digital_pdf"
    SCANNED_PDF = "scanned_pdf"
    IMAGE = "image"
    UNKNOWN = "unknown"


@dataclass
class RawLine:
    """Represents a raw line extracted from a document page."""
    text: str
    page: int
    line_number: int
    confidence: float = 1.0
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1]


@dataclass
class StatementMetadata:
    """Metadata extracted from the bank statement header/footer."""
    bank_name: str = "Generic Bank"
    account_number_masked: str = "****"
    account_title: str = "Account Holder"
    currency: str = "PKR"
    statement_start_date: Optional[str] = None  # YYYY-MM-DD
    statement_end_date: Optional[str] = None    # YYYY-MM-DD
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    total_debits: Optional[float] = None
    total_credits: Optional[float] = None


@dataclass
class ParsedTransaction:
    """
    Extracted transaction row adhering to the strict output CSV schema:
    - date: ISO 8601, YYYY-MM-DD
    - description: Merchant or transaction title (joined lines, collapsed whitespace)
    - amount: Signed decimal (debits negative, credits positive)
    - notes: Reference/cheque numbers, running balance, or additional details
    
    Audit columns:
    - source_file: Source document filename
    - page: 1-indexed page number
    - confidence: Float score between 0.0 and 1.0
    - needs_review: Boolean flag for human review
    """
    date: str
    description: str
    amount: float
    notes: str = ""
    source_file: str = "statement.pdf"
    page: int = 1
    confidence: float = 1.0
    needs_review: bool = False
    
    # Internal audit and reconciliation helpers (excluded from final CSV if desired)
    running_balance: Optional[float] = None
    review_reasons: List[str] = field(default_factory=list)
    raw_text: str = ""

    def to_csv_dict(self) -> Dict[str, Any]:
        """Returns the dictionary strictly matching the required CSV columns."""
        return {
            "date": self.date,
            "description": self.description,
            "amount": f"{self.amount:.2f}",
            "notes": self.notes,
            "source_file": self.source_file,
            "page": self.page,
            "confidence": f"{self.confidence:.2f}",
            "needs_review": str(self.needs_review).lower(),
        }

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ReconciliationReport:
    """Validation and mathematical reconciliation results."""
    opening_balance: Optional[float]
    closing_balance: Optional[float]
    calculated_closing: Optional[float]
    total_credits: float
    total_debits: float
    net_transactions: float
    difference: float
    is_balanced: bool
    running_balance_consistent: bool
    date_bounds_consistent: bool
    flagged_rows_count: int
    total_rows: int
    issues: List[str] = field(default_factory=list)
