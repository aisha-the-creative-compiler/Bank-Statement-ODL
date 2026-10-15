"""
Configurable bank adapter driven by BankLayoutConfig.
Dynamically handles layout quirks, dual dates, DR/CR suffixes, Islamic banking tags,
and custom column mapping for any registered bank profile.
"""

import re
from typing import List, Optional
from parse.bank_adapters.base import BaseBankAdapter
from parse.config.bank_profile import BankLayoutConfig
from parse.models import ParsedTransaction, StatementMetadata, RawLine
from parse.date_parser import DateParser
from parse.amount_parser import AmountParser
from parse.multiline_merger import MultilineMerger


class ConfigurableBankAdapter(BaseBankAdapter):
    """
    Universal bank adapter parameterized by a BankLayoutConfig.
    Executes bank-specific quirk handlers based on configuration flags.
    """

    def __init__(self, config: BankLayoutConfig):
        super().__init__(name=config.bank_name, default_currency=config.currency)
        self.config = config
        self.date_parser = DateParser(convention=config.date_convention)
        self.amount_parser = AmountParser()
        self.merger = MultilineMerger()

    def identify(self, text_samples: List[str]) -> float:
        combined = " ".join(text_samples).lower()
        if not self.config.keywords:
            return 0.1

        matched = sum(1 for kw in self.config.keywords if kw.lower() in combined)
        if matched == 0:
            return 0.0

        score = matched / len(self.config.keywords)
        if self.config.bank_name.lower() in combined or self.config.bank_id.lower() in combined:
            score = max(score, 0.85)

        return min(score, 1.0)

    def extract_metadata(self, lines: List[RawLine]) -> StatementMetadata:
        meta = StatementMetadata(bank_name=self.config.bank_name, currency=self.config.currency)
        full_text = "\n".join(line.text for line in lines[:60])

        # Account Number
        if self.config.account_number_regex:
            acct_match = re.search(self.config.account_number_regex, full_text, re.IGNORECASE)
            if acct_match:
                # Get the first non-None group
                raw_acct = next((g for g in acct_match.groups() if g is not None), "").strip()
                if raw_acct:
                    meta.account_number_masked = f"****{raw_acct[-4:]}"

        # Title
        title_match = re.search(r"(?:Title|Account\s+Title|Title\s+of\s+Account|Customer|Name)\s*[:.\-]?\s*([A-Za-z\s.]+?)(?:\n|Account|Branch|$)", full_text, re.IGNORECASE)
        if title_match:
            meta.account_title = title_match.group(1).strip()

        # Statement Period
        if self.config.statement_period_regex:
            period_match = re.search(self.config.statement_period_regex, full_text, re.IGNORECASE)
            if period_match and len(period_match.groups()) >= 2:
                start_raw = period_match.group(1)
                end_raw = period_match.group(2)
                meta.statement_start_date, _ = self.date_parser.parse(start_raw)
                meta.statement_end_date, _ = self.date_parser.parse(end_raw)

        # Opening Balance
        if self.config.opening_balance_regex:
            open_match = re.search(self.config.opening_balance_regex, full_text, re.IGNORECASE)
            if open_match:
                val, _ = self.amount_parser.parse(open_match.group(1))
                meta.opening_balance = val

        # Closing Balance
        if self.config.closing_balance_regex:
            close_match = re.search(self.config.closing_balance_regex, full_text, re.IGNORECASE)
            if close_match:
                val, _ = self.amount_parser.parse(close_match.group(1))
                meta.closing_balance = val

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
        prev_known_balance = metadata.opening_balance

        date_pattern = re.compile(
            r"^(\d{1,2}[-/\s][A-Za-z]{3,9}[-/\s]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"
        )

        for line_item in lines:
            line_str = line_item.text.strip()

            # Ignore noise and headers based on quirk settings
            if self.config.quirks.ignore_repeated_headers:
                if self.merger.is_noise_or_header(line_str):
                    continue
                # Also check custom bank ignore patterns
                should_ignore = False
                for pattern in self.config.quirks.ignore_patterns:
                    if re.search(pattern, line_str, re.IGNORECASE):
                        should_ignore = True
                        break
                if should_ignore:
                    continue

            match_date = date_pattern.match(line_str)
            if match_date:
                # Flush existing transaction
                if current_tx:
                    self._finalize_transaction(current_tx, pending_desc_lines)
                    transactions.append(current_tx)
                    pending_desc_lines = []

                raw_date = match_date.group(1)
                iso_date, date_conf = self.date_parser.parse(raw_date, period_year=period_year)
                rest = line_str[len(raw_date):].strip()

                notes_list = []

                # Quirk: Dual Dates (e.g. HBL Post Date followed immediately by Value Date)
                if self.config.quirks.has_dual_dates:
                    match_vdate = date_pattern.match(rest)
                    if match_vdate:
                        vdate_str = match_vdate.group(1)
                        notes_list.append(f"Value Date: {vdate_str}")
                        rest = rest[len(vdate_str):].strip()

                # Quirk: Check for DR / CR indicator suffix (e.g. Meezan "115,000.00 CR")
                dr_cr_tag = ""
                if self.config.quirks.has_dr_cr_indicator:
                    dr_cr_match = re.search(r"\b(DR|CR)\b", rest, re.IGNORECASE)
                    if dr_cr_match:
                        dr_cr_tag = dr_cr_match.group(1).upper()

                # Extract trailing numbers
                num_matches = list(re.finditer(r"([+-]?\(?[0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}\)?|\b[0-9]+\.[0-9]{2}\b)", rest))
                amount_val = 0.0
                running_bal = None
                desc_part = rest

                if len(num_matches) >= 2:
                    last_num = num_matches[-1]
                    bal_val, _ = self.amount_parser.parse(last_num.group(1))
                    running_bal = bal_val

                    amt_match = num_matches[-2]
                    raw_amt = amt_match.group(1)
                    parsed_a, a_conf = self.amount_parser.parse(raw_amt)
                    base_a = abs(parsed_a or 0.0)

                    # Check if 3 numbers exist (Debit, Credit, Balance)
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
                        # 2 numbers: determine sign from running balance delta or keywords
                        if running_bal is not None and prev_known_balance is not None:
                            delta = running_bal - prev_known_balance
                            if delta < -0.01:
                                amount_val = -base_a
                            elif delta > 0.01:
                                amount_val = base_a
                            else:
                                amount_val = base_a
                        else:
                            is_deb = bool(re.search(r"\b(CHQ|TAX|FEE|WITHDRAW|BILL|PURCHASE|ATM|POS)\b", rest, re.IGNORECASE))
                            amount_val = -base_a if is_deb else base_a

                        desc_part = rest[:amt_match.start()].strip()

                    if running_bal is not None:
                        prev_known_balance = running_bal

                    row_conf = min(date_conf, a_conf, line_item.confidence)

                elif len(num_matches) == 1:
                    amt_match = num_matches[0]
                    parsed_a, a_conf = self.amount_parser.parse(amt_match.group(1))
                    amount_val = parsed_a or 0.0
                    desc_part = rest[:amt_match.start()].strip()
                    row_conf = min(date_conf, a_conf, line_item.confidence)
                else:
                    row_conf = 0.5

                # Clean title and extract secondary tokens (cheque, IBAN, ref)
                cleaned_dict = self.merger.extract_notes_and_clean_title(desc_part)
                clean_title = cleaned_dict["title"]

                if cleaned_dict["notes"]:
                    notes_list.append(cleaned_dict["notes"])

                # Quirk: Islamic banking tags
                if self.config.quirks.islamic_banking_tags:
                    if "profit distribution" in clean_title.lower():
                        notes_list.append("Islamic Mudarabah Profit")
                    elif "withholding tax" in clean_title.lower() or "wht" in clean_title.lower():
                        notes_list.append("Withholding Tax 236P")

                if running_bal is not None:
                    bal_str = f"Balance: {running_bal:.2f}"
                    if dr_cr_tag:
                        bal_str += f" {dr_cr_tag}"
                    notes_list.append(bal_str)

                current_tx = ParsedTransaction(
                    date=iso_date or raw_date,
                    description=clean_title,
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
            self._finalize_transaction(current_tx, pending_desc_lines)
            transactions.append(current_tx)

        return transactions

    def _finalize_transaction(self, tx: ParsedTransaction, pending_desc_lines: List[str]) -> None:
        """Merges pending wrapped description lines into the transaction."""
        if pending_desc_lines:
            merged = self.merger.merge_descriptions([tx.description] + pending_desc_lines)
            extracted = self.merger.extract_notes_and_clean_title(merged)
            tx.description = extracted["title"]
            if extracted["notes"]:
                tx.notes = f"{tx.notes}; {extracted['notes']}".strip("; ")
