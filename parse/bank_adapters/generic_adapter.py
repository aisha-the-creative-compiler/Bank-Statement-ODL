"""
Generic bank statement adapter.
Provides bank-agnostic fallback parsing for any standard tabular statement.
Autodetects table structures, date conventions, and debit/credit columns.
"""

import re
from typing import List, Optional
from parse.bank_adapters.base import BaseBankAdapter
from parse.models import ParsedTransaction, StatementMetadata, RawLine
from parse.date_parser import DateParser
from parse.amount_parser import AmountParser
from parse.multiline_merger import MultilineMerger


class GenericBankAdapter(BaseBankAdapter):
    """Universal bank statement adapter."""

    def __init__(self, convention: str = "DD/MM/YYYY", currency: str = "PKR"):
        super().__init__(name="Generic Statement Adapter", default_currency=currency)
        self.date_parser = DateParser(convention=convention)
        self.amount_parser = AmountParser()
        self.merger = MultilineMerger()

    def identify(self, text_samples: List[str]) -> float:
        return 0.1  # Fallback

    def extract_metadata(self, lines: List[RawLine]) -> StatementMetadata:
        meta = StatementMetadata(bank_name="Bank Statement", currency=self.default_currency)
        full_text = "\n".join(line.text for line in lines[:60])

        # Account number
        acct_match = re.search(r"(?:Account|IBAN|Acc)\s*(?:No|#)?\s*[:.\-]?\s*([A-Za-z0-9\-]{8,30})", full_text, re.IGNORECASE)
        if acct_match:
            raw = acct_match.group(1).strip()
            meta.account_number_masked = f"****{raw[-4:]}"

        # Title
        title_match = re.search(r"(?:Name|Title|Customer)\s*[:.\-]?\s*([A-Za-z\s.]+?)(?:\n|$)", full_text, re.IGNORECASE)
        if title_match:
            meta.account_title = title_match.group(1).strip()

        # Period: e.g. "Statement Period: From 01/01/2024 to 31/01/2024"
        period_match = re.search(
            r"(?:Period|Statement\s+Period|Date\s+Range)\s*[:.\-]?\s*(?:From\s+)?([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)",
            full_text,
            re.IGNORECASE
        )
        if period_match:
            meta.statement_start_date, _ = self.date_parser.parse(period_match.group(1))
            meta.statement_end_date, _ = self.date_parser.parse(period_match.group(2))

        # Opening balance
        open_match = re.search(r"(?:Opening\s+Balance|Balance\s+Brought\s+Forward|B/F)\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if open_match:
            meta.opening_balance, _ = self.amount_parser.parse(open_match.group(1))

        # Closing balance
        close_match = re.search(r"(?:Closing\s+Balance|Ending\s+Balance|Balance\s+Carried\s+Forward|C/F)\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if close_match:
            meta.closing_balance, _ = self.amount_parser.parse(close_match.group(1))

        return meta

    def parse_transactions(
        self,
        lines: List[RawLine],
        metadata: StatementMetadata,
        source_file: str = "statement.pdf"
    ) -> List[ParsedTransaction]:
        transactions: List[ParsedTransaction] = []
        period_year = None
        if metadata.statement_end_date:
            try:
                period_year = int(metadata.statement_end_date.split("-")[0])
            except ValueError:
                pass

        current_tx: Optional[ParsedTransaction] = None
        pending_desc_lines: List[str] = []

        date_regex = re.compile(
            r"^(\d{1,2}[-/\s][A-Za-z]{3,9}[-/\s]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"
        )

        for line_item in lines:
            line_str = line_item.text.strip()
            if self.merger.is_noise_or_header(line_str):
                continue

            match_date = date_regex.match(line_str)
            if match_date:
                if current_tx:
                    if pending_desc_lines:
                        merged = self.merger.merge_descriptions([current_tx.description] + pending_desc_lines)
                        extracted = self.merger.extract_notes_and_clean_title(merged)
                        current_tx.description = extracted["title"]
                        if extracted["notes"]:
                            current_tx.notes = f"{current_tx.notes}; {extracted['notes']}".strip("; ")
                    transactions.append(current_tx)
                    pending_desc_lines = []

                raw_date = match_date.group(1)
                iso_date, date_conf = self.date_parser.parse(raw_date, period_year=period_year)
                rest = line_str[len(raw_date):].strip()

                num_matches = list(re.finditer(r"([+-]?\(?[0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}\)?|\b[0-9]+\.[0-9]{2}\b)", rest))
                amount_val = 0.0
                running_bal = None
                notes_list = []
                desc_part = rest

                if len(num_matches) >= 2:
                    last_num = num_matches[-1]
                    bal_val, _ = self.amount_parser.parse(last_num.group(1))
                    running_bal = bal_val

                    amt_match = num_matches[-2]
                    raw_amt = amt_match.group(1)
                    parsed_amt, amt_conf = self.amount_parser.parse(raw_amt)
                    amount_val = parsed_amt or 0.0
                    desc_part = rest[:amt_match.start()].strip()
                    row_conf = min(date_conf, amt_conf, line_item.confidence)

                elif len(num_matches) == 1:
                    amt_match = num_matches[0]
                    raw_amt = amt_match.group(1)
                    parsed_amt, amt_conf = self.amount_parser.parse(raw_amt)
                    amount_val = parsed_amt or 0.0
                    desc_part = rest[:amt_match.start()].strip()
                    row_conf = min(date_conf, amt_conf, line_item.confidence)
                else:
                    row_conf = 0.5

                cleaned_dict = self.merger.extract_notes_and_clean_title(desc_part)
                if cleaned_dict["notes"]:
                    notes_list.append(cleaned_dict["notes"])
                if running_bal is not None:
                    notes_list.append(f"Balance: {running_bal:.2f}")

                current_tx = ParsedTransaction(
                    date=iso_date or raw_date,
                    description=cleaned_dict["title"],
                    amount=amount_val,
                    notes="; ".join(notes_list),
                    source_file=source_file,
                    page=line_item.page,
                    confidence=row_conf,
                    running_balance=running_bal,
                    raw_text=line_str
                )
            else:
                if current_tx:
                    pending_desc_lines.append(line_str)

        if current_tx:
            if pending_desc_lines:
                merged = self.merger.merge_descriptions([current_tx.description] + pending_desc_lines)
                extracted = self.merger.extract_notes_and_clean_title(merged)
                current_tx.description = extracted["title"]
                if extracted["notes"]:
                    current_tx.notes = f"{current_tx.notes}; {extracted['notes']}".strip("; ")
            transactions.append(current_tx)

        return transactions
