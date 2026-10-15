"""
Unit tests for date parsing and ISO 8601 normalization.
Tests DD/MM/YYYY, MM/DD/YYYY, D-Mon-YYYY, and missing year inference.
"""

import unittest
from parse.date_parser import DateParser


class TestDateParser(unittest.TestCase):
    """Test suite for DateParser."""

    def setUp(self):
        self.parser_dmy = DateParser(default_year=2024, convention="DD/MM/YYYY")
        self.parser_mdy = DateParser(default_year=2024, convention="MM/DD/YYYY")

    def test_iso_format(self):
        parsed, conf = self.parser_dmy.parse("2024-03-15")
        self.assertEqual(parsed, "2024-03-15")
        self.assertAlmostEqual(conf, 1.0)

    def test_dd_mm_yyyy_slash(self):
        parsed, _ = self.parser_dmy.parse("15/01/2024")
        self.assertEqual(parsed, "2024-01-15")

    def test_dd_mm_yyyy_hyphen(self):
        parsed, _ = self.parser_dmy.parse("31-12-2023")
        self.assertEqual(parsed, "2023-12-31")

    def test_textual_month_dd_mon_yyyy(self):
        parsed, _ = self.parser_dmy.parse("05-Jan-2024")
        self.assertEqual(parsed, "2024-01-05")

        parsed2, _ = self.parser_dmy.parse("28 Feb 2024")
        self.assertEqual(parsed2, "2024-02-28")

    def test_infer_missing_year_from_period(self):
        # Transaction only says "15 Jan" or "15/01", infer 2024 from statement period
        parsed, conf = self.parser_dmy.parse("15-Jan", period_year=2024)
        self.assertEqual(parsed, "2024-01-15")
        self.assertGreater(conf, 0.8)

        parsed_num, _ = self.parser_dmy.parse("15/01", period_year=2024)
        self.assertEqual(parsed_num, "2024-01-15")

    def test_mm_dd_yyyy_convention(self):
        parsed, _ = self.parser_mdy.parse("03/15/2024")
        self.assertEqual(parsed, "2024-03-15")

    def test_invalid_dates(self):
        parsed, conf = self.parser_dmy.parse("not-a-date")
        self.assertIsNone(parsed)
        self.assertEqual(conf, 0.0)

        # 31st of February does not exist
        parsed_inv, _ = self.parser_dmy.parse("31/02/2024")
        self.assertIsNone(parsed_inv)


if __name__ == "__main__":
    unittest.main()
