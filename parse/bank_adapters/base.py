"""
Base class for bank statement layout adapters.
Defines common interface for extracting metadata, column coordinates, and transaction rows.
"""

from abc import ABC, abstractmethod
from typing import List, Tuple, Optional
from ..models import ParsedTransaction, StatementMetadata, RawLine


class BaseBankAdapter(ABC):
    """Abstract bank adapter for format-specific parsing."""

    def __init__(self, name: str, default_currency: str = "PKR"):
        self.name = name
        self.default_currency = default_currency

    @abstractmethod
    def identify(self, text_samples: List[str]) -> float:
        """
        Returns confidence score (0.0 to 1.0) indicating whether this adapter matches the document.
        """
        pass

    @abstractmethod
    def extract_metadata(self, lines: List[RawLine]) -> StatementMetadata:
        """Extracts account number, statement period, opening and closing balance."""
        pass

    @abstractmethod
    def parse_transactions(
        self,
        lines: List[RawLine],
        metadata: StatementMetadata,
        source_file: str = "statement.pdf"
    ) -> List[ParsedTransaction]:
        """Parses rows into standardized ParsedTransaction objects."""
        pass
