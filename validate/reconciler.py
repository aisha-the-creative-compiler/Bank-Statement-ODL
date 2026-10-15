"""
Reconciliation and validation engine.
Enforces the 4 key audit rules:
1. Opening balance + sum of transactions must equal closing balance.
2. Running balance must be consistent row-to-row (prev_bal + amount == curr_bal).
3. Dates must fall within the statement period.
4. Flag every uncertain row (confidence < threshold or failed check) with needs_review = True.
"""

from typing import List, Tuple, Optional
from datetime import datetime
from parse.models import ParsedTransaction, StatementMetadata, ReconciliationReport


class StatementValidator:
    """
    Validates transactions, reconciles opening and closing balances,
    and sets needs_review flags with explanatory diagnostic reasons.
    """

    def __init__(self, confidence_threshold: float = 0.85, balance_tolerance: float = 0.05):
        self.confidence_threshold = confidence_threshold
        self.balance_tolerance = balance_tolerance

    def validate_and_reconcile(
        self,
        transactions: List[ParsedTransaction],
        metadata: StatementMetadata
    ) -> Tuple[List[ParsedTransaction], ReconciliationReport]:
        """
        Runs balance reconciliation, row continuity checks, and date bounds checks.
        Mutates transactions with needs_review = True and review_reasons where applicable.
        """
        issues: List[str] = []
        total_credits = 0.0
        total_debits = 0.0
        running_consistent = True
        date_consistent = True

        # Parse statement dates for bounds checking
        start_dt = None
        end_dt = None
        if metadata.statement_start_date:
            try:
                start_dt = datetime.strptime(metadata.statement_start_date, "%Y-%m-%d")
            except ValueError:
                pass
        if metadata.statement_end_date:
            try:
                end_dt = datetime.strptime(metadata.statement_end_date, "%Y-%m-%d")
            except ValueError:
                pass

        # 1. Row-level checks and running balance continuity
        prev_balance = metadata.opening_balance

        for idx, tx in enumerate(transactions):
            tx_issues = []

            # Check confidence threshold
            if tx.confidence < self.confidence_threshold:
                tx.needs_review = True
                tx_issues.append(f"Low OCR confidence ({tx.confidence:.2f} < {self.confidence_threshold:.2f})")

            # Check amount zero or non-numeric
            if tx.amount == 0.0:
                tx.needs_review = True
                tx_issues.append("Zero or missing transaction amount")

            # Sum credits / debits
            if tx.amount > 0:
                total_credits += tx.amount
            else:
                total_debits += abs(tx.amount)

            # Check date format and period bounds
            try:
                tx_dt = datetime.strptime(tx.date, "%Y-%m-%d")
                if start_dt and tx_dt < start_dt:
                    tx.needs_review = True
                    date_consistent = False
                    tx_issues.append(f"Date {tx.date} is prior to statement start ({metadata.statement_start_date})")
                if end_dt and tx_dt > end_dt:
                    tx.needs_review = True
                    date_consistent = False
                    tx_issues.append(f"Date {tx.date} is after statement end ({metadata.statement_end_date})")
            except (ValueError, TypeError):
                tx.needs_review = True
                tx_issues.append(f"Invalid ISO date format: '{tx.date}'")

            # Check row-to-row running balance
            if tx.running_balance is not None and prev_balance is not None:
                expected_curr = round(prev_balance + tx.amount, 2)
                actual_curr = round(tx.running_balance, 2)
                diff = abs(expected_curr - actual_curr)
                if diff > self.balance_tolerance:
                    tx.needs_review = True
                    running_consistent = False
                    tx_issues.append(
                        f"Running balance jump: expected {expected_curr:.2f}, found {actual_curr:.2f} (diff: {diff:.2f})"
                    )

            if tx.running_balance is not None:
                prev_balance = tx.running_balance
            elif prev_balance is not None:
                prev_balance = round(prev_balance + tx.amount, 2)

            if tx_issues:
                tx.review_reasons.extend(tx_issues)

        # 2. Overall Balance Reconciliation
        net_transactions = round(total_credits - total_debits, 2)
        opening = metadata.opening_balance
        closing = metadata.closing_balance

        calculated_closing = None
        difference = 0.0
        is_balanced = True

        if opening is not None and closing is not None:
            calculated_closing = round(opening + net_transactions, 2)
            difference = round(calculated_closing - closing, 2)
            if abs(difference) > self.balance_tolerance:
                is_balanced = False
                issue_msg = (
                    f"Reconciliation Failed: Opening ({opening:.2f}) + Net ({net_transactions:+.2f}) = "
                    f"Calculated Closing ({calculated_closing:.2f}) != Stated Closing ({closing:.2f}) "
                    f"[Delta: {difference:+.2f}]"
                )
                issues.append(issue_msg)
                # Flag all rows if overall statement does not reconcile
                for tx in transactions:
                    if "Statement reconciliation mismatch" not in tx.review_reasons:
                        tx.review_reasons.append(f"Statement reconciliation mismatch (delta {difference:+.2f})")
                        tx.needs_review = True
            else:
                is_balanced = True
        elif opening is None or closing is None:
            issues.append("Opening or closing balance not detected in statement header; skipped mathematical reconciliation")
            is_balanced = False

        if not running_consistent:
            issues.append("One or more rows have discontinuous running balances")
        if not date_consistent:
            issues.append("One or more transaction dates fall outside the statement period")

        flagged_count = sum(1 for tx in transactions if tx.needs_review)

        report = ReconciliationReport(
            opening_balance=opening,
            closing_balance=closing,
            calculated_closing=calculated_closing,
            total_credits=round(total_credits, 2),
            total_debits=round(total_debits, 2),
            net_transactions=net_transactions,
            difference=difference,
            is_balanced=is_balanced,
            running_balance_consistent=running_consistent,
            date_bounds_consistent=date_consistent,
            flagged_rows_count=flagged_count,
            total_rows=len(transactions),
            issues=issues
        )

        return transactions, report
