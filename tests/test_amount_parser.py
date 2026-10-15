"""
Unit tests for amount parsing and signed decimal normalization.
Tests debit negative, credit positive, DR/CR, currency symbols, and parentheses.
"""

import unittest
from parse.amount_parser import AmountParser


class TestAmountParser(unittest.TestCase):
    """Test suite for AmountParser."""

    def setUp(self):
        self.parser = AmountParser()

    def test_standard_decimal(self):
        val, _ = self.parser.parse("1500.50")
        self.assertEqual(val, 1500.50)

    def test_comma_thousand_separators(self):
        val, _ = self.parser.parse("1,250,400.75")
        self.assertEqual(val, 1250400.75)

    def test_explicit_debit_column(self):
        # Even if positive in string, is_debit=True forces negative
        val, _ = self.parser.parse("4,500.00", is_debit=True)
        self.assertEqual(val, -4500.00)

    def test_explicit_credit_column(self):
        val, _ = self.parser.parse("50,000.00", is_credit=True)
        self.assertEqual(val, 50000.00)

    def test_dr_cr_suffixes(self):
        val_dr, _ = self.parser.parse("10,000.00 DR")
        self.assertEqual(val_dr, -10000.00)

        val_cr, _ = self.parser.parse("75,000.00 CR")
        self.assertEqual(val_cr, 75000.00)

    def test_parentheses_as_negative(self):
        val_paren, _ = self.parser.parse("(1,500.00)")
        self.assertEqual(val_paren, -1500.00)

    def test_currency_stripping(self):
        val_pkr, _ = self.parser.parse("PKR 8,500.00")
        self.assertEqual(val_pkr, 8500.00)

        val_rs, _ = self.parser.parse("Rs. -2,400.00")
        self.assertEqual(val_rs, -2400.00)

        val_usd, _ = self.parser.parse("$120.50")
        self.assertEqual(val_usd, 120.50)

    def test_empty_or_invalid(self):
        val, conf = self.parser.parse("")
        self.assertIsNone(val)
        self.assertEqual(conf, 0.0)

        val2, _ = self.parser.parse("N/A")
        self.assertIsNone(val2)


if __name__ == "__main__":
    unittest.main()
