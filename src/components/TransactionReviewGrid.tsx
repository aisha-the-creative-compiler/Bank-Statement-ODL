import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Search, 
  FileCheck2, 
  HelpCircle,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Table,
  Copy,
  Check
} from 'lucide-react';
import { TransactionRow } from '../types/statement';
import { copyToClipboardForSpreadsheet } from '../utils/reconciliation';

interface TransactionReviewGridProps {
  transactions: TransactionRow[];
  onUpdateRow: (id: string, updatedFields: Partial<TransactionRow>) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
  onHoverRow: (id: string | null) => void;
  hoveredRowId: string | null;
  currency: string;
  onQuickCopyForSheets?: () => void;
  quickCopied?: boolean;
}

export const TransactionReviewGrid: React.FC<TransactionReviewGridProps> = ({
  transactions,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
  onHoverRow,
  hoveredRowId,
  currency,
  onQuickCopyForSheets,
  quickCopied: propQuickCopied,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'approved' | 'debits' | 'credits'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localCopied, setLocalCopied] = useState<boolean>(false);

  const isCopied = propQuickCopied ?? localCopied;

  const handleCopySheets = async () => {
    if (onQuickCopyForSheets) {
      onQuickCopyForSheets();
    } else {
      await copyToClipboardForSpreadsheet(transactions, false);
      setLocalCopied(true);
      setTimeout(() => setLocalCopied(false), 2500);
    }
  };

  // Filter logic
  const filteredRows = transactions.filter((row) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = row.description.toLowerCase().includes(q);
      const matchNotes = (row.notes || '').toLowerCase().includes(q);
      const matchDate = row.date.includes(q);
      const matchAmt = row.amount.toString().includes(q);
      if (!matchDesc && !matchNotes && !matchDate && !matchAmt) return false;
    }

    if (filterType === 'flagged') return row.needs_review;
    if (filterType === 'approved') return !row.needs_review;
    if (filterType === 'debits') return row.amount < 0;
    if (filterType === 'credits') return row.amount > 0;
    return true;
  });

  const flaggedCount = transactions.filter((r) => r.needs_review).length;
  const approvedCount = transactions.length - flaggedCount;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search and Filter Controls */}
      <div className="p-3 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-2 bg-neutral-50/50">
        <div className="flex items-center gap-1.5 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search descriptions, cheques, amounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
            />
          </div>
        </div>

        {/* Filter buttons and actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${
              filterType === 'flagged'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-amber-500 group-hover:text-white" />
            <span>Review ({flaggedCount})</span>
          </button>
          <button
            onClick={() => setFilterType('approved')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition flex items-center gap-1 ${
              filterType === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-md transition"
            title="Add new transaction row"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Add Row</span>
          </button>

          {/* Quick Copy for Google Sheets with auto-column split */}
          <button
            onClick={handleCopySheets}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border shadow-2xs transition ${
              isCopied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Copy all rows formatted for Google Sheets (auto-splits across Columns A to H when pasted with Ctrl+V)"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied for Sheets!</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copy for Sheets (Cols A-H)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-100 text-neutral-700 sticky top-0 z-10 font-semibold border-b border-neutral-200 select-none">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">Status</th>
              <th className="py-2.5 px-3 w-28">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400 font-mono">A</span>
                  <span>Date (ISO)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[200px]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400 font-mono">B</span>
                  <span>Description</span>
                </div>
              </th>
              <th className="py-2.5 px-3 w-32 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] text-neutral-400 font-mono">C</span>
                  <span>Amount ({currency})</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[140px]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400 font-mono">D</span>
                  <span>Notes / Cheque</span>
                </div>
              </th>
              <th className="py-2.5 px-2 w-16 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono">G</span>
                  <span>Conf</span>
                </div>
              </th>
              <th className="py-2.5 px-2 w-12 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono">F</span>
                  <span>Page</span>
                </div>
              </th>
              <th className="py-2.5 px-2 w-12 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400 text-xs">
                  No transactions match the selected filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isHovered = hoveredRowId === row.id;
                const isDebit = row.amount < 0;

                return (
                  <tr
                    key={row.id}
                    onMouseEnter={() => onHoverRow(row.id)}
                    onMouseLeave={() => onHoverRow(null)}
                    className={`transition-colors ${
                      isHovered
                        ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-300'
                        : row.needs_review
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    {/* Needs Review / Approved Toggle Status */}
                    <td className="py-2 px-3 text-center align-top pt-3">
                      <button
                        onClick={() =>
                          onUpdateRow(row.id, {
                            needs_review: !row.needs_review,
                            review_reasons: row.needs_review ? [] : ['Manually flagged for review'],
                          })
                        }
                        className="transition focus:outline-none"
                        title={row.needs_review ? 'Flagged for review. Click to mark approved.' : 'Approved. Click to flag for review.'}
                      >
                        {row.needs_review ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 hover:text-amber-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 hover:text-emerald-700" />
                        )}
                      </button>
                    </td>

                    {/* Date input (ISO 8601: YYYY-MM-DD) */}
                    <td className="py-2 px-3 align-top">
                      <input
                        type="text"
                        value={row.date}
                        onChange={(e) => onUpdateRow(row.id, { date: e.target.value })}
                        className="w-full font-mono text-xs text-neutral-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-neutral-300 focus:border-neutral-900 rounded px-1.5 py-1 focus:outline-none"
                      />
                    </td>

                    {/* Description input */}
                    <td className="py-2 px-3 align-top">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => onUpdateRow(row.id, { description: e.target.value })}
                        className="w-full text-xs text-neutral-900 font-medium bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-neutral-300 focus:border-neutral-900 rounded px-1.5 py-1 focus:outline-none"
                      />
                      {/* Diagnostic review reasons if flagged */}
                      {row.needs_review && row.review_reasons.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {row.review_reasons.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-amber-800 bg-amber-100/70 border border-amber-200 px-1.5 py-0.5 rounded font-mono"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Amount input: signed decimal */}
                    <td className="py-2 px-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={row.amount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onUpdateRow(row.id, { amount: val });
                          }}
                          className={`w-28 text-right font-mono font-semibold text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-neutral-300 focus:border-neutral-900 rounded px-1.5 py-1 focus:outline-none ${
                            isDebit ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        />
                      </div>
                      {row.running_balance !== null && row.running_balance !== undefined && (
                        <div className="text-[10px] text-neutral-400 font-mono text-right pr-1 mt-0.5">
                          Bal: {row.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>

                    {/* Notes / Cheque / IBAN input */}
                    <td className="py-2 px-3 align-top">
                      <input
                        type="text"
                        value={row.notes || ''}
                        onChange={(e) => onUpdateRow(row.id, { notes: e.target.value })}
                        placeholder="Cheque #, IBAN, Reference..."
                        className="w-full font-mono text-[11px] text-neutral-600 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-neutral-300 focus:border-neutral-900 rounded px-1.5 py-1 focus:outline-none"
                      />
                    </td>

                    {/* Confidence score */}
                    <td className="py-2 px-2 align-top text-center pt-2.5">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono text-[11px] font-medium ${
                            row.confidence >= 0.9
                              ? 'text-emerald-700'
                              : row.confidence >= 0.8
                              ? 'text-amber-700'
                              : 'text-rose-600 font-bold'
                          }`}
                        >
                          {row.confidence.toFixed(2)}
                        </span>
                        <div className="w-8 h-1 bg-neutral-200 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full ${
                              row.confidence >= 0.9
                                ? 'bg-emerald-500'
                                : row.confidence >= 0.8
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Page */}
                    <td className="py-2 px-2 align-top text-center font-mono text-neutral-500 text-xs pt-3">
                      {row.page}
                    </td>

                    {/* Delete action */}
                    <td className="py-2 px-2 align-top text-center pt-2.5">
                      <button
                        onClick={() => onDeleteRow(row.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete transaction row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>
            Total Rows: <strong className="font-mono">{transactions.length}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Needs Review: <strong className="font-mono">{flaggedCount}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved: <strong className="font-mono">{approvedCount}</strong>
          </span>
        </div>

        <div className="text-[11px] text-neutral-400">
          Click any cell to edit inline • Press Export CSV to generate final output
        </div>
      </div>
    </div>
  );
};
