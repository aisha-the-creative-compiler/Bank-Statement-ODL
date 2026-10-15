"""
Unit tests for end-to-end statement parsing, balance reconciliation,
row continuity, and audit flag verification.
"""

import unittest
from parse.table_detector import TableDetector
from validate.reconciler import StatementValidator
from tests.fixtures import (
    SYNTHETIC_HBL_STATEMENT_TEXT,
    SYNTHETIC_MEEZAN_STATEMENT_TEXT,
    SYNTHETIC_CORRUPTED_STATEMENT_TEXT,
    get_fixture_lines
)


class TestReconciliation(unittest.TestCase):
    """Test suite for mathematical reconciliation and audit integrity."""

    def setUp(self):
        self.detector = TableDetector()
        self.validator = StatementValidator(confidence_threshold=0.85)

    def test_hbl_statement_end_to_end_reconciliation(self):
        lines = get_fixture_lines(SYNTHETIC_HBL_STATEMENT_TEXT)
        txs, meta, adapter_name = self.detector.extract(lines, source_file="hbl_sample.pdf")

        self.assertIn("Habib Bank", adapter_name)
        self.assertEqual(len(txs), 4)
        self.assertEqual(meta.opening_balance, 100000.00)
        self.assertEqual(meta.closing_balance, 125000.00)

        # Validate & Reconcile
        validated_txs, report = self.validator.validate_and_reconcile(txs, meta)

        self.assertTrue(report.is_balanced, f"HBL statement should balance: {report.issues}")
        self.assertEqual(report.difference, 0.0)
        self.assertEqual(report.total_credits, 50000.00)
        self.assertEqual(report.total_debits, 25000.00)
        self.assertEqual(report.net_transactions, 25000.00)
        self.assertTrue(report.running_balance_consistent)
        self.assertEqual(report.flagged_rows_count, 0)

        # Check strict CSV schema fields on first row
        csv_dict = validated_txs[0].to_csv_dict()
        expected_keys = {"date", "description", "amount", "notes", "source_file", "page", "confidence", "needs_review"}
        self.assertEqual(set(csv_dict.keys()), expected_keys)
        self.assertEqual(csv_dict["date"], "2024-01-02")
        self.assertEqual(csv_dict["amount"], "-4500.00")
        self.assertEqual(csv_dict["needs_review"], "false")

    def test_meezan_statement_end_to_end_reconciliation(self):
        lines = get_fixture_lines(SYNTHETIC_MEEZAN_STATEMENT_TEXT)
        txs, meta, adapter_name = self.detector.extract(lines, source_file="meezan_sample.pdf")

        self.assertIn("Meezan", adapter_name)
        self.assertEqual(len(txs), 4)
        self.assertEqual(meta.opening_balance, 50000.00)
        self.assertEqual(meta.closing_balance, 115250.00)

        validated_txs, report = self.validator.validate_and_reconcile(txs, meta)
        self.assertTrue(report.is_balanced, f"Meezan statement should balance: {report.issues}")
        self.assertEqual(report.difference, 0.0)
        self.assertEqual(report.flagged_rows_count, 0)

    def test_corrupted_statement_fails_loudly(self):
        lines = get_fixture_lines(SYNTHETIC_CORRUPTED_STATEMENT_TEXT)
        txs, meta, adapter_name = self.detector.extract(lines, source_file="corrupted.pdf")

        validated_txs, report = self.validator.validate_and_reconcile(txs, meta)

        # Reconciliation must fail loudly
        self.assertFalse(report.is_balanced)
        self.assertGreater(len(report.issues), 0)

        # Running balance should be flagged inconsistent
        self.assertFalse(report.running_balance_consistent)

        # Date bounds should fail because 05/02/2024 is out of January period
        self.assertFalse(report.date_bounds_consistent)

        # Every uncertain or failed row should have needs_review = True
        flagged = [tx for tx in validated_txs if tx.needs_review]
        self.assertGreater(len(flagged), 0)


if __name__ == "__main__":
    unittest.main()
