"""
Built-in bank configuration profiles for major Pakistani and international banks.
Includes explicit quirks and column mappings for HBL, Meezan, Bank Alfalah,
Standard Chartered, MCB, and Generic fallback.
"""

from typing import Dict
from .bank_profile import BankLayoutConfig, ColumnMapping, QuirkSettings


BUILTIN_BANK_PROFILES: Dict[str, BankLayoutConfig] = {
    # 1. Habib Bank Limited (HBL)
    "hbl": BankLayoutConfig(
        bank_id="hbl",
        bank_name="Habib Bank Limited (HBL)",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=["habib bank", "hbl", "habib bank limited", "i.i. chundrigar"],
        account_number_regex=r"Account\s*(?:No|Number)\s*[:.\-]?\s*([0-9\-]{10,24})",
        statement_period_regex=r"(?:Period|Statement\s+Period|From)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:To|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(
            date_aliases=["post date", "date"],
            description_aliases=["description / narration", "narration", "description"],
            debit_aliases=["debit", "dr"],
            credit_aliases=["credit", "cr"],
            balance_aliases=["balance"],
            cheque_aliases=["cheque no", "chq no"]
        ),
        quirks=QuirkSettings(
            has_dual_dates=True,             # Post Date and Value Date
            cheque_in_separate_col=True,     # Cheque No column
            has_dr_cr_indicator=False,
            running_balance_in_table=True,
            tax_codes_to_notes=True,
            islamic_banking_tags=False,
            ignore_repeated_headers=True
        )
    ),

    # 2. Meezan Bank Limited (Islamic Banking)
    "meezan": BankLayoutConfig(
        bank_id="meezan",
        bank_name="Meezan Bank Limited",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=["meezan bank", "meezan", "the premier islamic bank", "meezan bank limited"],
        account_number_regex=r"IBAN\s*[:.\-]?\s*(PK\d{2}MEZN\d{16})|Account\s*No\s*[:.\-]?\s*([0-9\-]{10,24})",
        statement_period_regex=r"(?:From\s*Date|From|Period)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:To\s*Date|To|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"(?:Opening\s+Balance|Balance\s+B/F)\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"(?:Closing\s+Balance|Balance\s+C/F)\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(
            date_aliases=["date", "value date"],
            description_aliases=["particulars / narration", "particulars", "description"],
            debit_aliases=["withdrawals (dr)", "withdrawals", "debit"],
            credit_aliases=["deposits (cr)", "deposits", "credit"],
            balance_aliases=["balance (pkr)", "balance"]
        ),
        quirks=QuirkSettings(
            has_dual_dates=False,
            cheque_in_separate_col=False,
            has_dr_cr_indicator=True,        # Suffix DR / CR on balance
            running_balance_in_table=True,
            tax_codes_to_notes=True,
            islamic_banking_tags=True,       # Mudarabah profit distribution, Halal tags
            ignore_repeated_headers=True
        )
    ),

    # 3. Bank Alfalah Limited (BAFL)
    "bafl": BankLayoutConfig(
        bank_id="bafl",
        bank_name="Bank Alfalah Limited",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=["bank alfalah", "alfalah", "bafl"],
        account_number_regex=r"(?:Account|IBAN)\s*(?:No|#)?\s*[:.\-]?\s*([A-Za-z0-9\-]{10,24})",
        statement_period_regex=r"(?:Statement\s+Period|Period)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(
            date_aliases=["tran date", "date"],
            description_aliases=["particulars", "transaction particulars"],
            debit_aliases=["debit", "dr"],
            credit_aliases=["credit", "cr"],
            balance_aliases=["balance"],
            cheque_aliases=["instrument no", "chq no"]
        ),
        quirks=QuirkSettings(
            has_dual_dates=False,
            cheque_in_separate_col=True,
            has_dr_cr_indicator=False,
            running_balance_in_table=True,
            tax_codes_to_notes=True,
            islamic_banking_tags=False,
            ignore_repeated_headers=True
        )
    ),

    # 4. Standard Chartered Bank (SCB)
    "scb": BankLayoutConfig(
        bank_id="scb",
        bank_name="Standard Chartered Bank",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=["standard chartered", "scb", "standard chartered bank"],
        account_number_regex=r"Account\s*Number\s*[:.\-]?\s*([0-9\-]{10,24})",
        statement_period_regex=r"(?:Statement\s+Period|From)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(
            date_aliases=["booking date", "date"],
            description_aliases=["transaction details", "description"],
            debit_aliases=["withdrawal", "debit"],
            credit_aliases=["deposit", "credit"],
            balance_aliases=["balance"]
        ),
        quirks=QuirkSettings(
            has_dual_dates=True,
            cheque_in_separate_col=False,
            has_dr_cr_indicator=False,
            running_balance_in_table=True,
            tax_codes_to_notes=True,
            islamic_banking_tags=False,
            ignore_repeated_headers=True
        )
    ),

    # 5. MCB Bank Limited
    "mcb": BankLayoutConfig(
        bank_id="mcb",
        bank_name="MCB Bank Limited",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=["mcb bank", "mcb", "muslim commercial bank"],
        account_number_regex=r"Account\s*No\s*[:.\-]?\s*([0-9\-]{10,24})",
        statement_period_regex=r"(?:Period|From)\s*[:.\-]?\s*([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"Opening\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"Closing\s+Balance\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(
            date_aliases=["date", "trans date"],
            description_aliases=["particulars", "description"],
            debit_aliases=["debit", "withdrawal"],
            credit_aliases=["credit", "deposit"],
            balance_aliases=["balance"]
        ),
        quirks=QuirkSettings(
            has_dual_dates=False,
            cheque_in_separate_col=True,
            has_dr_cr_indicator=False,
            running_balance_in_table=True,
            tax_codes_to_notes=True,
            islamic_banking_tags=False,
            ignore_repeated_headers=True
        )
    ),

    # 6. Generic Universal Fallback
    "generic": BankLayoutConfig(
        bank_id="generic",
        bank_name="Generic Bank Statement",
        currency="PKR",
        date_convention="DD/MM/YYYY",
        keywords=[],
        account_number_regex=r"(?:Account|IBAN|Acc)\s*(?:No|#)?\s*[:.\-]?\s*([A-Za-z0-9\-]{8,30})",
        statement_period_regex=r"(?:Period|Statement\s+Period|Date\s+Range)\s*[:.\-]?\s*(?:From\s+)?([0-9A-Za-z\-/]+)\s*(?:to|-)\s*([0-9A-Za-z\-/]+)",
        opening_balance_regex=r"(?:Opening\s+Balance|Balance\s+Brought\s+Forward|B/F)\s*[:.\-]?\s*([0-9,.]+)",
        closing_balance_regex=r"(?:Closing\s+Balance|Ending\s+Balance|Balance\s+Carried\s+Forward|C/F)\s*[:.\-]?\s*([0-9,.]+)",
        column_mapping=ColumnMapping(),
        quirks=QuirkSettings()
    )
}
