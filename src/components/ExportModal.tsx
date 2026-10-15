import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  AlertTriangle,
  Table,
  Sparkles,
  Info
} from 'lucide-react';
import { TransactionRow } from '../types/statement';
import { 
  generateCsvString, 
  generateTsvString, 
  copyToClipboardForSpreadsheet 
} from '../utils/reconciliation';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRow[];
  statementFilename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  statementFilename,
}) => {
  const [onlyApproved, setOnlyApproved] = useState<boolean>(false);
  const [formatType, setFormatType] = useState<'sheets' | 'csv'>('sheets');
  const [copiedType, setCopiedType] = useState<'sheets' | 'csv' | null>(null);

  if (!isOpen) return null;

  const csvContent = generateCsvString(transactions, onlyApproved);
  const tsvContent = generateTsvString(transactions, onlyApproved);
  const flaggedCount = transactions.filter((r) => r.needs_review).length;
  const targetCount = onlyApproved ? transactions.length - flaggedCount : transactions.length;

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanName = statementFilename.replace(/\.[^/.]+$/, '');
    link.href = url;
    link.setAttribute('download', `${cleanName}_extracted.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyForGoogleSheets = async () => {
    await copyToClipboardForSpreadsheet(transactions, onlyApproved);
    setCopiedType('sheets');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyRawCsv = () => {
    navigator.clipboard.writeText(csvContent);
    setCopiedType('csv');
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm">
                Export to Google Sheets & CSV
              </h3>
              <p className="text-xs text-neutral-500">
                Auto-fills columns A through H with zero formatting issues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Options */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Solution Highlight Box for Google Sheets */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900 block text-xs">
                  Ready for Google Sheets & Excel:
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed mt-0.5">
                  Click the button below to copy table-formatted data. When you press <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono text-[10px] font-semibold">Ctrl+V</kbd> in Google Sheets, every column (A: Date, B: Description, C: Amount, D: Notes...) will populate its own individual cell automatically!
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyForGoogleSheets}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition active:scale-98"
            >
              {copiedType === 'sheets' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied for Sheets!</span>
                </>
              ) : (
                <>
                  <Table className="w-4 h-4" />
                  <span>Copy for Google Sheets</span>
                </>
              )}
            </button>
          </div>

          {/* Audit warning if unapproved rows exist */}
          {flaggedCount > 0 && !onlyApproved && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Audit Notice: </strong>
                <span>
                  {flaggedCount} transaction row(s) are flagged with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">needs_review = true</code>.
                  You can export all rows including audit flags, or switch to approved only.
                </span>
              </div>
            </div>
          )}

          {/* Scope selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs">
            <span className="font-medium text-neutral-700">Export Scope:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export_scope"
                  checked={!onlyApproved}
                  onChange={() => setOnlyApproved(false)}
                  className="text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-neutral-700">All Rows ({transactions.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export_scope"
                  checked={onlyApproved}
                  onChange={() => setOnlyApproved(true)}
                  className="text-neutral-900 focus:ring-neutral-900"
                />
                <span className="text-neutral-700">
                  Approved Only ({transactions.length - flaggedCount})
                </span>
              </label>
            </div>
          </div>

          {/* Format Preview Switcher */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-3 py-2 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFormatType('sheets')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                    formatType === 'sheets'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Tab-Delimited (Google Sheets Auto-Split)
                </button>
                <button
                  onClick={() => setFormatType('csv')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                    formatType === 'csv'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Raw CSV (Comma-Delimited)
                </button>
              </div>

              <div className="flex items-center gap-2">
                {formatType === 'sheets' ? (
                  <button
                    onClick={handleCopyForGoogleSheets}
                    className="text-xs text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 font-medium transition"
                  >
                    {copiedType === 'sheets' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy TSV</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCopyRawCsv}
                    className="text-xs text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1 font-medium transition"
                  >
                    {copiedType === 'csv' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy CSV</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <textarea
              readOnly
              value={formatType === 'sheets' ? tsvContent : csvContent}
              rows={7}
              className="w-full font-mono text-[11px] p-3 bg-neutral-50/50 text-neutral-800 select-all focus:outline-none border-0 resize-none"
            />
          </div>

          {/* Quick Guide for Google Sheets */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-neutral-800">How to paste into Google Sheets:</strong>
              <ol className="list-decimal list-inside space-y-0.5 mt-1 text-neutral-600">
                <li>Click <strong>&quot;Copy for Google Sheets&quot;</strong> button above.</li>
                <li>In Google Sheets, click on cell <strong>A1</strong>.</li>
                <li>Press <kbd className="px-1 py-0.2 bg-white border border-neutral-300 rounded font-mono font-semibold">Ctrl+V</kbd> (or <kbd className="px-1 py-0.2 bg-white border border-neutral-300 rounded font-mono font-semibold">Cmd+V</kbd> on Mac).</li>
                <li>The 8 columns (date, description, amount, notes, source_file, page, confidence, needs_review) will immediately fill across Columns A through H!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Exporting <strong className="text-neutral-700">{targetCount}</strong> row(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg bg-white transition"
            >
              Done
            </button>
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Download .CSV File</span>
            </button>
            <button
              onClick={handleCopyForGoogleSheets}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition"
            >
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedType === 'sheets' ? 'Copied to Clipboard!' : 'Copy for Sheets'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
