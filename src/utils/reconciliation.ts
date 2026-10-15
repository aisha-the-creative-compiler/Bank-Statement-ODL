import { TransactionRow, StatementMetadata, ReconciliationReport } from '../types/statement';

export function calculateReconciliation(
  transactions: TransactionRow[],
  metadata: StatementMetadata,
  confidenceThreshold: number = 0.85,
  tolerance: number = 0.05
): { updatedRows: TransactionRow[]; report: ReconciliationReport } {
  let totalCredits = 0;
  let totalDebits = 0;
  let runningConsistent = true;
  let dateConsistent = true;
  const issues: string[] = [];

  const startDate = metadata.statement_start_date ? new Date(metadata.statement_start_date) : null;
  const endDate = metadata.statement_end_date ? new Date(metadata.statement_end_date) : null;

  let prevBal = metadata.opening_balance;

  const updatedRows = transactions.map((tx) => {
    const reasons: string[] = [];
    let flagged = tx.needs_review;

    // Sum credits/debits
    if (tx.amount > 0) {
      totalCredits += tx.amount;
    } else {
      totalDebits += Math.abs(tx.amount);
    }

    // Check confidence
    if (tx.confidence < confidenceThreshold) {
      flagged = true;
      reasons.push(`Low confidence score (${tx.confidence.toFixed(2)} < ${confidenceThreshold.toFixed(2)})`);
    }

    // Check amount
    if (tx.amount === 0) {
      flagged = true;
      reasons.push('Zero or missing amount');
    }

    // Check date bounds
    if (tx.date) {
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) {
        flagged = true;
        reasons.push(`Invalid date format: ${tx.date}`);
      } else {
        if (startDate && txDate < startDate) {
          flagged = true;
          dateConsistent = false;
          reasons.push(`Date ${tx.date} earlier than start (${metadata.statement_start_date})`);
        }
        if (endDate && txDate > endDate) {
          flagged = true;
          dateConsistent = false;
          reasons.push(`Date ${tx.date} later than end (${metadata.statement_end_date})`);
        }
      }
    }

    // Check running balance
    if (tx.running_balance !== undefined && tx.running_balance !== null && prevBal !== null) {
      const expectedBal = Math.round((prevBal + tx.amount) * 100) / 100;
      const actualBal = Math.round(tx.running_balance * 100) / 100;
      const diff = Math.abs(expectedBal - actualBal);
      if (diff > tolerance) {
        flagged = true;
        runningConsistent = false;
        reasons.push(`Running balance jump: expected ${expectedBal.toFixed(2)}, found ${actualBal.toFixed(2)}`);
      }
    }

    if (tx.running_balance !== undefined && tx.running_balance !== null) {
      prevBal = tx.running_balance;
    } else if (prevBal !== null) {
      prevBal = Math.round((prevBal + tx.amount) * 100) / 100;
    }

    return {
      ...tx,
      needs_review: flagged,
      review_reasons: reasons.length > 0 ? reasons : tx.review_reasons,
    };
  });

  const netTransactions = Math.round((totalCredits - totalDebits) * 100) / 100;
  const opening = metadata.opening_balance;
  const closing = metadata.closing_balance;

  let calculatedClosing: number | null = null;
  let difference = 0;
  let isBalanced = true;

  if (opening !== null && closing !== null) {
    calculatedClosing = Math.round((opening + netTransactions) * 100) / 100;
    difference = Math.round((calculatedClosing - closing) * 100) / 100;
    if (Math.abs(difference) > tolerance) {
      isBalanced = false;
      issues.push(
        `Reconciliation Discrepancy: Opening (${opening.toFixed(2)}) + Net (${netTransactions >= 0 ? '+' : ''}${netTransactions.toFixed(2)}) = Calculated Closing (${calculatedClosing.toFixed(2)}) mismatches Stated Closing (${closing.toFixed(2)}) by ${difference >= 0 ? '+' : ''}${difference.toFixed(2)}`
      );
    } else {
      isBalanced = true;
    }
  } else {
    isBalanced = false;
    issues.push('Opening or closing balance is not defined.');
  }

  if (!runningConsistent) {
    issues.push('Discontinuous running balance found in one or more rows.');
  }
  if (!dateConsistent) {
    issues.push('One or more transaction dates fall outside the statement period.');
  }

  const flaggedCount = updatedRows.filter((r) => r.needs_review).length;

  const report: ReconciliationReport = {
    opening_balance: opening,
    closing_balance: closing,
    calculated_closing: calculatedClosing,
    total_credits: Math.round(totalCredits * 100) / 100,
    total_debits: Math.round(totalDebits * 100) / 100,
    net_transactions: netTransactions,
    difference,
    is_balanced: isBalanced,
    running_balance_consistent: runningConsistent,
    date_bounds_consistent: dateConsistent,
    flagged_rows_count: flaggedCount,
    total_rows: updatedRows.length,
    issues,
  };

  return { updatedRows, report };
}

