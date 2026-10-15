"""
Bank configuration schema for data-driven layout adapters.
Defines column mappings, regex signatures, and layout quirks for different banks.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any


@dataclass
class QuirkSettings:
    """Configurable layout quirks specific to various banks."""
    has_dual_dates: bool = False             # e.g., HBL Post Date & Value Date
    has_dr_cr_indicator: bool = False        # e.g., Meezan "115,000.00 CR" or "40,000.00 DR"
    cheque_in_separate_col: bool = False     # e.g., HBL separate Cheque No column
    parentheses_are_negative: bool = True    # e.g., (1,500.00) is debit
    running_balance_in_table: bool = True    # Running balance column present
    tax_codes_to_notes: bool = True          # Extract WHT/FED tax codes into notes
    islamic_banking_tags: bool = False       # Handle Meezan profit distribution / charity tags
    ignore_repeated_headers: bool = True     # Drop multi-page carried forward rows
    ignore_patterns: List[str] = field(default_factory=lambda: [
        r"page\s+\d+\s+of\s+\d+",
        r"carried\s+forward",
        r"brought\s+forward",
        r"balance\s+b/f",
        r"balance\s+c/f",
        r"^date\s+particulars",
        r"^post\s+date\s+value\s+date",
        r"^total\s+debits?",
        r"^total\s+credits?",
    ])


@dataclass
class ColumnMapping:
    """Column identification aliases and positional hints."""
    date_aliases: List[str] = field(default_factory=lambda: [
        "date", "post date", "trans date", "booking date", "value date"
    ])
    description_aliases: List[str] = field(default_factory=lambda: [
        "description", "particulars", "narration", "transaction details", "details"
    ])
    debit_aliases: List[str] = field(default_factory=lambda: [
        "debit", "withdrawals", "withdrawal", "dr", "dr (pkr)", "payment"
    ])
    credit_aliases: List[str] = field(default_factory=lambda: [
        "credit", "deposits", "deposit", "cr", "cr (pkr)", "receipt"
    ])
    balance_aliases: List[str] = field(default_factory=lambda: [
        "balance", "running balance", "balance (pkr)", "ledger balance"
    ])
    cheque_aliases: List[str] = field(default_factory=lambda: [
        "cheque no", "cheque #", "chq no", "instrument no", "ref no"
    ])


@dataclass
class BankLayoutConfig:
    """
    Comprehensive bank statement format profile.
    Can be loaded from or exported to JSON for custom bank additions.
    """
    bank_id: str                              # e.g. "hbl", "meezan", "bafl", "scb"
    bank_name: str                            # e.g. "Habib Bank Limited (HBL)"
    currency: str = "PKR"                     # e.g. "PKR", "USD"
    date_convention: str = "DD/MM/YYYY"       # "DD/MM/YYYY" or "MM/DD/YYYY"
    keywords: List[str] = field(default_factory=list)  # Words identifying this bank in text
    account_number_regex: str = r"(?:Account|IBAN|Acc)\s*(?:No|#)?\s*[:.\-]?\s*([A-Za-z0-9\-]{10,30})"
    statement_period_regex: str = r"(?:Period|Statement\s+Period|From)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)"
    opening_balance_regex: str = r"(?:Opening\s+Balance|Balance\s+B/F|B/F)\s*[:.\-]?\s*([0-9,.]+)"
    closing_balance_regex: str = r"(?:Closing\s+Balance|Ending\s+Balance|Balance\s+C/F|C/F)\s*[:.\-]?\s*([0-9,.]+)"
    column_mapping: ColumnMapping = field(default_factory=ColumnMapping)
    quirks: QuirkSettings = field(default_factory=QuirkSettings)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BankLayoutConfig":
        quirks_data = data.get("quirks", {})
        col_data = data.get("column_mapping", {})
        
        quirks = QuirkSettings(**quirks_data) if isinstance(quirks_data, dict) else QuirkSettings()
        cols = ColumnMapping(**col_data) if isinstance(col_data, dict) else ColumnMapping()
        
        filtered = {k: v for k, v in data.items() if k not in ["quirks", "column_mapping"]}
        return cls(quirks=quirks, column_mapping=cols, **filtered)
