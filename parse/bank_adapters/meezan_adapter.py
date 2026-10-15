"""
Meezan Bank statement adapter.
Handles Meezan Islamic Banking statement layouts with specific transaction markers,
Withdrawals / Deposits columns, DR/CR suffixes, and Profit Distribution rows.
"""

import re
from typing import List, Optional
from parse.bank_adapters.base import BaseBankAdapter
from parse.models import ParsedTransaction, StatementMetadata, RawLine
from parse.date_parser import DateParser
from parse.amount_parser import AmountParser
from parse.multiline_merger import MultilineMerger


class MeezanBankAdapter(BaseBankAdapter):
    """Adapter for Meezan Bank Islamic Banking statement layouts."""

    def __init__(self):
        super().__init__(name="Meezan Bank Limited", default_currency="PKR")
        self.date_parser = DateParser(convention="DD/MM/YYYY")
        self.amount_parser = AmountParser()
        self.merger = MultilineMerger()

    def identify(self, text_samples: List[str]) -> float:
        combined = " ".join(text_samples).lower()
        score = 0.0
        if "meezan bank" in combined or "meezan" in combined:
            score += 0.6
        if "the premier islamic bank" in combined:
            score += 0.3
        if "withdrawals" in combined and "deposits" in combined:
            score += 0.2
        return min(score, 1.0)

    def extract_metadata(self, lines: List[RawLine]) -> StatementMetadata:
        meta = StatementMetadata(bank_name="Meezan Bank Limited", currency="PKR")
        full_text = "\n".join(line.text for line in lines[:50])

        # Account Number / IBAN
        iban_match = re.search(r"IBAN\s*[:.\-]?\s*(PK\d{2}MEZN\d{16})", full_text, re.IGNORECASE)
        if iban_match:
            iban = iban_match.group(1).strip()
            meta.account_number_masked = f"****{iban[-4:]}"
        else:
            acct_match = re.search(r"Account\s*No\s*[:.\-]?\s*([0-9\-]{10,24})", full_text, re.IGNORECASE)
            if acct_match:
                raw_acct = acct_match.group(1).strip()
                meta.account_number_masked = f"****{raw_acct[-4:]}"

        # Title
        title_match = re.search(r"(?:Title|Account\s+Title)\s*[:.\-]?\s*([A-Za-z\s.]+?)(?:\n|Branch)", full_text, re.IGNORECASE)
        if title_match:
            meta.account_title = title_match.group(1).strip()

        # Statement Period
        period_match = re.search(
            r"(?:From\s*Date|From|Period)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:To\s*Date|To|-)\s*([0-9A-Za-z\-/]+)",
            full_text,
            re.IGNORECASE
        )
        if period_match:
            meta.statement_start_date, _ = self.date_parser.parse(period_match.group(1))
            meta.statement_end_date, _ = self.date_parser.parse(period_match.group(2))

        # Opening Balance
        open_match = re.search(r"(?:Opening\s+Balance|Balance\s+B/F)\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if open_match:
            meta.opening_balance, _ = self.amount_parser.parse(open_match.group(1))

        # Closing Balance
        close_match = re.search(r"(?:Closing\s+Balance|Balance\s+C/F)\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
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

        date_pattern = re.compile(r"^(\d{1,2}[-/\s][A-Za-z0-9]{2,9}[-/\s]\d{2,4}|\d{1,2}[-/\s]\d{1,2}[-/\s]\d{2,4})")

        for line_item in lines:
            line_str = line_item.text.strip()
            if self.merger.is_noise_or_header(line_str):
                continue

            match_date = date_pattern.match(line_str)
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

                # In Meezan: Check for DR / CR tag at end of balance
                dr_cr_match = re.search(r"\b(DR|CR)\b", rest, re.IGNORECASE)
                dr_cr_indicator = dr_cr_match.group(1).upper() if dr_cr_match else ""

                num_matches = list(re.finditer(r"([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}|[0-9]+\.[0-9]{2})", rest))
                amount_val = 0.0
                running_bal = None
                notes_list = []
                desc_part = rest

                if len(num_matches) >= 2:
                    last_num_match = num_matches[-1]
                    bal_val, _ = self.amount_parser.parse(last_num_match.group(1))
                    running_bal = bal_val

                    amt_match = num_matches[-2]
                    raw_amt = amt_match.group(1)
                    desc_part = rest[:amt_match.start()].strip()

                    # Determine if Debit (Withdrawal) or Credit (Deposit)
                    # Check if line contains withdrawal keywords or if 3 numbers exist
                    if len(num_matches) >= 3:
                        with_str = num_matches[-3].group(1)
                        dep_str = num_matches[-2].group(1)
                        w_val, _ = self.amount_parser.parse(with_str)
                        d_val, _ = self.amount_parser.parse(dep_str)
                        if w_val and w_val > 0:
                            amount_val = -w_val
                        elif d_val and d_val > 0:
                            amount_val = d_val
                        desc_part = rest[:num_matches[-3].start()].strip()
                    else:
                        is_dr = bool(re.search(r"\b(ATM|POS|TRANSFER\s+TO|TAX|FED|CHARGES|WHT)\b", desc_part, re.IGNORECASE))
                        is_cr = bool(re.search(r"\b(PROFIT|SALARY|TRANSFER\s+FROM|DEPOSIT)\b", desc_part, re.IGNORECASE))
                        parsed_val, _ = self.amount_parser.parse(raw_amt, is_debit=is_dr, is_credit=is_cr)
                        amount_val = parsed_val or 0.0

                elif len(num_matches) == 1:
                    amt_match = num_matches[0]
                    parsed_val, _ = self.amount_parser.parse(amt_match.group(1))
                    amount_val = parsed_val or 0.0
                    desc_part = rest[:amt_match.start()].strip()

                cleaned_dict = self.merger.extract_notes_and_clean_title(desc_part)
                if cleaned_dict["notes"]:
                    notes_list.append(cleaned_dict["notes"])
                if running_bal is not None:
                    notes_list.append(f"Balance: {running_bal:.2f} {dr_cr_indicator}".strip())

                current_tx = ParsedTransaction(
                    date=iso_date or raw_date,
                    description=cleaned_dict["title"],
                    amount=amount_val,
                    notes="; ".join(notes_list),
                    source_file=source_file,
                    page=line_item.page,
                    confidence=min(date_conf, 0.95),
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
