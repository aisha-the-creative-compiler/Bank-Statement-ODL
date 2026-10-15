#!/usr/bin/env python3
"""
Command-line interface for Bank Statement OCR → CSV Extraction Pipeline.
Usage:
    python3 cli.py --input sample.pdf --output out.csv [--bank hbl|meezan|generic] [--confidence-threshold 0.85]
"""

import argparse
import sys
import os
import csv
from typing import List

from ingest.classifier import DocumentClassifier
from ocr.engine import OCREngine
from parse.table_detector import TableDetector
from validate.reconciler import StatementValidator
from parse.models import ParsedTransaction


def export_to_csv(transactions: List[ParsedTransaction], output_path: str, include_unapproved: bool = True):
    """
    Exports parsed transactions to a CSV file matching the strict schema:
    | date | description | amount | notes | source_file | page | confidence | needs_review |
    """
    fieldnames = [
        "date", "description", "amount", "notes",
        "source_file", "page", "confidence", "needs_review"
    ]
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for tx in transactions:
            if not include_unapproved and tx.needs_review:
                continue
            writer.writerow(tx.to_csv_dict())


def main():
    parser = argparse.ArgumentParser(
        description="Extract transactions from bank statements (PDF/Image) to ISO-8601 CSV with reconciliation."
    )
    parser.add_argument("--input", "-i", nargs="+", required=True, help="Path to input bank statement(s) (PDF, PNG, JPG)")
    parser.add_argument("--output", "-o", default="statement_extracted.csv", help="Path to output CSV file")
    parser.add_argument("--merge", "-m", action="store_true", help="Merge all input statements into a single combined CSV")
    parser.add_argument("--bank", "-b", default=None, help="Force specific bank layout adapter (e.g. hbl, meezan, bafl, scb, mcb, generic)")
    parser.add_argument("--config", "-c", default=None, help="Path to custom bank configuration JSON file")
    parser.add_argument("--threshold", "-t", type=float, default=0.85, help="Confidence threshold to flag review (default: 0.85)")
    parser.add_argument("--json", action="store_true", help="Print result summary as JSON")

    args = parser.parse_args()

    input_paths = args.input
    for p in input_paths:
        if not os.path.exists(p):
            print(f"Error: File not found: {p}", file=sys.stderr)
            sys.exit(1)

    from parse.config.registry import bank_registry
    if args.config:
        print(f"[*] Loading custom bank layout configuration from: {args.config}...")
        custom_profile = bank_registry.load_from_json_file(args.config)
        args.bank = custom_profile.bank_id
        print(f"    Registered profile: {custom_profile.bank_name} [{custom_profile.bank_id}]")

    all_master_transactions: List[ParsedTransaction] = []

    classifier = DocumentClassifier()
    engine = OCREngine()
    validator = StatementValidator(confidence_threshold=args.threshold)

    print(f"[*] Processing {len(input_paths)} statement file(s)...")

    for idx, input_path in enumerate(input_paths, start=1):
        filename = os.path.basename(input_path)
        print(f"\n--- [{idx}/{len(input_paths)}] Ingesting: {filename} ---")
        doc_type, info = classifier.classify_file(input_path)
        print(f"    Detected type: {doc_type.value.upper()} (Strategy: {info.get('strategy')})")

        lines = engine.extract_lines_from_document(input_path, doc_type)
        print(f"    Extracted {len(lines)} lines.")

        detector = TableDetector(preferred_bank=args.bank)
        transactions, metadata, adapter_name = detector.extract(
            lines, source_file=filename, forced_bank=args.bank
        )
        print(f"    Selected Adapter: {adapter_name}")
        print(f"    Account: {metadata.account_number_masked} ({metadata.account_title})")
        print(f"    Opening Balance: {metadata.opening_balance} | Closing Balance: {metadata.closing_balance}")

        validated_txs, report = validator.validate_and_reconcile(transactions, metadata)
        print(f"    Reconciliation: {'PASSED ✓' if report.is_balanced else 'MISMATCH ⚠️ (Delta: ' + str(report.difference) + ')'}")
        print(f"    Extracted {len(validated_txs)} transactions ({report.flagged_rows_count} flagged for review).")

        all_master_transactions.extend(validated_txs)

        if not args.merge and len(input_paths) > 1:
            base, ext = os.path.splitext(args.output)
            individual_out = f"{base}_{idx}.csv"
            export_to_csv(validated_txs, individual_out)
            print(f"    [✓] Exported to: {individual_out}")

    if args.merge or len(input_paths) == 1:
        export_to_csv(all_master_transactions, args.output)
        print(f"\n[✓] Successfully exported {len(all_master_transactions)} total rows from {len(input_paths)} file(s) to: {args.output}")


if __name__ == "__main__":
    main()