export function generateCsvString(
  rows: TransactionRow[],
  onlyApproved: boolean = false
): string {
  const headers = [
    'date',
    'description',
    'amount',
    'notes',
    'source_file',
    'page',
    'confidence',
    'needs_review',
  ];

  const filtered = onlyApproved ? rows.filter((r) => !r.needs_review) : rows;

  const csvRows = [headers.join(',')];

  for (const r of filtered) {
    const escapedDesc = `"${r.description.replace(/"/g, '""')}"`;
    const escapedNotes = `"${(r.notes || '').replace(/"/g, '""')}"`;
    const escapedFile = `"${r.source_file.replace(/"/g, '""')}"`;

    csvRows.push([
      r.date,
      escapedDesc,
      r.amount.toFixed(2),
      escapedNotes,
      escapedFile,
      r.page,
      r.confidence.toFixed(2),
      r.needs_review ? 'true' : 'false',
    ].join(','));
  }

  return csvRows.join('\n');
}

export function generateTsvString(
  rows: TransactionRow[],
  onlyApproved: boolean = false
): string {
  const headers = [
    'date',
    'description',
    'amount',
    'notes',
    'source_file',
    'page',
    'confidence',
    'needs_review',
  ];

  const filtered = onlyApproved ? rows.filter((r) => !r.needs_review) : rows;

  const tsvRows = [headers.join('\t')];

  for (const r of filtered) {
    // In TSV, clean newlines or tabs from values so spreadsheet cells don't break
    const cleanDesc = r.description.replace(/[\t\r\n]+/g, ' ');
    const cleanNotes = (r.notes || '').replace(/[\t\r\n]+/g, ' ');
    const cleanFile = r.source_file.replace(/[\t\r\n]+/g, ' ');

    tsvRows.push([
      r.date,
      cleanDesc,
      r.amount.toFixed(2),
      cleanNotes,
      cleanFile,
      r.page,
      r.confidence.toFixed(2),
      r.needs_review ? 'true' : 'false',
    ].join('\t'));
  }

  return tsvRows.join('\n');
}

export function generateHtmlTable(
  rows: TransactionRow[],
  onlyApproved: boolean = false
): string {
  const headers = [
    'date',
    'description',
    'amount',
    'notes',
    'source_file',
    'page',
    'confidence',
    'needs_review',
  ];

  const filtered = onlyApproved ? rows.filter((r) => !r.needs_review) : rows;

  const ths = headers.map((h) => `<th style="border:1px solid #ddd;padding:4px 8px;font-weight:bold;background:#f5f5f5;">${h}</th>`).join('');
  const trs = filtered.map((r) => {
    return `<tr>
      <td style="border:1px solid #ddd;padding:4px 8px;">${r.date}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;">${r.description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;text-align:right;">${r.amount.toFixed(2)}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;">${(r.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;">${r.source_file}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;text-align:center;">${r.page}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;text-align:right;">${r.confidence.toFixed(2)}</td>
      <td style="border:1px solid #ddd;padding:4px 8px;text-align:center;">${r.needs_review ? 'true' : 'false'}</td>
    </tr>`;
  }).join('');

  return `<table style="border-collapse:collapse;font-family:sans-serif;font-size:12px;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

export async function copyToClipboardForSpreadsheet(
  rows: TransactionRow[],
  onlyApproved: boolean = false
): Promise<boolean> {
  const tsv = generateTsvString(rows, onlyApproved);
  const html = generateHtmlTable(rows, onlyApproved);

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/plain': new Blob([tsv], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch (err) {
    // Fallback to text/plain writeText with TSV
    try {
      await navigator.clipboard.writeText(tsv);
      return true;
    } catch {
      return false;
    }
  }
}
