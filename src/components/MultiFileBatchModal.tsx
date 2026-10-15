import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Trash2, 
  Layers, 
  Sparkles,
  ArrowRight,
  Filter,
  CheckCheck,
  AlertTriangle,
  Play
} from 'lucide-react';
import { ExtractionEngineType, UploadedDocument, BatchProgressInfo, BatchQueueItem } from '../types/statement';

interface MultiFileBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessFiles: (
    files: File[], 
    engine: ExtractionEngineType, 
    forcedBank: string | null
  ) => Promise<void>;
  isProcessing: boolean;
  queue: UploadedDocument[];
  batchProgress: BatchProgressInfo;
  onSelectDocument: (docId: string) => void;
  onRemoveDocument: (docId: string) => void;
}

export const MultiFileBatchModal: React.FC<MultiFileBatchModalProps> = ({
  isOpen,
  onClose,
  onProcessFiles,
  isProcessing,
  queue,
  batchProgress,
  onSelectDocument,
  onRemoveDocument,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [engine, setEngine] = useState<ExtractionEngineType>('local_python');
  const [forcedBank, setForcedBank] = useState<string>('auto');
  const [queueFilter, setQueueFilter] = useState<'all' | 'completed' | 'processing' | 'pending'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(pdf|png|jpe?g|webp|tiff)$/i.test(f.name)
      );
      setSelectedFiles((prev) => [...prev, ...dropped]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const added = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...added]);
    }
  };

  const handleStartAnalysis = async () => {
    if (selectedFiles.length === 0) return;
    const filesToProcess = [...selectedFiles];
    setSelectedFiles([]);
    await onProcessFiles(
      filesToProcess, 
      engine, 
      forcedBank === 'auto' ? null : forcedBank
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter batch queue items
  const filteredQueueItems = batchProgress.items.filter((item) => {
    if (queueFilter === 'completed') return item.status === 'completed';
    if (queueFilter === 'processing') return item.status === 'processing';
    if (queueFilter === 'pending') return item.status === 'pending';
    return true;
  });

  const percentComplete = batchProgress.totalFiles > 0
    ? Math.round((batchProgress.completedCount / batchProgress.totalFiles) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold shadow-xs">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-neutral-900 text-sm">
                  Batch Multi-Statement Ingestion & Queue
                </h3>
                {isProcessing && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium animate-pulse border border-amber-300">
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    Processing Batch
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Track exact file progress: view completed, in-progress, and pending statements
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Real-time Interactive Status Counters Bar (Only when processing or has items) */}
          {(isProcessing || batchProgress.items.length > 0) && (
            <div className="space-y-3 bg-neutral-900 text-white p-4 rounded-xl border border-neutral-800 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Completed Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-neutral-300">Completed:</span>
                    <strong className="font-mono text-emerald-400 text-sm font-bold">
                      {batchProgress.completedCount}
                    </strong>
                  </div>

                  {/* Processing Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                    batchProgress.processingCount > 0 
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' 
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}>
                    {batchProgress.processingCount > 0 ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                    )}
                    <span className="text-neutral-300">In Progress:</span>
                    <strong className="font-mono text-amber-400 text-sm font-bold">
                      {batchProgress.processingCount}
                    </strong>
                  </div>

                  {/* Pending Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
                    <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="text-neutral-400">Waiting / Pending:</span>
                    <strong className="font-mono text-white text-sm font-bold">
                      {batchProgress.pendingCount}
                    </strong>
                  </div>
                </div>

                {/* Progress Percentage */}
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {percentComplete}% Complete
                  </span>
                  <span className="text-[10px] text-neutral-400 block font-mono">
                    ({batchProgress.completedCount} of {batchProgress.totalFiles} files)
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {/* Current Active Task Description */}
              {isProcessing && batchProgress.currentFileName && (
                <div className="text-[11px] text-neutral-300 flex items-center justify-between pt-1 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-neutral-400">Currently Analyzing:</span>
                    <strong className="text-white font-mono truncate">{batchProgress.currentFileName}</strong>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px] shrink-0">
                    {batchProgress.currentStage || 'Extracting tabular lines...'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Itemized Queue Breakdown Table */}
          {batchProgress.items.length > 0 && (
            <div className="space-y-2 border border-neutral-200 rounded-xl p-3.5 bg-neutral-50/50">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-neutral-600" />
                  <span className="text-xs font-bold text-neutral-900">
                    Batch Queue Items Status ({batchProgress.items.length} Files):
                  </span>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    onClick={() => setQueueFilter('all')}
                    className={`px-2 py-0.5 rounded transition font-medium ${
                      queueFilter === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    All ({batchProgress.items.length})
                  </button>
                  <button
                    onClick={() => setQueueFilter('completed')}
                    className={`px-2 py-0.5 rounded transition font-medium flex items-center gap-1 ${
                      queueFilter === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 group-hover:text-white" />
                    <span>Done ({batchProgress.completedCount})</span>
                  </button>
                  <button
                    onClick={() => setQueueFilter('processing')}
                    className={`px-2 py-0.5 rounded transition font-medium flex items-center gap-1 ${
                      queueFilter === 'processing'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                    <span>Active ({batchProgress.processingCount})</span>
                  </button>
                  <button
                    onClick={() => setQueueFilter('pending')}
                    className={`px-2 py-0.5 rounded transition font-medium flex items-center gap-1 ${
                      queueFilter === 'pending'
                        ? 'bg-neutral-700 text-white'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>Pending ({batchProgress.pendingCount})</span>
                  </button>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {filteredQueueItems.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition ${
                        item.status === 'processing'
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                          : item.status === 'completed'
                          ? 'bg-white border-neutral-200'
                          : 'bg-neutral-100/70 border-neutral-200 text-neutral-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {item.doc_type === 'digital_pdf' ? (
                          <FileText className={`w-4 h-4 shrink-0 ${
                            item.status === 'completed' ? 'text-rose-500' : 'text-neutral-400'
                          }`} />
                        ) : (
                          <ImageIcon className={`w-4 h-4 shrink-0 ${
                            item.status === 'completed' ? 'text-emerald-500' : 'text-neutral-400'
                          }`} />
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-neutral-900 truncate flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono font-normal">
                              ({formatFileSize(item.size)})
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {item.status === 'processing' && (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                                {item.currentStage || 'Running extraction pipeline...'}
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="text-emerald-700">
                                Extracted {item.rowsExtracted || 0} transaction rows • Audited
                              </span>
                            )}
                            {item.status === 'pending' && (
                              <span className="text-neutral-500">
                                In queue • Waiting to be analyzed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Status Chip & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'completed' && (
                          <>
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Done</span>
                            </span>
                            <button
                              onClick={() => {
                                onSelectDocument(item.id);
                                onClose();
                              }}
                              className="px-2 py-0.5 text-xs text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 rounded transition flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ArrowRight className="w-3 h-3 text-neutral-400" />
                            </button>
                          </>
                        )}

                        {item.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            <span>Processing</span>
                          </span>
                        )}

                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-medium border border-neutral-300">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multi-file Dropzone for Adding More Files */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-2">
              <UploadCloud className="w-5 h-5 text-neutral-600" />
            </div>
            <h4 className="text-xs font-semibold text-neutral-900">
              Drag & Drop additional bank statement PDFs or images
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Select multiple files (HBL, Meezan, Bank Alfalah, receipts, invoices) to add to the queue
            </p>
            <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition">
              Browse Files
            </span>
          </div>

          {/* Configuration controls for the batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-xs">
            <div>
              <label className="block text-neutral-600 font-medium mb-1">
                Extraction Pipeline Engine:
              </label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as ExtractionEngineType)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="local_python">Local Privacy-First Rule Engine (100% Offline)</option>
                <option value="gemini_vision">Gemini 3.8 Flash Vision (Deep Multimodal OCR)</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-600 font-medium mb-1">
                Bank Format Layout Adapter:
              </label>
              <select
                value={forcedBank}
                onChange={(e) => setForcedBank(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="auto">Auto-detect per statement (Recommended)</option>
                <option value="hbl">Habib Bank Limited (HBL)</option>
                <option value="meezan">Meezan Bank Limited (Islamic)</option>
                <option value="bafl">Bank Alfalah Limited</option>
                <option value="scb">Standard Chartered Bank</option>
                <option value="generic">Generic Tabular Adapter</option>
              </select>
            </div>
          </div>

          {/* Selected files waiting to start analysis */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-300">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                <span>New Files Ready to Process ({selectedFiles.length}):</span>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-neutral-500 hover:text-rose-600 transition"
                >
                  Clear Selection
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/\.pdf$/i.test(file.name) ? (
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <span className="font-medium text-neutral-800 truncate">{file.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartAnalysis}
                disabled={isProcessing}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Statement Files...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Start Analysis for {selectedFiles.length} File(s)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            {batchProgress.completedCount > 0 ? (
              <span>
                <strong className="text-emerald-700 font-bold">{batchProgress.completedCount}</strong> of{' '}
                <strong className="text-neutral-800">{batchProgress.totalFiles}</strong> files ready
              </span>
            ) : (
              <span>Queue is ready</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition"
          >
            Close & Review
          </button>
        </div>
      </div>
    </div>
  );
};
