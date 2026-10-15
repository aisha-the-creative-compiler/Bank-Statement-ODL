"""
Table detector and layout dispatcher.
Detects table boundaries, matches bank configuration profiles from the registry,
and routes to the best matching configurable or bank-specific adapter.
"""

from typing import List, Tuple, Optional, Dict
from parse.models import ParsedTransaction, StatementMetadata, RawLine
from parse.bank_adapters.base import BaseBankAdapter
from parse.bank_adapters.hbl_adapter import HBLBankAdapter
from parse.bank_adapters.meezan_adapter import MeezanBankAdapter
from parse.bank_adapters.generic_adapter import GenericBankAdapter
from parse.bank_adapters.configurable_adapter import ConfigurableBankAdapter
from parse.config.registry import bank_registry, BankProfileRegistry
from parse.config.bank_profile import BankLayoutConfig


class TableDetector:
    """
    Detects table regions in bank statements and manages bank profile adapter dispatch.
    """

    def __init__(self, preferred_bank: Optional[str] = None, registry: Optional[BankProfileRegistry] = None):
        self.registry = registry or bank_registry
        self.preferred_bank = preferred_bank.lower() if preferred_bank else None
        
        # Built-in adapter mapping with fallback to configurable adapter
        self.specialized_adapters: Dict[str, BaseBankAdapter] = {
            "hbl": HBLBankAdapter(),
            "meezan": MeezanBankAdapter(),
            "generic": GenericBankAdapter(),
        }

    def select_adapter(self, lines: List[RawLine]) -> BaseBankAdapter:
        """Selects the best adapter based on user preference or automatic registry detection."""
        # 1. User forced bank
        if self.preferred_bank:
            if self.preferred_bank in self.specialized_adapters:
                return self.specialized_adapters[self.preferred_bank]
            profile = self.registry.get_profile(self.preferred_bank)
            if profile:
                return ConfigurableBankAdapter(profile)

        # 2. Automatic profile detection via registry keywords
        sample_texts = [line.text for line in lines[:60]]
        detected_profile, score = self.registry.detect_profile(sample_texts)

        if score >= 0.35 and detected_profile:
            # Check if specialized adapter exists
            if detected_profile.bank_id in self.specialized_adapters:
                return self.specialized_adapters[detected_profile.bank_id]
            return ConfigurableBankAdapter(detected_profile)

        return self.specialized_adapters["generic"]

    def extract(
        self,
        lines: List[RawLine],
        source_file: str = "statement.pdf",
        forced_bank: Optional[str] = None
    ) -> Tuple[List[ParsedTransaction], StatementMetadata, str]:
        """
        Executes table extraction:
        1. Selects or instantiates adapter for matched profile
        2. Extracts statement metadata
        3. Parses transaction rows
        """
        if forced_bank:
            self.preferred_bank = forced_bank.lower()

        adapter = self.select_adapter(lines)
        metadata = adapter.extract_metadata(lines)
        transactions = adapter.parse_transactions(lines, metadata, source_file=source_file)

        return transactions, metadata, adapter.name
