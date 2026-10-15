"""
Habib Bank Limited (HBL) statement adapter.
Handles HBL standard multi-column layout with separate Debit and Credit columns,
Cheque Number column, and multi-line transaction narrations.
"""

import re
from typing import List, Optional
from parse.bank_adapters.base import BaseBankAdapter
from parse.models import ParsedTransaction, StatementMetadata, RawLine
from parse.date_parser import DateParser
from parse.amount_parser import AmountParser
from parse.multiline_merger import MultilineMerger


class HBLBankAdapter(BaseBankAdapter):
    """Adapter for Habib Bank Limited (HBL) statement layouts."""

    def __init__(self):
        super().__init__(name="Habib Bank Limited (HBL)", default_currency="PKR")
        self.date_parser = DateParser(convention="DD/MM/YYYY")
        self.amount_parser = AmountParser()
        self.merger = MultilineMerger()

    def identify(self, text_samples: List[str]) -> float:
        combined = " ".join(text_samples).lower()
        score = 0.0
        if "habib bank" in combined or "hbl" in combined:
            score += 0.6
        if "post date" in combined and "value date" in combined:
            score += 0.2
        if "cheque no" in combined or "chq no" in combined:
            score += 0.2
        return min(score, 1.0)

    def extract_metadata(self, lines: List[RawLine]) -> StatementMetadata:
        meta = StatementMetadata(bank_name="Habib Bank Limited (HBL)", currency="PKR")
        full_text = "\n".join(line.text for line in lines[:50])

        # Extract Account Number
        acct_match = re.search(r"Account\s*(?:No|Number)\s*[:.\-]?\s*([0-9\-]{10,24})", full_text, re.IGNORECASE)
        if acct_match:
            raw_acct = acct_match.group(1).strip()
            meta.account_number_masked = f"****{raw_acct[-4:]}"

        # Extract Account Title
        title_match = re.search(r"Title\s+of\s+Account\s*[:.\-]?\s*([A-Za-z\s.]+?)(?:\n|Account)", full_text, re.IGNORECASE)
        if title_match:
            meta.account_title = title_match.group(1).strip()

        # Extract Period: e.g. "From 01-Jan-2024 To 31-Jan-2024" or "01/01/2024 - 31/01/2024"
        period_match = re.search(
            r"(?:Period|Statement\s+Period|From)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:To|-)\s*([0-9A-Za-z\-/]+)",
            full_text,
            re.IGNORECASE
        )
        if period_match:
            start_str, end_str = period_match.group(1), period_match.group(2)
            parsed_start, _ = self.date_parser.parse(start_str)
            parsed_end, _ = self.date_parser.parse(end_str)
            meta.statement_start_date = parsed_start
            meta.statement_end_date = parsed_end

        # Extract Opening Balance
        open_match = re.search(r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if open_match:
            val, _ = self.amount_parser.parse(open_match.group(1))
            meta.opening_balance = val

        # Extract Closing Balance
        close_match = re.search(r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if close_match:
            val, _ = self.amount_parser.parse(close_match.group(1))
            meta.closing_balance = val

        # Total Debits / Credits if listed in summary
        deb_match = re.search(r"Total\s+Debits?\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if deb_match:
            val, _ = self.amount_parser.parse(deb_match.group(1))
            meta.total_debits = val

        cred_match = re.search(r"Total\s+Credits?\s*[:.\-]?\s*([0-9,.]+)", full_text, re.IGNORECASE)
        if cred_match:
            val, _ = self.amount_parser.parse(cred_match.group(1))
            meta.total_credits = val

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

        # Standard HBL line pattern:
        # Date (DD-MM-YYYY or DD/MM/YYYY) followed by Value Date (optional), Description, [Debit], [Credit], [Balance]
        date_pattern = re.compile(r"^(\d{1,2}[-/\s][A-Za-z0-9]{2,9}[-/\s]\d{2,4}|\d{1,2}[-/\s]\d{1,2}[-/\s]\d{2,4})")

        prev_known_balance = metadata.opening_balance

        for line_item in lines:
            line_str = line_item.text.strip()
            if self.merger.is_noise_or_header(line_str):
                continue

            match_date = date_pattern.match(line_str)
            if match_date:
                # Flush previous transaction if open
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

                # Check if second date (Value date) is present
                match_vdate = date_pattern.match(rest)
                vdate_note = ""
                if match_vdate:
                    vdate_str = match_vdate.group(1)
                    vdate_note = f"Value Date: {vdate_str}"
                    rest = rest[len(vdate_str):].strip()

                # Extract trailing numbers (Debit, Credit, Balance)
                num_matches = list(re.finditer(r"([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}|[0-9]+\.[0-9]{2})", rest))
                
                amount_val = 0.0
                running_bal = None
                notes_list = [vdate_note] if vdate_note else []
                desc_part = rest

                if len(num_matches) >= 2:
                    last_num_match = num_matches[-1]
                    bal_val, _ = self.amount_parser.parse(last_num_match.group(1))
                    running_bal = bal_val

                    amt_match = num_matches[-2]
                    raw_amt = amt_match.group(1)
                    parsed_a, _ = self.amount_parser.parse(raw_amt)
                    base_a = abs(parsed_a or 0.0)

                    # If 3 numbers present: [Debit, Credit, Balance]
                    if len(num_matches) >= 3:
                        deb_str = num_matches[-3].group(1)
                        cred_str = num_matches[-2].group(1)
                        d_val, _ = self.amount_parser.parse(deb_str)
                        c_val, _ = self.amount_parser.parse(cred_str)
                        if d_val and d_val > 0:
                            amount_val = -d_val
                        elif c_val and c_val > 0:
                            amount_val = c_val
                        desc_part = rest[:num_matches[-3].start()].strip()
                    else:
                        # 2 numbers: Amount and Balance. Infer sign from running balance change or description
                        if running_bal is not None and prev_known_balance is not None:
                            diff = running_bal - prev_known_balance
                            if diff < -0.01:
                                amount_val = -base_a
                            elif diff > 0.01:
                                amount_val = base_a
                            else:
                                amount_val = base_a
                        else:
                            # Check column spacing or keywords
                            is_deb = bool(re.search(r"\b(CHQ|TAX|FEE|WITHDRAW|BILL|K-ELECTRIC|AWS|SERVER|PURCHASE)\b", rest, re.IGNORECASE))
                            amount_val = -base_a if is_deb else base_a

                        desc_part = rest[:amt_match.start()].strip()

                    if running_bal is not None:
                        prev_known_balance = running_bal

                elif len(num_matches) == 1:
                    amt_match = num_matches[0]
                    parsed_a, _ = self.amount_parser.parse(amt_match.group(1))
                    amount_val = parsed_a or 0.0
                    desc_part = rest[:amt_match.start()].strip()

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
                    confidence=min(date_conf, 0.95),
                    running_balance=running_bal,
                    raw_text=line_str
                )
            else:
                # Continuation description line
                if current_tx:
                    pending_desc_lines.append(line_str)

        # Flush final
        if current_tx:
            if pending_desc_lines:
                merged = self.merger.merge_descriptions([current_tx.description] + pending_desc_lines)
                extracted = self.merger.extract_notes_and_clean_title(merged)
                current_tx.description = extracted["title"]
                if extracted["notes"]:
                    current_tx.notes = f"{current_tx.notes}; {extracted['notes']}".strip("; ")
            transactions.append(current_tx)

        return transactions
