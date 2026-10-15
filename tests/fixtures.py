"""
Synthetic test fixtures for bank statement parsing and reconciliation.
Contains realistic synthetic statements for HBL, Meezan, and generic banks
with no real personal or account data.
"""

from parse.models import RawLine

# Synthetic HBL Statement Text (Balanced, 4 transactions)
SYNTHETIC_HBL_STATEMENT_TEXT = """
HABIB BANK LIMITED
BRANCH: I.I. CHUNDRIGAR ROAD KARACHI
ACCOUNT STATEMENT
Title of Account: TECH CORP VENTURES PVT LTD
Account Number: 0012-7890-4432-1100
Currency: PKR
Statement Period: From 01-Jan-2024 To 31-Jan-2024
Opening Balance: 100,000.00
---------------------------------------------------------------------------------------------------------
Post Date   Value Date  Description / Narration                 Cheque No     Debit       Credit      Balance
---------------------------------------------------------------------------------------------------------
02-Jan-2024 02-Jan-2024 OFFICE SUPPLIES MART                                4,500.00                95,500.00
                        CHQ# 982141 KARACHI
05-Jan-2024 05-Jan-2024 CLIENT RETAINER PAYMENT                                         50,000.00   145,500.00
                        IBAN: PK36HABB00129847192837
12-Jan-2024 12-Jan-2024 CLOUD INFRASTRUCTURE SERVER HOSTING                 12,500.00               133,000.00
                        REF: AWS-PK-991823
20-Jan-2024 20-Jan-2024 UTILITY BILL PAYMENT K-ELECTRIC                     8,000.00                125,000.00
---------------------------------------------------------------------------------------------------------
Total Debits: 25,000.00   Total Credits: 50,000.00   Closing Balance: 125,000.00
"""

# Synthetic Meezan Statement Text (Balanced, Islamic profit distribution)
SYNTHETIC_MEEZAN_STATEMENT_TEXT = """
MEEZAN BANK LIMITED
The Premier Islamic Bank
STATEMENT OF ACCOUNT
Account Title: CREATIVE DESIGN STUDIO
IBAN: PK36MEZN0099281726354412
Statement Period: From 01/02/2024 To 28/02/2024
Opening Balance: 50,000.00
---------------------------------------------------------------------------------------------------------
Date        Particulars / Narration                 Withdrawals (DR)    Deposits (CR)       Balance (PKR)
---------------------------------------------------------------------------------------------------------
03/02/2024  ATM CASH WITHDRAWAL CLIFTON BR           10,000.00                               40,000.00 DR
08/02/2024  INWARD REMITTANCE EXPORT EARNINGS                            75,000.00          115,000.00 CR
            FT240192837 FREELANCE SERVICES
15/02/2024  WITHHOLDING TAX SECTION 236P                375.00                              114,625.00 CR
28/02/2024  MONTHLY PROFIT DISTRIBUTION                                    625.00          115,250.00 CR
---------------------------------------------------------------------------------------------------------
Closing Balance: 115,250.00
"""

# Synthetic Corrupted Statement Text (Has balance jump and date out of range)
SYNTHETIC_CORRUPTED_STATEMENT_TEXT = """
GENERIC TEST BANK
Account No: 123456789
Statement Period: From 01/01/2024 to 31/01/2024
Opening Balance: 10,000.00
-----------------------------------------------------------------------------------------
Date        Description                                Amount           Balance
-----------------------------------------------------------------------------------------
05/01/2024  MERCHANT PURCHASE - GROCERY STORE         -2,000.00         8,000.00
10/01/2024  HARDWARE STORE                             -1,500.00         6,500.00
15/01/2024  CORRUPTED ROW ENTRY (WRONG JUMP)           -500.00          4,000.00
05/02/2024  OUT OF PERIOD TRANSACTION (FEB IN JAN)    +2,000.00         6,000.00
-----------------------------------------------------------------------------------------
Closing Balance: 9,000.00
"""


def get_fixture_lines(text: str) -> list[RawLine]:
    """Helper to convert multiline string into List[RawLine]."""
    lines = []
    for idx, line in enumerate(text.strip().split("\n"), start=1):
        lines.append(RawLine(text=line, page=1, line_number=idx, confidence=1.0))
    return lines
