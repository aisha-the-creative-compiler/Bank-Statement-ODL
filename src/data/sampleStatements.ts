import { BankPreset } from '../types/statement';

export const SAMPLE_STATEMENTS: BankPreset[] = [
  // 1. Habib Bank Limited (HBL)
  {
    id: 'hbl-jan-2024',
    name: 'Habib Bank Limited (HBL) - Jan 2024',
    bank_code: 'hbl',
    filename: 'HBL_Statement_Jan2024.pdf',
    doc_type: 'digital_pdf',
    currency: 'PKR',
    badge: 'Digital PDF • Reconciled',
    detectedQuirks: [
      'Dual Dates: Post Date vs Value Date disambiguation',
      'Cheque Number separation to notes (CHQ# 982141)',
      'Page-break carried-forward balance suppression',
      'Separate Debit & Credit columns with running balance',
    ],
    metadata: {
      bank_name: 'Habib Bank Limited (HBL)',
      account_number_masked: '****1100',
      account_title: 'TECH CORP VENTURES PVT LTD',
      currency: 'PKR',
      statement_start_date: '2024-01-01',
      statement_end_date: '2024-01-31',
      opening_balance: 100000.0,
      closing_balance: 125000.0,
      total_debits: 25000.0,
      total_credits: 50000.0,
    },
    documentText: `HABIB BANK LIMITED
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
Total Debits: 25,000.00   Total Credits: 50,000.00   Closing Balance: 125,000.00`,
    initialTransactions: [
      {
        id: 'hbl-1',
        date: '2024-01-02',
        description: 'OFFICE SUPPLIES MART KARACHI',
        amount: -4500.0,
        notes: 'Value Date: 02-Jan-2024; Cheque: 982141; Balance: 95500.00',
        source_file: 'HBL_Statement_Jan2024.pdf',
        page: 1,
        confidence: 0.98,
        needs_review: false,
        running_balance: 95500.0,
        review_reasons: [],
        raw_text: '02-Jan-2024 02-Jan-2024 OFFICE SUPPLIES MART 4,500.00 95,500.00 CHQ# 982141 KARACHI',
        bbox: { top: 32, left: 5, width: 90, height: 8 },
      },
      {
        id: 'hbl-2',
        date: '2024-01-05',
        description: 'CLIENT RETAINER PAYMENT',
        amount: 50000.0,
        notes: 'Value Date: 05-Jan-2024; IBAN: PK36HABB00129847192837; Balance: 145500.00',
        source_file: 'HBL_Statement_Jan2024.pdf',
        page: 1,
        confidence: 0.99,
        needs_review: false,
        running_balance: 145500.0,
        review_reasons: [],
        raw_text: '05-Jan-2024 05-Jan-2024 CLIENT RETAINER PAYMENT 50,000.00 145,500.00 IBAN: PK36HABB...',
        bbox: { top: 44, left: 5, width: 90, height: 8 },
      },
      {
        id: 'hbl-3',
        date: '2024-01-12',
        description: 'CLOUD INFRASTRUCTURE SERVER HOSTING',
        amount: -12500.0,
        notes: 'Value Date: 12-Jan-2024; Ref: AWS-PK-991823; Balance: 133000.00',
        source_file: 'HBL_Statement_Jan2024.pdf',
        page: 1,
        confidence: 0.97,
        needs_review: false,
        running_balance: 133000.0,
        review_reasons: [],
        raw_text: '12-Jan-2024 12-Jan-2024 CLOUD INFRASTRUCTURE SERVER HOSTING 12,500.00 133,000.00',
        bbox: { top: 56, left: 5, width: 90, height: 8 },
      },
      {
        id: 'hbl-4',
        date: '2024-01-20',
        description: 'UTILITY BILL PAYMENT K-ELECTRIC',
        amount: -8000.0,
        notes: 'Value Date: 20-Jan-2024; Balance: 125000.00',
        source_file: 'HBL_Statement_Jan2024.pdf',
        page: 1,
        confidence: 0.96,
        needs_review: false,
        running_balance: 125000.0,
        review_reasons: [],
        raw_text: '20-Jan-2024 20-Jan-2024 UTILITY BILL PAYMENT K-ELECTRIC 8,000.00 125,000.00',
        bbox: { top: 68, left: 5, width: 90, height: 8 },
      },
    ],
  },

  // 2. Meezan Bank Limited (Islamic Banking)
  {
    id: 'meezan-feb-2024',
    name: 'Meezan Bank Limited - Feb 2024',
    bank_code: 'meezan',
    filename: 'Meezan_Statement_Feb2024.pdf',
    doc_type: 'digital_pdf',
    currency: 'PKR',
    badge: 'Digital PDF • Islamic Banking',
    detectedQuirks: [
      'Islamic Mudarabah Profit Distribution classification',
      'Withholding Tax (WHT Section 236P) auto-notes tag',
      'Running Balance suffix indicator: "DR" (overdraft) / "CR" (positive)',
      'Withdrawals / Deposits tabular columns mapping',
    ],
    metadata: {
      bank_name: 'Meezan Bank Limited',
      account_number_masked: '****4412',
      account_title: 'CREATIVE DESIGN STUDIO',
      currency: 'PKR',
      statement_start_date: '2024-02-01',
      statement_end_date: '2024-02-28',
      opening_balance: 50000.0,
      closing_balance: 115250.0,
      total_debits: 10375.0,
      total_credits: 75625.0,
    },
    documentText: `MEEZAN BANK LIMITED
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
Closing Balance: 115,250.00`,
    initialTransactions: [
      {
        id: 'meezan-1',
        date: '2024-02-03',
        description: 'ATM CASH WITHDRAWAL CLIFTON BR',
        amount: -10000.0,
        notes: 'Balance: 40000.00 DR',
        source_file: 'Meezan_Statement_Feb2024.pdf',
        page: 1,
        confidence: 0.99,
        needs_review: false,
        running_balance: 40000.0,
        review_reasons: [],
        raw_text: '03/02/2024 ATM CASH WITHDRAWAL CLIFTON BR 10,000.00 40,000.00 DR',
        bbox: { top: 34, left: 5, width: 90, height: 8 },
      },
      {
        id: 'meezan-2',
        date: '2024-02-08',
        description: 'INWARD REMITTANCE EXPORT EARNINGS FREELANCE SERVICES',
        amount: 75000.0,
        notes: 'Ref: FT240192837; Balance: 115000.00 CR',
        source_file: 'Meezan_Statement_Feb2024.pdf',
        page: 1,
        confidence: 0.97,
        needs_review: false,
        running_balance: 115000.0,
        review_reasons: [],
        raw_text: '08/02/2024 INWARD REMITTANCE EXPORT EARNINGS 75,000.00 115,000.00 CR FT240192837',
        bbox: { top: 46, left: 5, width: 90, height: 8 },
      },
      {
        id: 'meezan-3',
        date: '2024-02-15',
        description: 'WITHHOLDING TAX SECTION 236P',
        amount: -375.0,
        notes: 'Withholding Tax 236P; Balance: 114625.00 CR',
        source_file: 'Meezan_Statement_Feb2024.pdf',
        page: 1,
        confidence: 0.96,
        needs_review: false,
        running_balance: 114625.0,
        review_reasons: [],
        raw_text: '15/02/2024 WITHHOLDING TAX SECTION 236P 375.00 114,625.00 CR',
        bbox: { top: 58, left: 5, width: 90, height: 8 },
      },
      {
        id: 'meezan-4',
        date: '2024-02-28',
        description: 'MONTHLY PROFIT DISTRIBUTION',
        amount: 625.0,
        notes: 'Islamic Mudarabah Profit; Balance: 115250.00 CR',
        source_file: 'Meezan_Statement_Feb2024.pdf',
        page: 1,
        confidence: 0.95,
        needs_review: false,
        running_balance: 115250.0,
        review_reasons: [],
        raw_text: '28/02/2024 MONTHLY PROFIT DISTRIBUTION 625.00 115,250.00 CR',
        bbox: { top: 70, left: 5, width: 90, height: 8 },
      },
    ],
  },

  // 3. Bank Alfalah Limited (BAFL)
  {
    id: 'bafl-jan-2024',
    name: 'Bank Alfalah Limited (BAFL) - Jan 2024',
    bank_code: 'bafl',
    filename: 'BankAlfalah_Jan2024.pdf',
    doc_type: 'digital_pdf',
    currency: 'PKR',
    badge: 'Digital PDF • Reconciled',
    detectedQuirks: [
      'Instrument No. column extraction (CHQ-882190, POS-9921)',
      'Tran Date header mapping',
      'Debit & Credit column signs auto-normalized',
    ],
    metadata: {
      bank_name: 'Bank Alfalah Limited',
      account_number_masked: '****4410',
      account_title: 'ALPHA LOGISTICS SOLUTIONS',
      currency: 'PKR',
      statement_start_date: '2024-01-01',
      statement_end_date: '2024-01-31',
      opening_balance: 80000.0,
      closing_balance: 100000.0,
      total_debits: 25000.0,
      total_credits: 45000.0,
    },
    documentText: `BANK ALFALAH LIMITED
MAIN BRANCH KARACHI
STATEMENT OF ACCOUNT
Title: ALPHA LOGISTICS SOLUTIONS
Account No: 5501-9928-4410
Currency: PKR
Statement Period: From 01-Jan-2024 to 31-Jan-2024
Opening Balance: 80,000.00
-------------------------------------------------------------------------------------------------
Tran Date   Particulars                              Instrument No   Debit       Credit   Balance
-------------------------------------------------------------------------------------------------
03-Jan-2024 WAREHOUSE RENT PAYMENT                   CHQ-882190      20,000.00            60,000.00
10-Jan-2024 CLIENT SETTLEMENT VENDOR                                             45,000.00 105,000.00
24-Jan-2024 POS TERMINAL MERCHANT ACQUIRING          POS-9921         5,000.00           100,000.00
-------------------------------------------------------------------------------------------------
Closing Balance: 100,000.00`,
    initialTransactions: [
      {
        id: 'bafl-1',
        date: '2024-01-03',
        description: 'WAREHOUSE RENT PAYMENT',
        amount: -20000.0,
        notes: 'Cheque: 882190; Balance: 60000.00',
        source_file: 'BankAlfalah_Jan2024.pdf',
        page: 1,
        confidence: 0.98,
        needs_review: false,
        running_balance: 60000.0,
        review_reasons: [],
        raw_text: '03-Jan-2024 WAREHOUSE RENT PAYMENT CHQ-882190 20,000.00 60,000.00',
        bbox: { top: 34, left: 5, width: 90, height: 8 },
      },
      {
        id: 'bafl-2',
        date: '2024-01-10',
        description: 'CLIENT SETTLEMENT VENDOR',
        amount: 45000.0,
        notes: 'Balance: 105000.00',
        source_file: 'BankAlfalah_Jan2024.pdf',
        page: 1,
        confidence: 0.97,
        needs_review: false,
        running_balance: 105000.0,
        review_reasons: [],
        raw_text: '10-Jan-2024 CLIENT SETTLEMENT VENDOR 45,000.00 105,000.00',
        bbox: { top: 46, left: 5, width: 90, height: 8 },
      },
      {
        id: 'bafl-3',
        date: '2024-01-24',
        description: 'POS TERMINAL MERCHANT ACQUIRING',
        amount: -5000.0,
        notes: 'Ref: POS-9921; Balance: 100000.00',
        source_file: 'BankAlfalah_Jan2024.pdf',
        page: 1,
        confidence: 0.96,
        needs_review: false,
        running_balance: 100000.0,
        review_reasons: [],
        raw_text: '24-Jan-2024 POS TERMINAL MERCHANT ACQUIRING POS-9921 5,000.00 100,000.00',
        bbox: { top: 58, left: 5, width: 90, height: 8 },
      },
    ],
  },

  // 4. Standard Chartered Bank (SCB)
  {
    id: 'scb-jan-2024',
    name: 'Standard Chartered Bank - Jan 2024',
    bank_code: 'scb',
    filename: 'StandardChartered_Jan2024.pdf',
    doc_type: 'digital_pdf',
    currency: 'PKR',
    badge: 'Digital PDF • Multicurrency',
    detectedQuirks: [
      'Booking Date & Value Date normalization',
      'Multi-line Merchant Transaction Details',
      'Foreign currency and card conversion line items',
    ],
    metadata: {
      bank_name: 'Standard Chartered Bank',
      account_number_masked: '****9932',
      account_title: 'GLOBAL MEDIA VENTURES',
      currency: 'PKR',
      statement_start_date: '2024-01-01',
      statement_end_date: '2024-01-31',
      opening_balance: 150000.0,
      closing_balance: 205000.0,
      total_debits: 25000.0,
      total_credits: 80000.0,
    },
    documentText: `STANDARD CHARTERED BANK
MAIN BRANCH KARACHI
STATEMENT OF ACCOUNT
Title: GLOBAL MEDIA VENTURES
Account Number: 01-992834-01-9932
Currency: PKR
Statement Period: From 01-Jan-2024 to 31-Jan-2024
Opening Balance: 150,000.00
-------------------------------------------------------------------------------------------------
Booking Date  Transaction Details                        Withdrawal   Deposit     Balance
-------------------------------------------------------------------------------------------------
04-Jan-2024   INTERNATIONAL DIGITAL ADVERTISING SPEND    25,000.00                125,000.00
              REF: SCB-INT-772183 USD SETTLEMENT
18-Jan-2024   CLIENT WIRE TRANSFER INWARD                             80,000.00   205,000.00
              IBAN: PK45SCBL0000992834019932
-------------------------------------------------------------------------------------------------
Closing Balance: 205,000.00`,
    initialTransactions: [
      {
        id: 'scb-1',
        date: '2024-01-04',
        description: 'INTERNATIONAL DIGITAL ADVERTISING SPEND USD SETTLEMENT',
        amount: -25000.0,
        notes: 'Ref: SCB-INT-772183; Balance: 125000.00',
        source_file: 'StandardChartered_Jan2024.pdf',
        page: 1,
        confidence: 0.98,
        needs_review: false,
        running_balance: 125000.0,
        review_reasons: [],
        raw_text: '04-Jan-2024 INTERNATIONAL DIGITAL ADVERTISING SPEND 25,000.00 125,000.00',
        bbox: { top: 34, left: 5, width: 90, height: 8 },
      },
      {
        id: 'scb-2',
        date: '2024-01-18',
        description: 'CLIENT WIRE TRANSFER INWARD',
        amount: 80000.0,
        notes: 'IBAN: PK45SCBL0000992834019932; Balance: 205000.00',
        source_file: 'StandardChartered_Jan2024.pdf',
        page: 1,
        confidence: 0.99,
        needs_review: false,
        running_balance: 205000.0,
        review_reasons: [],
        raw_text: '18-Jan-2024 CLIENT WIRE TRANSFER INWARD 80,000.00 205,000.00',
        bbox: { top: 46, left: 5, width: 90, height: 8 },
      },
    ],
  },

  // 5. Scanned Statement with OCR Artifacts
  {
    id: 'scanned-photo-pkr',
    name: 'Scanned Mobile Photo Statement (Low Contrast)',
    bank_code: 'generic',
    filename: 'Mobile_Scan_Statement_Mar2024.png',
    doc_type: 'image',
    currency: 'PKR',
    badge: 'Scanned Image • Flagged Rows',
    detectedQuirks: [
      'Image Preprocessing: 1.8° Deskew + Contrast filter',
      'Low confidence threshold trigger (< 0.85)',
      'Parentheses as negative debit normalizer',
    ],
    metadata: {
      bank_name: 'National Commercial Bank',
      account_number_masked: '****8823',
      account_title: 'SAMIULLAH TRADERS',
      currency: 'PKR',
      statement_start_date: '2024-03-01',
      statement_end_date: '2024-03-31',
      opening_balance: 45000.0,
      closing_balance: 78500.0,
      total_debits: 11500.0,
      total_credits: 45000.0,
    },
    documentText: `[IMAGE SCAN - 200 DPI - SKEWED 1.8° - LOW CONTRAST]
NATIONAL COMMERCIAL BANK
ACCOUNT STATEMENT - MARCH 2024
Customer: SAMIULLAH TRADERS
Account: 9940-1288-8823
Currency: PKR
Opening Balance: 45,000.00
--------------------------------------------------------------------
Date       Particulars                       Amount         Balance
--------------------------------------------------------------------
04/03/24   PETROL STATION REFUEL            (3,500.00)     41,500.00
11/03/24   SMART LOGISTICS FREIGHT          (8,000.00)     33,500.00
22/03/24   BULK MERCHANDISE RESALE          45,000.00      78,500.00
29/03/24   UNCLEAR OCR SMUDGE [?]           (1,200.00)?    77,300.00?
--------------------------------------------------------------------
Stated Ending Balance: 78,500.00`,
    initialTransactions: [
      {
        id: 'scan-1',
        date: '2024-03-04',
        description: 'PETROL STATION REFUEL',
        amount: -3500.0,
        notes: 'Balance: 41500.00',
        source_file: 'Mobile_Scan_Statement_Mar2024.png',
        page: 1,
        confidence: 0.92,
        needs_review: false,
        running_balance: 41500.0,
        review_reasons: [],
        raw_text: '04/03/24 PETROL STATION REFUEL (3,500.00) 41,500.00',
        bbox: { top: 32, left: 6, width: 88, height: 7 },
      },
      {
        id: 'scan-2',
        date: '2024-03-11',
        description: 'SMART LOGISTICS FREIGHT',
        amount: -8000.0,
        notes: 'Balance: 33500.00',
        source_file: 'Mobile_Scan_Statement_Mar2024.png',
        page: 1,
        confidence: 0.89,
        needs_review: false,
        running_balance: 33500.0,
        review_reasons: [],
        raw_text: '11/03/24 SMART LOGISTICS FREIGHT (8,000.00) 33,500.00',
        bbox: { top: 43, left: 6, width: 88, height: 7 },
      },
      {
        id: 'scan-3',
        date: '2024-03-22',
        description: 'BULK MERCHANDISE RESALE',
        amount: 45000.0,
        notes: 'Balance: 78500.00',
        source_file: 'Mobile_Scan_Statement_Mar2024.png',
        page: 1,
        confidence: 0.88,
        needs_review: false,
        running_balance: 78500.0,
        review_reasons: [],
        raw_text: '22/03/24 BULK MERCHANDISE RESALE 45,000.00 78,500.00',
        bbox: { top: 54, left: 6, width: 88, height: 7 },
      },
      {
        id: 'scan-4',
        date: '2024-03-29',
        description: 'UNCLEAR OCR SMUDGE - CHECK RECEIPT',
        amount: -1200.0,
        notes: 'OCR Artifact: Smudge detected on balance column',
        source_file: 'Mobile_Scan_Statement_Mar2024.png',
        page: 1,
        confidence: 0.64,
        needs_review: true,
        running_balance: 77300.0,
        review_reasons: [
          'Low OCR confidence (0.64 < 0.85 threshold)',
          'Running balance jump: expected 78500.00 -> 77300.00 mismatches stated closing 78500.00',
        ],
        raw_text: '29/03/24 UNCLEAR OCR SMUDGE [?] (1,200.00)? 77,300.00?',
        bbox: { top: 65, left: 6, width: 88, height: 7 },
      },
    ],
  },

  // 6. Corrupted Unbalanced Statement
  {
    id: 'corrupted-statement',
    name: 'Unbalanced Statement (Discrepancy Demo)',
    bank_code: 'generic',
    filename: 'Unbalanced_Audit_Statement.pdf',
    doc_type: 'digital_pdf',
    currency: 'PKR',
    badge: 'Audit Alert • Delta -2,000.00',
    detectedQuirks: [
      'Discontinuity Detection: Missing transaction gap',
      'Zero-amount transaction review flag',
      'Total reconciliation formula failure alert',
    ],
    metadata: {
      bank_name: 'Metro Union Bank',
      account_number_masked: '****3399',
      account_title: 'CORRUPTED BALANCE TEST CORP',
      currency: 'PKR',
      statement_start_date: '2024-01-01',
      statement_end_date: '2024-01-31',
      opening_balance: 20000.0,
      closing_balance: 28000.0,
      total_debits: 4000.0,
      total_credits: 10000.0,
    },
    documentText: `METRO UNION BANK
Statement Period: 01/01/2024 to 31/01/2024
Opening Balance: 20,000.00
-------------------------------------------------------------------------
Date         Particulars                         Amount        Balance
-------------------------------------------------------------------------
05/01/2024   INCOMING WIRE TRANSFER             +10,000.00     30,000.00
12/01/2024   SOFTWARE LICENSE FEE                -4,000.00     26,000.00
25/01/2024   MISSING TRANSACTION DEPOSIT GAP           0.00     26,000.00
-------------------------------------------------------------------------
Stated Closing Balance: 28,000.00  <-- MISMATCH! (Calculated: 26,000.00, Delta: -2,000.00)`,
    initialTransactions: [
      {
        id: 'corrupt-1',
        date: '2024-01-05',
        description: 'INCOMING WIRE TRANSFER',
        amount: 10000.0,
        notes: 'Balance: 30000.00',
        source_file: 'Unbalanced_Audit_Statement.pdf',
        page: 1,
        confidence: 0.98,
        needs_review: true,
        running_balance: 30000.0,
        review_reasons: ['Statement reconciliation mismatch (delta -2000.00)'],
        raw_text: '05/01/2024 INCOMING WIRE TRANSFER +10,000.00 30,000.00',
        bbox: { top: 35, left: 6, width: 88, height: 8 },
      },
      {
        id: 'corrupt-2',
        date: '2024-01-12',
        description: 'SOFTWARE LICENSE FEE',
        amount: -4000.0,
        notes: 'Balance: 26000.00',
        source_file: 'Unbalanced_Audit_Statement.pdf',
        page: 1,
        confidence: 0.95,
        needs_review: true,
        running_balance: 26000.0,
        review_reasons: ['Statement reconciliation mismatch (delta -2000.00)'],
        raw_text: '12/01/2024 SOFTWARE LICENSE FEE -4,000.00 26,000.00',
        bbox: { top: 48, left: 6, width: 88, height: 8 },
      },
      {
        id: 'corrupt-3',
        date: '2024-01-25',
        description: 'MISSING TRANSACTION DEPOSIT GAP',
        amount: 0.0,
        notes: 'Zero amount entry requiring human reconciliation',
        source_file: 'Unbalanced_Audit_Statement.pdf',
        page: 1,
        confidence: 0.6,
        needs_review: true,
        running_balance: 26000.0,
        review_reasons: [
          'Zero or missing transaction amount',
          'Statement reconciliation mismatch (delta -2000.00)',
        ],
        raw_text: '25/01/2024 MISSING TRANSACTION DEPOSIT GAP 0.00 26,000.00',
        bbox: { top: 60, left: 6, width: 88, height: 8 },
      },
    ],
  },
];
