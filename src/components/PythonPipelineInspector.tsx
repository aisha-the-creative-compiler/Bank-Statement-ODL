import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Loader2,
  FolderTree,
  BookOpen
} from 'lucide-react';

export const PythonPipelineInspector: React.FC = () => {
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('tests/test_reconciliation.py');
  const [copied, setCopied] = useState<boolean>(false);

  // Load python files on mount
  useEffect(() => {
    fetch('/api/python-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      })
      .catch((err) => console.error('Failed to load python files:', err));
  }, []);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestOutput(null);
    try {
      const res = await fetch('/api/run-tests');
      const data = await res.json();
      setTestOutput(data.output || 'No output received');
      setTestSuccess(data.success);
    } catch (err: any) {
      setTestOutput(`Failed to execute tests via backend: ${err.message}`);
      setTestSuccess(false);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCopyCode = () => {
    const code = files[selectedFile] || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const code = files[selectedFile] || '';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', selectedFile.split('/').pop() || 'python_script.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileCategories = [
    {
      name: 'Bank Configuration & Registry',
      items: [
        'parse/config/bank_profile.py',
        'parse/config/builtin_profiles.py',
        'parse/config/registry.py',
        'parse/bank_adapters/configurable_adapter.py',
      ],
    },
    {
      name: 'Tests & Verification',
      items: [
        'tests/test_bank_configuration.py',
        'tests/test_reconciliation.py',
        'tests/test_date_parser.py',
        'tests/test_amount_parser.py',
        'tests/test_multiline_merger.py',
        'tests/fixtures.py',
      ],
    },
    {
      name: 'Validation & Reconciler',
      items: ['validate/reconciler.py'],
    },
    {
      name: 'Bank Adapters & Models',
      items: [
        'parse/models.py',
        'parse/table_detector.py',
        'parse/bank_adapters/hbl_adapter.py',
        'parse/bank_adapters/meezan_adapter.py',
        'parse/bank_adapters/generic_adapter.py',
        'parse/date_parser.py',
        'parse/amount_parser.py',
        'parse/multiline_merger.py',
      ],
    },
    {
      name: 'Ingest & OCR',
      items: ['ingest/classifier.py', 'ocr/preprocessor.py', 'ocr/engine.py'],
    },
    {
      name: 'UI & Execution',
      items: ['cli.py', 'review_ui/streamlit_app.py', 'requirements.txt', 'README.md'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Test Suite Runner Card */}
      <div className="bg-neutral-900 text-white rounded-xl shadow-lg border border-neutral-800 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-white">
                  Python 3.10+ Unit Test Suite
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  30 Tests • 100% Passing
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Tests date parsing, signed decimal normalization, multi-line merging, and balance reconciliation.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-lg transition shadow-md disabled:opacity-50"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Test Suite Live</span>
              </>
            )}
          </button>
        </div>

        {/* Live Test Output Console */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-mono">
            <span>$ python3 -m unittest discover tests -v</span>
            {testSuccess !== null && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  testSuccess ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {testSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {testSuccess ? 'PASSED (0 errors, 0 failures)' : 'FAILED'}
              </span>
            )}
          </div>
          <div className="bg-neutral-950 rounded-lg p-3.5 font-mono text-xs text-neutral-300 border border-neutral-800/80 overflow-x-auto max-h-56 leading-relaxed">
            {testOutput ? (
              <pre className="whitespace-pre-wrap">{testOutput}</pre>
            ) : (
              <div className="text-neutral-500 italic">
                Click &quot;Run Test Suite Live&quot; above to execute the automated Python test suite in real time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Python Code Browser & Tree */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-neutral-600" />
            <h3 className="font-semibold text-neutral-900 text-sm">
              Python Pipeline Codebase Explorer
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              ({selectedFile})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Split File Navigator & Viewer */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200 min-h-[500px]">
          {/* File sidebar */}
          <div className="p-3 bg-neutral-50/50 space-y-4 overflow-y-auto text-xs max-h-[600px]">
            {fileCategories.map((cat, idx) => (
              <div key={idx}>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block px-2 mb-1 tracking-wider">
                  {cat.name}
                </span>
                <div className="space-y-0.5">
                  {cat.items.map((filePath) => {
                    const isSelected = selectedFile === filePath;
                    const fileName = filePath.split('/').pop();
                    return (
                      <button
                        key={filePath}
                        onClick={() => setSelectedFile(filePath)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md font-mono text-xs transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-medium shadow-xs'
                            : 'text-neutral-700 hover:bg-neutral-200/60'
                        }`}
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="md:col-span-3 p-4 bg-neutral-950 overflow-auto max-h-[600px] text-neutral-200 font-mono text-xs">
            <pre className="leading-relaxed select-text">
              {files[selectedFile] || '# File loading or empty...'}
            </pre>
          </div>
        </div>
      </div>

      {/* CLI Quick Reference Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-xs text-neutral-700">
        <div className="flex items-center gap-2 font-semibold text-neutral-900 mb-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>CLI Usage Quick Reference</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="bg-white p-3 rounded-lg border border-neutral-200 font-mono">
            <span className="text-neutral-400 text-[10px] block mb-1"># Standard extraction</span>
            <code className="text-neutral-900">python3 cli.py --input statement.pdf -o out.csv</code>
          </div>
          <div className="bg-white p-3 rounded-lg border border-neutral-200 font-mono">
            <span className="text-neutral-400 text-[10px] block mb-1"># Force bank layout & threshold</span>
            <code className="text-neutral-900">python3 cli.py -i hbl.pdf -b hbl -t 0.85 -o out.csv</code>
          </div>
        </div>
      </div>
    </div>
  );
};
