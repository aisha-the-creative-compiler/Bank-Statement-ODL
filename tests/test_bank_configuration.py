"""
Unit tests for the Bank Configuration System and multi-bank quirk adapters.
Tests profile registry, auto-detection, HBL dual-date quirks, Meezan Islamic tags,
and dynamic custom JSON configuration loading.
"""

import unittest
from parse.config.registry import BankProfileRegistry
from parse.config.bank_profile import BankLayoutConfig, ColumnMapping, QuirkSettings
from parse.bank_adapters.configurable_adapter import ConfigurableBankAdapter
from parse.table_detector import TableDetector
from validate.reconciler import StatementValidator
from tests.fixtures import (
    SYNTHETIC_HBL_STATEMENT_TEXT,
    SYNTHETIC_MEEZAN_STATEMENT_TEXT,
    get_fixture_lines
)

# Synthetic Bank Alfalah fixture
SYNTHETIC_BAFL_STATEMENT_TEXT = """
BANK ALFALAH LIMITED
MAIN BRANCH KARACHI
STATEMENT OF ACCOUNT
Title: ALPHA LOGISTICS SOLUTIONS
Account No: 5501-9928-4410
Currency: PKR
Statement Period: From 01-Jan-2024 to 31-Jan-2024
Opening Balance: 80,000.00
-------------------------------------------------------------------------------------------------
Tran Date   Particulars                              Instrument No   Debit       Credit   Balance
-------------------------------------------------------------------------------------------------
03-Jan-2024 WAREHOUSE RENT PAYMENT                   CHQ-882190      20,000.00            60,000.00
10-Jan-2024 CLIENT SETTLEMENT VENDOR                                             45,000.00 105,000.00
24-Jan-2024 POS TERMINAL MERCHANT ACQUIRING          POS-9921         5,000.00           100,000.00
-------------------------------------------------------------------------------------------------
Closing Balance: 100,000.00
"""


class TestBankConfiguration(unittest.TestCase):
    """Test suite for bank configuration system and multi-bank layout adapters."""

    def setUp(self):
        self.registry = BankProfileRegistry()
        self.validator = StatementValidator(confidence_threshold=0.85)

    def test_builtin_profiles_registered(self):
        profiles = self.registry.list_profiles()
        bank_ids = [p.bank_id for p in profiles]
        self.assertIn("hbl", bank_ids)
        self.assertIn("meezan", bank_ids)
        self.assertIn("bafl", bank_ids)
        self.assertIn("scb", bank_ids)
        self.assertIn("mcb", bank_ids)
        self.assertIn("generic", bank_ids)

    def test_auto_detect_hbl(self):
        sample = ["HABIB BANK LIMITED", "Account Statement", "I.I. Chundrigar Road"]
        detected, score = self.registry.detect_profile(sample)
        self.assertEqual(detected.bank_id, "hbl")
        self.assertGreaterEqual(score, 0.8)

    def test_auto_detect_meezan(self):
        sample = ["MEEZAN BANK LIMITED", "The Premier Islamic Bank", "IBAN: PK36MEZN..."]
        detected, score = self.registry.detect_profile(sample)
        self.assertEqual(detected.bank_id, "meezan")
        self.assertGreaterEqual(score, 0.8)

    def test_auto_detect_bafl(self):
        sample = ["BANK ALFALAH LIMITED", "Branch Statement", "BAFL PK"]
        detected, score = self.registry.detect_profile(sample)
        self.assertEqual(detected.bank_id, "bafl")
        self.assertGreaterEqual(score, 0.8)

    def test_configurable_adapter_hbl_quirks(self):
        hbl_config = self.registry.get_profile("hbl")
        self.assertIsNotNone(hbl_config)
        self.assertTrue(hbl_config.quirks.has_dual_dates)
        self.assertTrue(hbl_config.quirks.cheque_in_separate_col)

        adapter = ConfigurableBankAdapter(hbl_config)
        lines = get_fixture_lines(SYNTHETIC_HBL_STATEMENT_TEXT)
        meta = adapter.extract_metadata(lines)
        self.assertEqual(meta.opening_balance, 100000.0)
        self.assertEqual(meta.closing_balance, 125000.0)

        txs = adapter.parse_transactions(lines, meta, source_file="hbl_test.pdf")
        self.assertEqual(len(txs), 4)

        # Check dual date quirk: Value Date should be captured in notes
        self.assertIn("Value Date", txs[0].notes)
        # Check cheque quirk: Cheque should be captured in notes
        self.assertIn("Cheque: 982141", txs[0].notes)

        # Mathematical reconciliation must pass
        _, report = self.validator.validate_and_reconcile(txs, meta)
        self.assertTrue(report.is_balanced)
        self.assertEqual(report.difference, 0.0)

    def test_configurable_adapter_meezan_quirks(self):
        meezan_config = self.registry.get_profile("meezan")
        self.assertIsNotNone(meezan_config)
        self.assertTrue(meezan_config.quirks.islamic_banking_tags)
        self.assertTrue(meezan_config.quirks.has_dr_cr_indicator)

        adapter = ConfigurableBankAdapter(meezan_config)
        lines = get_fixture_lines(SYNTHETIC_MEEZAN_STATEMENT_TEXT)
        meta = adapter.extract_metadata(lines)
        self.assertEqual(meta.opening_balance, 50000.0)
        self.assertEqual(meta.closing_balance, 115250.0)

        txs = adapter.parse_transactions(lines, meta, source_file="meezan_test.pdf")
        self.assertEqual(len(txs), 4)

        # Check Islamic profit tag quirk
        profit_tx = [t for t in txs if "PROFIT DISTRIBUTION" in t.description][0]
        self.assertIn("Islamic Mudarabah Profit", profit_tx.notes)

        # Check DR/CR balance suffix tag quirk
        self.assertIn("CR", profit_tx.notes)

        _, report = self.validator.validate_and_reconcile(txs, meta)
        self.assertTrue(report.is_balanced)

    def test_bank_alfalah_extraction(self):
        detector = TableDetector(preferred_bank="bafl", registry=self.registry)
        lines = get_fixture_lines(SYNTHETIC_BAFL_STATEMENT_TEXT)
        txs, meta, adapter_name = detector.extract(lines, source_file="bafl_sample.pdf")

        self.assertIn("Alfalah", adapter_name)
        self.assertEqual(len(txs), 3)
        self.assertEqual(meta.opening_balance, 80000.0)
        self.assertEqual(meta.closing_balance, 100000.0)

        _, report = self.validator.validate_and_reconcile(txs, meta)
        self.assertTrue(report.is_balanced)
        self.assertEqual(report.difference, 0.0)

    def test_dynamic_custom_bank_profile_registration(self):
        # Dynamically register a new custom bank format
        custom_config = BankLayoutConfig(
            bank_id="apex_bank",
            bank_name="Apex International Commercial Bank",
            currency="USD",
            keywords=["apex international", "apex bank"],
            opening_balance_regex=r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
            closing_balance_regex=r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
            quirks=QuirkSettings(has_dual_dates=False)
        )
        self.registry.register_profile(custom_config)

        # Confirm retrieval
        retrieved = self.registry.get_profile("apex_bank")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.bank_name, "Apex International Commercial Bank")
        self.assertEqual(retrieved.currency, "USD")


if __name__ == "__main__":
    unittest.main()
