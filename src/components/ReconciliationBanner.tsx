import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  CheckCheck,
  Filter,
  Info
} from 'lucide-react';
import { ReconciliationReport, StatementMetadata } from '../types/statement';

interface ReconciliationBannerProps {
  metadata: StatementMetadata;
  report: ReconciliationReport;
  onApproveAllValid: () => void;
  onResetRows: () => void;
  filterFlaggedOnly: boolean;
  onToggleFilterFlagged: () => void;
}

export const ReconciliationBanner: React.FC<ReconciliationBannerProps> = ({
  metadata,
  report,
  onApproveAllValid,
  onResetRows,
  filterFlaggedOnly,
  onToggleFilterFlagged,
}) => {
  const currency = metadata.currency || 'PKR';

  return (
    <div className="bg-white border-b border-neutral-200 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Mathematical Equation Cockpit */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Opening Balance */}
          <div className="bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Opening Balance</span>
            <span className="font-mono font-medium text-neutral-800">
              {metadata.opening_balance !== null
                ? `${currency} ${metadata.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </span>
          </div>

          <span className="text-neutral-400 font-bold text-sm">+</span>

          {/* Credits */}
          <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Total Credits</span>
            <span className="font-mono font-medium text-emerald-800">
              +{currency} {report.total_credits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <span className="text-neutral-400 font-bold text-sm">-</span>

          {/* Debits */}
          <div className="bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
            <span className="text-rose-700 block text-[10px] uppercase font-semibold">Total Debits</span>
            <span className="font-mono font-medium text-rose-800">
              -{currency} {report.total_debits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <span className="text-neutral-400 font-bold text-sm">=</span>

          {/* Calculated Closing */}
          <div className="bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Calculated Closing</span>
            <span className="font-mono font-medium text-neutral-800">
              {report.calculated_closing !== null
                ? `${currency} ${report.calculated_closing.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />

          {/* Stated Closing & Reconciliation Status */}
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
              report.is_balanced
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            {report.is_balanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="text-[10px] uppercase font-bold tracking-tight">
                {report.is_balanced ? 'Reconciliation Passed' : 'Reconciliation Mismatch'}
              </div>
              <div className="font-mono font-semibold text-xs">
                Stated: {metadata.closing_balance !== null ? `${currency} ${metadata.closing_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
                {!report.is_balanced && (
                  <span className="ml-1.5 text-rose-700 underline">
                    (Δ {report.difference >= 0 ? '+' : ''}{report.difference.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Review Actions */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <button
            onClick={onToggleFilterFlagged}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              filterFlaggedOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Filter className="w-3 h-3 text-neutral-500" />
            <span>
              {filterFlaggedOnly ? 'Showing Flagged Only' : `Flagged (${report.flagged_rows_count})`}
            </span>
          </button>

          {report.flagged_rows_count > 0 ? (
            <button
              onClick={onApproveAllValid}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
              title="Mark all valid transactions as approved"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approve Clean Rows</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Ready for Export</span>
            </div>
          )}

          <button
            onClick={onResetRows}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
            title="Reset transactions to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Warnings & Diagnostics Banner if any issues exist */}
      {report.issues.length > 0 && (
        <div className="max-w-7xl mx-auto mt-2.5 bg-amber-50/80 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Audit Warnings Detected: </span>
            <span className="text-amber-800">{report.issues.join(' • ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
