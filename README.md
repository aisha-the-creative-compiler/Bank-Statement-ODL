# Bank Statement OCR → CSV Extraction Pipeline

A tested, bank-agnostic pipeline and human-in-the-loop review system that extracts transactions from digital PDFs, scanned PDFs, and images (JPG/PNG) into strict ISO-8601 CSV with mathematical balance reconciliation and audit flags.

---

## Output CSV Schema (Strict)

| Column | Format | Description |
|---|---|---|
| `date` | `YYYY-MM-DD` | ISO 8601 format. Automatically infers missing years from statement period. |
| `description` | String | Clean merchant / transaction title. Wrapped lines joined, whitespace collapsed. |
| `amount` | Signed Decimal | Negative for Debits (e.g. `-1500.00`), Positive for Credits (e.g. `50000.00`). Strips currency symbols & commas. |
| `notes` | String | Cheque numbers, IBANs, transaction reference IDs, and running balance. |
| `source_file` | String | Original statement filename. |
| `page` | Integer | 1-indexed page number where transaction was found. |
| `confidence` | Float (0.0–1.0) | Multi-factor extraction & OCR confidence score. |
| `needs_review`| Boolean (`true`/`false`) | `true` if OCR confidence < threshold, balance mismatch, discontinuous running balance, or out-of-period date. |

---

## Project Structure

```
├── ingest/
│   ├── __init__.py
│   └── classifier.py          # Classifies digital PDF vs scanned PDF vs image
├── ocr/
│   ├── __init__.py
│   ├── preprocessor.py        # Deskewing, contrast enhancement, denoising, upscaling
│   └── engine.py              # Native text layer extractor & Tesseract/Vision OCR
├── parse/
│   ├── __init__.py
│   ├── models.py              # ParsedTransaction, StatementMetadata, ReconciliationReport
│   ├── date_parser.py         # DD/MM/YYYY, MM/DD/YYYY, D-Mon-YYYY & missing year inference
│   ├── amount_parser.py       # Signed decimal parser (DR/CR, parentheses, currency removal)
│   ├── multiline_merger.py    # Merges wrapped lines, strips noise/headers, extracts notes
│   ├── table_detector.py      # Table boundary detector & adapter dispatcher
│   ├── config/
│   │   ├── __init__.py
│   │   ├── bank_profile.py    # BankLayoutConfig, ColumnMapping, QuirkSettings dataclasses
│   │   ├── builtin_profiles.py# HBL, Meezan, Bank Alfalah, SCB, MCB, and Generic profiles
│   │   └── registry.py        # BankProfileRegistry for dynamic profile registration & detection
│   └── bank_adapters/
│       ├── __init__.py
│       ├── base.py            # BaseBankAdapter abstract class
│       ├── configurable_adapter.py # Universal data-driven adapter powered by BankLayoutConfig
│       ├── hbl_adapter.py     # Habib Bank Limited (HBL) layout adapter
│       ├── meezan_adapter.py  # Meezan Bank Islamic Banking layout adapter
│       └── generic_adapter.py # Universal fallback tabular adapter
├── validate/
│   ├── __init__.py
│   └── reconciler.py          # Mathematical reconciliation (Opening + Sum == Closing, running balance)
├── review_ui/
│   └── streamlit_app.py       # Streamlit side-by-side human-in-the-loop review interface
├── tests/
│   ├── __init__.py
│   ├── fixtures.py            # Synthetic statement fixtures (HBL, Meezan, Corrupted)
│   ├── test_bank_configuration.py # Unit tests for configuration registry & multi-bank quirks
│   ├── test_date_parser.py    # Unit tests for date formats & year inference
│   ├── test_amount_parser.py  # Unit tests for signed amounts & currency tokens
│   ├── test_multiline_merger.py # Unit tests for line joining & reference extraction
│   └── test_reconciliation.py # Unit tests for balance audit & failure detection
├── cli.py                     # Command-line entry point (supports --bank and --config JSON)
├── requirements.txt           # Python dependencies
└── README.md
```

---

## Quickstart Setup (< 5 minutes)

### 1. Requirements
- Python 3.10+ or 3.11+
- Tesseract OCR (optional, for scanned images/scanned PDFs):
  - Ubuntu/Debian: `sudo apt-get install -y tesseract-ocr`
  - macOS: `brew install tesseract`

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## Usage

### 1. Command-Line Extraction
Extract any bank statement directly to CSV:
```bash
python3 cli.py --input statement.pdf --output statement_clean.csv
```

Force a specific bank layout adapter:
```bash
python3 cli.py --input hbl_statement.pdf --bank hbl --threshold 0.85 -o hbl_transactions.csv
```

### 2. Streamlit Human-in-the-Loop Review UI
Launch the interactive side-by-side review app:
```bash
streamlit run review_ui/streamlit_app.py
```
Features:
- Left panel: View the source statement document and extracted bank metadata.
- Right panel: Live editable grid highlighting rows with `needs_review = true`.
- Real-time balance reconciliation card: Opening Balance + Total Transactions vs Stated Closing Balance.
- One-click export of verified CSV once all flagged items are resolved.

---

## How to Add a New Bank Format

Adding a custom bank format adapter takes under 15 lines of code:

## How to Add a New Bank Format (Configuration-Driven)

Adding a new bank format requires **zero boilerplate**. You can define it either declaratively via JSON or programmatically:

### Option A: Declarative JSON Configuration (No Code Changes)
Create a `mybank_config.json`:
```json
{
  "bank_id": "faysal_bank",
  "bank_name": "Faysal Bank Limited",
  "currency": "PKR",
  "date_convention": "DD/MM/YYYY",
  "keywords": ["faysal bank", "fbl", "barkat islamic"],
  "quirks": {
    "has_dual_dates": true,
    "cheque_in_separate_col": true,
    "has_dr_cr_indicator": false,
    "islamic_banking_tags": true
  }
}
```
Run with CLI:
```bash
python3 cli.py --input statement.pdf --config mybank_config.json --output extracted.csv
```

### Option B: Built-in Python Profile
Register it in `parse/config/builtin_profiles.py` using `BankLayoutConfig`:
```python
from parse.config.bank_profile import BankLayoutConfig, QuirkSettings

BUILTIN_BANK_PROFILES["mybank"] = BankLayoutConfig(
    bank_id="mybank",
    bank_name="My Bank Limited",
    keywords=["my bank", "mybank"],
    quirks=QuirkSettings(has_dual_dates=False, has_dr_cr_indicator=True)
)
```

---

## Running the Unit Tests

Execute the full automated test suite (30 comprehensive unit tests):

```bash
# Using standard unittest (zero external dependencies required)
python3 -m unittest discover tests

# Or using pytest
pytest tests/ -v
```

All 30 unit tests verify:
- Bank configuration registry and automatic profile keyword detection
- HBL specific quirks (dual post date/value date, cheque number column, carried forward suppression)
- Meezan specific quirks (Mudarabah Islamic profit tags, DR/CR balance suffix, withholding tax)
- Bank Alfalah multi-column extraction and Instrument No. isolation
- Dynamic custom JSON bank profile registration and extraction
- ISO 8601 date parsing, DD/MM vs MM/DD conventions, missing year inference from period
- Signed amounts: debit negative, credit positive, parentheses `(1,500.00)`, DR/CR suffixes
- Multi-line description concatenation, header noise suppression, cheque/IBAN extraction
- Full mathematical reconciliation: `opening + sum(txs) == closing`
- Detection of corrupted statements and discontinuous running balances
