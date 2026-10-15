"""
Unit tests for multi-line description merging, whitespace collapsing,
and cheque / reference extraction.
"""

import unittest
from parse.multiline_merger import MultilineMerger


class TestMultilineMerger(unittest.TestCase):
    """Test suite for MultilineMerger."""

    def setUp(self):
        self.merger = MultilineMerger()

    def test_collapse_whitespace(self):
        raw = "  OFFICE   SUPPLIES    MART   \n\t KARACHI  "
        clean = self.merger.collapse_whitespace(raw)
        self.assertEqual(clean, "OFFICE SUPPLIES MART KARACHI")

    def test_merge_descriptions_multiple_lines(self):
        lines = [
            "CLOUD INFRASTRUCTURE",
            "SERVER HOSTING US-EAST",
            "MONTHLY SUBSCRIPTION"
        ]
        merged = self.merger.merge_descriptions(lines)
        self.assertEqual(merged, "CLOUD INFRASTRUCTURE SERVER HOSTING US-EAST MONTHLY SUBSCRIPTION")

    def test_filter_noise_and_repeated_headers(self):
        self.assertTrue(self.merger.is_noise_or_header("Page 2 of 4"))
        self.assertTrue(self.merger.is_noise_or_header("Date Particulars Debit Credit Balance"))
        self.assertTrue(self.merger.is_noise_or_header("Carried Forward"))
        self.assertTrue(self.merger.is_noise_or_header("Closing Balance"))
        self.assertFalse(self.merger.is_noise_or_header("ATM CASH WITHDRAWAL CLIFTON"))

    def test_extract_cheque_and_iban_notes(self):
        text = "OFFICE SUPPLIES MART CHQ# 982141 KARACHI"
        result = self.merger.extract_notes_and_clean_title(text)
        self.assertEqual(result["title"], "OFFICE SUPPLIES MART KARACHI")
        self.assertIn("Cheque: 982141", result["notes"])

        iban_text = "CLIENT RETAINER PK36HABB00129847192837 PAYMENT"
        result_iban = self.merger.extract_notes_and_clean_title(iban_text)
        self.assertIn("IBAN: PK36HABB00129847192837", result_iban["notes"])


if __name__ == "__main__":
    unittest.main()
