import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Plus,
  Table
} from 'lucide-react';
import { BatchProgressInfo } from '../types/statement';

interface BatchStatusCockpitProps {
  batchProgress: BatchProgressInfo;
  onOpenBatchModal: () => void;
  onSelectDocument: (docId: string) => void;
  activeDocId?: string;
  onSelectCombinedView: () => void;
  isCombinedView: boolean;
  onTriggerUpload: () => void;
}

export const BatchStatusCockpit: React.FC<BatchStatusCockpitProps> = ({
  batchProgress,
  onOpenBatchModal,
  onSelectDocument,
  activeDocId,
  onSelectCombinedView,
  isCombinedView,
  onTriggerUpload,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'pending'>('all');

  // If no files ever processed or queued, do not render
  if (batchProgress.totalFiles === 0 && batchProgress.items.length === 0) {
    return null;
  }

  const percentComplete = batchProgress.totalFiles > 0
    ? Math.round((batchProgress.completedCount / batchProgress.totalFiles) * 100)
    : 0;

  const filteredItems = batchProgress.items.filter((item) => {
    if (filter === 'completed') return item.status === 'completed';
    if (filter === 'processing') return item.status === 'processing';
    if (filter === 'pending') return item.status === 'pending';
    return true;
  });

  return (
    <div className="bg-neutral-900 text-white border-b border-neutral-800 shadow-md">
      {/* Primary Status Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Overall Status & Progress Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {batchProgress.isProcessing ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/40 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Analyzing Batch</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-xs border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Batch Processed</span>
                </span>
              )}
              <span className="text-xs font-semibold text-neutral-200">
                Statements Ingestion Pipeline
              </span>
            </div>

            {/* Interactive Metrics Counter Badges */}
            <div className="flex items-center gap-1.5 text-xs">
              {/* Completed Badge */}
              <button
                onClick={() => {
                  setFilter(filter === 'completed' ? 'all' : 'completed');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium border ${
                  filter === 'completed'
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800/60'
                }`}
                title="Filter by completed files"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completed:</span>
                <strong className="font-mono">{batchProgress.completedCount}</strong>
              </button>

              {/* In-Progress Badge */}
              <button
                onClick={() => {
                  setFilter(filter === 'processing' ? 'all' : 'processing');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium border ${
                  filter === 'processing'
                    ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold'
                    : batchProgress.processingCount > 0
                    ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-800/60 animate-pulse'
                    : 'bg-neutral-800/70 text-neutral-400 border-neutral-700'
                }`}
                title="Filter by currently analyzing files"
              >
                {batchProgress.processingCount > 0 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>Active:</span>
                <strong className="font-mono">{batchProgress.processingCount}</strong>
              </button>

              {/* Waiting / Pending Badge */}
              <button
                onClick={() => {
                  setFilter(filter === 'pending' ? 'all' : 'pending');
                  setIsExpanded(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium border ${
                  filter === 'pending'
                    ? 'bg-neutral-200 text-neutral-950 border-white font-bold'
                    : 'bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 border-neutral-700'
                }`}
                title="Filter by files waiting in queue"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Waiting:</span>
                <strong className="font-mono">{batchProgress.pendingCount}</strong>
              </button>
            </div>
          </div>

          {/* Right: Quick Action Buttons & Expand Toggle */}
          <div className="flex items-center gap-2 text-xs">
            {batchProgress.completedCount >= 2 && (
              <button
                onClick={onSelectCombinedView}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                  isCombinedView
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                }`}
                title="View all uploaded statements consolidated into a single master sheet"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consolidated Master ({batchProgress.completedCount})</span>
              </button>
            )}

            <button
              onClick={onTriggerUpload}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
              title="Add more files to batch"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Add Files</span>
            </button>

            <button
              onClick={onOpenBatchModal}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
              title="Open full batch queue dialog"
            >
              Batch Queue Dialog
            </button>

            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title={isExpanded ? 'Collapse queue drawer' : 'Expand queue drawer'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar and active status detail */}
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-2 truncate">
              {batchProgress.isProcessing && batchProgress.currentFileName ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span>Processing:</span>
                  <span className="font-mono font-semibold text-white truncate max-w-xs">
                    {batchProgress.currentFileName}
                  </span>
                  <span className="text-amber-300 text-[10px] hidden md:inline">
                    — {batchProgress.currentStage || 'Running tabular extraction & audit...'}
                  </span>
                </>
              ) : (
                <span>All {batchProgress.completedCount} statement file(s) processed and audited.</span>
              )}
            </div>

            <span className="font-mono text-emerald-400 font-semibold shrink-0">
              {batchProgress.completedCount} / {batchProgress.totalFiles} files ({percentComplete}%)
            </span>
          </div>

          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Itemized Files Drawer */}
      {isExpanded && batchProgress.items.length > 0 && (
        <div className="border-t border-neutral-800 bg-neutral-950/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
              <span className="font-semibold text-neutral-300">
                Queue Breakdown ({batchProgress.items.length} Files):
              </span>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Show All Files
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isSelected = activeDocId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.status === 'completed') {
                        onSelectDocument(item.id);
                      }
                    }}
                    className={`p-2 rounded-lg border text-xs transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-neutral-800 border-emerald-500 ring-1 ring-emerald-500'
                        : item.status === 'processing'
                        ? 'bg-amber-950/30 border-amber-500/50'
                        : item.status === 'completed'
                        ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                        : 'bg-neutral-900/40 border-neutral-800/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 truncate">
                        {item.doc_type === 'digital_pdf' ? (
                          <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-semibold text-white truncate text-[11px]" title={item.name}>
                          {item.name}
                        </span>
                      </div>

                      {/* Status icon badge */}
                      {item.status === 'completed' ? (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Done</span>
                        </span>
                      ) : item.status === 'processing' ? (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>Queued</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>
                        {item.status === 'completed'
                          ? `${item.rowsExtracted || 0} rows`
                          : item.status === 'processing'
                          ? 'Extracting...'
                          : 'Waiting...'}
                      </span>
                      {item.status === 'completed' && (
                        <span className="text-emerald-400 font-sans text-[10px] flex items-center gap-0.5 hover:underline">
                          <span>View</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
