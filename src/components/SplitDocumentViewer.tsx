import React, { useState } from 'react';
import { 
  Building2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileCode, 
  Eye, 
  Layers,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { BankPreset, TransactionRow } from '../types/statement';

interface SplitDocumentViewerProps {
  preset: BankPreset;
  activeHoveredRowId: string | null;
  onSelectRow: (rowId: string) => void;
  transactions: TransactionRow[];
}

export const SplitDocumentViewer: React.FC<SplitDocumentViewerProps> = ({
  preset,
  activeHoveredRowId,
  onSelectRow,
  transactions,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'visual' | 'raw_text'>('visual');
  const metadata = preset.metadata;

  return (
    <div className="flex flex-col h-full bg-neutral-50 border-r border-neutral-200">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-neutral-200 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neutral-600" />
          <span className="font-semibold text-xs text-neutral-800 truncate max-w-[180px] sm:max-w-[240px]">
            {metadata.bank_name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono border border-neutral-200">
            {preset.doc_type === 'digital_pdf' ? 'Digital PDF' : 'Scanned Image'}
          </span>
        </div>

        {/* View mode toggle & Zoom */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-neutral-100 p-0.5 rounded border border-neutral-200 text-xs">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === 'visual'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Visual Document Preview"
            >
              <Eye className="w-3 h-3" />
              <span>Doc</span>
            </button>
            <button
              onClick={() => setViewMode('raw_text')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                viewMode === 'raw_text'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Extracted Text Stream"
            >
              <FileCode className="w-3 h-3" />
              <span>Raw Text</span>
            </button>
          </div>

          <div className="flex items-center bg-neutral-100 rounded border border-neutral-200 p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
              className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded transition"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono font-medium px-1.5 text-neutral-600">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded transition"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Bank Quirks Ribbon */}
      {preset.detectedQuirks && preset.detectedQuirks.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-200/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] text-emerald-900 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold shrink-0">Bank Quirks Handled:</span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {preset.detectedQuirks.map((q, idx) => (
              <span
                key={idx}
                className="bg-white/90 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-800 shrink-0"
              >
                ✓ {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Document View Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center bg-neutral-100">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150 w-full max-w-[620px] shadow-md rounded-lg bg-white border border-neutral-300 min-h-[750px] p-6 text-neutral-800 flex flex-col relative"
        >
          {viewMode === 'raw_text' ? (
            /* Raw Extracted Text View */
            <div className="flex-1 font-mono text-[11px] leading-relaxed text-neutral-700 whitespace-pre-wrap select-text">
              {preset.documentText}
            </div>
          ) : (
            /* High-fidelity Visual Document Layout Replica with Bounding Boxes */
            <div className="flex-1 flex flex-col justify-between select-none">
              {/* Header section */}
              <div>
                <div className="border-b-2 border-neutral-900 pb-3 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold tracking-tight uppercase text-neutral-900">
                        {metadata.bank_name}
                      </h2>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        STATEMENT OF ACCOUNT • OFFICIAL RECORD
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                        ORIGINAL COPY
                      </span>
                    </div>
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 pt-3 border-t border-neutral-200 text-[11px]">
                    <div>
                      <span className="text-neutral-500 font-medium">Account Title: </span>
                      <span className="font-semibold text-neutral-900">{metadata.account_title}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Account No: </span>
                      <span className="font-mono font-semibold text-neutral-900">{metadata.account_number_masked}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Statement Period: </span>
                      <span className="font-mono text-neutral-800">
                        {metadata.statement_start_date || '01-Jan-2024'} to {metadata.statement_end_date || '31-Jan-2024'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Currency: </span>
                      <span className="font-semibold text-neutral-900">{metadata.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Balances summary box */}
                <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2.5 rounded border border-neutral-200 mb-4 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase">Opening Balance</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {metadata.opening_balance !== null ? metadata.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase">Closing Balance</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {metadata.closing_balance !== null ? metadata.closing_balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[9px] uppercase">Document Integrity</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
                      <FileCheck className="w-3 h-3" />
                      Audited
                    </span>
                  </div>
                </div>

                {/* Table Header */}
                <div className="bg-neutral-900 text-white text-[10px] font-semibold py-1.5 px-3 rounded-t flex justify-between uppercase tracking-wider">
                  <span className="w-20">Date</span>
                  <span className="flex-1 px-2">Description / Particulars</span>
                  <span className="w-24 text-right">Amount ({metadata.currency})</span>
                  <span className="w-24 text-right">Balance</span>
                </div>

                {/* Simulated Table Lines with interactive bounding box hover */}
                <div className="border border-neutral-300 border-t-0 rounded-b divide-y divide-neutral-200">
                  {transactions.map((tx) => {
                    const isHovered = activeHoveredRowId === tx.id;
                    const isNegative = tx.amount < 0;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onSelectRow(tx.id)}
                        className={`px-3 py-2 text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-amber-100/90 ring-2 ring-amber-400 z-10 scale-[1.01]'
                            : tx.needs_review
                            ? 'bg-amber-50/50 hover:bg-amber-100/50'
                            : 'hover:bg-neutral-50'
                        }`}
                        title={tx.needs_review ? `Flagged: ${tx.review_reasons.join(', ')}` : 'Click to inspect in review table'}
                      >
                        <div className="w-20 font-medium text-neutral-700 shrink-0">
                          {tx.date}
                        </div>
                        <div className="flex-1 px-2 font-sans text-xs text-neutral-900 truncate">
                          {tx.description}
                          {tx.notes && (
                            <span className="text-[10px] text-neutral-500 font-mono block truncate">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                        <div className={`w-24 text-right font-medium shrink-0 ${isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isNegative ? '' : '+'}
                          {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="w-24 text-right text-neutral-600 shrink-0 font-medium">
                          {tx.running_balance !== null && tx.running_balance !== undefined
                            ? tx.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })
                            : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Watermark / Footer */}
              <div className="pt-8 pb-2 text-center text-[10px] text-neutral-400 font-mono border-t border-neutral-200 mt-6">
                END OF STATEMENT • COMPUTER GENERATED RECORD • STRICT CSV PIPELINE VERIFIED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="p-2.5 bg-white border-t border-neutral-200 text-[11px] text-neutral-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span>Page 1 of 1 • Source: <code className="font-mono text-neutral-700">{preset.filename}</code></span>
        </span>
        <span className="text-neutral-400 text-[10px]">
          Hover row in table to highlight on document
        </span>
      </div>
    </div>
  );
};
