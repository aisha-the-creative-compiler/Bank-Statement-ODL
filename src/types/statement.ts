export interface TransactionRow {
  id: string;
  date: string;          // ISO 8601: YYYY-MM-DD
  description: string;   // Clean merchant or title
  amount: number;        // Signed decimal: debits negative, credits positive
  notes: string;         // Cheque numbers, IBANs, balance, reference
  source_file: string;   // Statement filename
  page: number;          // 1-indexed page
  confidence: number;    // 0.0 - 1.0
  needs_review: boolean; // Flagged for human review
  running_balance?: number | null;
  review_reasons: string[];
  raw_text?: string;
  bbox?: { top: number; left: number; width: number; height: number };
}

export interface StatementMetadata {
  bank_name: string;
  account_number_masked: string;
  account_title: string;
  currency: string;
  statement_start_date: string | null;
  statement_end_date: string | null;
  opening_balance: number | null;
  closing_balance: number | null;
  total_debits?: number | null;
  total_credits?: number | null;
}

export interface ReconciliationReport {
  opening_balance: number | null;
  closing_balance: number | null;
  calculated_closing: number | null;
  total_credits: number;
  total_debits: number;
  net_transactions: number;
  difference: number;
  is_balanced: boolean;
  running_balance_consistent: boolean;
  date_bounds_consistent: boolean;
  flagged_rows_count: number;
  total_rows: number;
  issues: string[];
}

export type ExtractionEngineType = 'local_python' | 'gemini_vision';

export interface QuirkFlags {
  has_dual_dates: boolean;
  has_dr_cr_indicator: boolean;
  cheque_in_separate_col: boolean;
  parentheses_are_negative: boolean;
  running_balance_in_table: boolean;
  tax_codes_to_notes: boolean;
  islamic_banking_tags: boolean;
  ignore_repeated_headers: boolean;
}

export interface BankProfileConfig {
  bank_id: string;
  bank_name: string;
  currency: string;
  date_convention: string;
  keywords: string[];
  account_number_regex: string;
  statement_period_regex: string;
  opening_balance_regex: string;
  closing_balance_regex: string;
  quirks: QuirkFlags;
}

export interface BatchQueueItem {
  id: string;
  name: string;
  size: number;
  doc_type: 'digital_pdf' | 'scanned_pdf' | 'image';
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStage?: string;
  rowsExtracted?: number;
  errorMessage?: string;
  completedAt?: string;
}

export interface BatchProgressInfo {
  isProcessing: boolean;
  totalFiles: number;
  completedCount: number;
  processingCount: number;
  pendingCount: number;
  currentFileName: string;
  currentStage: string;
  items: BatchQueueItem[];
}

export interface UploadedDocument {
  id: string;
  filename: string;
  fileSize: number;
  doc_type: 'digital_pdf' | 'scanned_pdf' | 'image';
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  metadata: StatementMetadata;
  transactions: TransactionRow[];
  documentText: string;
  imageBase64?: string;
  detectedQuirks?: string[];
  pageCount: number;
}

export interface BatchUploadState {
  isProcessing: boolean;
  totalFiles: number;
  processedFiles: number;
  currentFileName: string;
}

export interface BankPreset {
  id: string;
  name: string;
  bank_code: string;
  filename: string;
  doc_type: 'digital_pdf' | 'scanned_pdf' | 'image';
  currency: string;
  metadata: StatementMetadata;
  initialTransactions: TransactionRow[];
  documentText: string;
  badge: string;
  detectedQuirks?: string[];
}
