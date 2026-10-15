import React from 'react';
import { 
  FileText, 
  Upload, 
  Terminal, 
  ShieldCheck, 
  Sparkles, 
  FileSpreadsheet,
  ChevronDown,
  Building2,
  Table,
  Check
} from 'lucide-react';
import { SAMPLE_STATEMENTS } from '../data/sampleStatements';
import { BankPreset, ExtractionEngineType, UploadedDocument } from '../types/statement';
import { Layers, FolderUp } from 'lucide-react';

interface NavbarProps {
  currentPreset: BankPreset;
  onSelectPreset: (preset: BankPreset) => void;
  activeTab: 'workspace' | 'bank_configs' | 'python_tests';
  onTabChange: (tab: 'workspace' | 'bank_configs' | 'python_tests') => void;
  engine: ExtractionEngineType;
  onEngineChange: (engine: ExtractionEngineType) => void;
  onFilesUpload: (files: File[]) => void;
  onOpenBatchModal: () => void;
  onOpenExportModal: () => void;
  flaggedCount: number;
  onQuickCopyForSheets?: () => void;
  quickCopied?: boolean;
  uploadedDocs: UploadedDocument[];
  isCombinedView: boolean;
  onSelectCombinedView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPreset,
  onSelectPreset,
  activeTab,
  onTabChange,
  engine,
  onEngineChange,
  onFilesUpload,
  onOpenBatchModal,
  onOpenExportModal,
  flaggedCount,
  onQuickCopyForSheets,
  quickCopied,
  uploadedDocs,
  isCombinedView,
  onSelectCombinedView,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesUpload(Array.from(e.target.files));
    }
  };

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-neutral-900 text-base tracking-tight">
                Bank Statement OCR → CSV
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                Multi-Statement Pipeline
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              HBL • Meezan • Multi-File Batch • Balance Reconciliation & Review
            </p>
          </div>
        </div>

        {/* Statement / Preset / Combined Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <select
              value={isCombinedView ? 'combined_master' : currentPreset.id}
              onChange={(e) => {
                if (e.target.value === 'combined_master') {
                  onSelectCombinedView();
                } else {
                  const found = SAMPLE_STATEMENTS.find((p) => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }
              }}
              className="appearance-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-neutral-900/10 max-w-[220px] sm:max-w-[260px] truncate"
            >
              <optgroup label="Sample Statements">
                {SAMPLE_STATEMENTS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </optgroup>

              {uploadedDocs.length > 0 && (
                <optgroup label={`Uploaded Batch (${uploadedDocs.length} files)`}>
                  <option value="combined_master">
                    ★ All Uploaded Statements (Combined Master View)
                  </option>
                  {uploadedDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.transactions.length} rows)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Multiple File Upload & Batch Manager Buttons */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition"
            title="Upload multiple statement files (PDF, PNG, JPG)"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden md:inline">Upload Files</span>
          </button>

          <button
            onClick={onOpenBatchModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition"
            title="Open batch upload manager and queue"
          >
            <FolderUp className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden lg:inline">Batch Queue</span>
            {uploadedDocs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-900 text-white text-[10px] font-mono font-bold">
                {uploadedDocs.length}
              </span>
            )}
          </button>
        </div>

        {/* Actions & Tab Switcher */}
        <div className="flex items-center gap-2">
          {/* Engine toggle */}
          <button
            onClick={() => onEngineChange(engine === 'local_python' ? 'gemini_vision' : 'local_python')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
              engine === 'gemini_vision'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
            title="Switch extraction engine: Local Rule-Based (Privacy 100%) vs Gemini Vision"
          >
            {engine === 'gemini_vision' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden lg:inline">Gemini 3.8 Flash Vision</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">Local Rule Engine (Private)</span>
              </>
            )}
          </button>

          {/* View Tab Switcher */}
          <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              onClick={() => onTabChange('workspace')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'workspace'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Review Workspace</span>
              {flaggedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {flaggedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onTabChange('bank_configs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'bank_configs'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Bank Adapters & Quirks</span>
            </button>
            <button
              onClick={() => onTabChange('python_tests')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'python_tests'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python Suite</span>
            </button>
          </div>

          {/* Quick Copy for Google Sheets Button */}
          {onQuickCopyForSheets && (
            <button
              onClick={onQuickCopyForSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs transition"
              title="Copy formatted cells ready to paste directly into Google Sheets (Ctrl+V splits columns A-H)"
            >
              {quickCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied for Sheets!</span>
                </>
              ) : (
                <>
                  <Table className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Copy for Sheets</span>
                </>
              )}
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
