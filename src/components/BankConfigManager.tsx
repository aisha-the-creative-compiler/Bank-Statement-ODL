import React, { useState } from 'react';
import { 
  Building2, 
  Settings2, 
  Plus, 
  Download, 
  Check, 
  Sliders, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Tag, 
  FileJson,
  Layers
} from 'lucide-react';
import { BankProfileConfig, QuirkFlags } from '../types/statement';

interface BankConfigManagerProps {
  onApplyCustomConfig?: (config: BankProfileConfig) => void;
  activeBankId?: string;
}

export const BankConfigManager: React.FC<BankConfigManagerProps> = ({
  onApplyCustomConfig,
  activeBankId = 'hbl',
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeBankId);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Default profiles state
  const [profiles, setProfiles] = useState<BankProfileConfig[]>([
    {
      bank_id: 'hbl',
      bank_name: 'Habib Bank Limited (HBL)',
      currency: 'PKR',
      date_convention: 'DD/MM/YYYY',
      keywords: ['habib bank', 'hbl', 'habib bank limited', 'i.i. chundrigar'],
      account_number_regex: 'Account\\s*(?:No|Number)\\s*[:.\\-]?\\s*([0-9\\-]{10,24})',
      statement_period_regex: '(?:Period|Statement\\s+Period|From)\\s*[:.\\-]?\\s*([0-9A-Za-z\\-/]+)\\s*(?:To|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: 'Opening\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: 'Closing\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: {
        has_dual_dates: true,
        has_dr_cr_indicator: false,
        cheque_in_separate_col: true,
        parentheses_are_negative: true,
        running_balance_in_table: true,
        tax_codes_to_notes: true,
        islamic_banking_tags: false,
        ignore_repeated_headers: true,
      },
    },
    {
      bank_id: 'meezan',
      bank_name: 'Meezan Bank Limited',
      currency: 'PKR',
      date_convention: 'DD/MM/YYYY',
      keywords: ['meezan bank', 'meezan', 'the premier islamic bank'],
      account_number_regex: 'IBAN\\s*[:.\\-]?\\s*(PK\\d{2}MEZN\\d{16})|Account\\s*No\\s*[:.\\-]?\\s*([0-9\\-]{10,24})',
      statement_period_regex: '(?:From\\s*Date|From|Period)\\s*[:.\\-]?\\s*([0-9A-Za-z\\-/]+)\\s*(?:To\\s*Date|To|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: '(?:Opening\\s+Balance|Balance\\s+B/F)\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: '(?:Closing\\s+Balance|Balance\\s+C/F)\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: {
        has_dual_dates: false,
        has_dr_cr_indicator: true,
        cheque_in_separate_col: false,
        parentheses_are_negative: true,
        running_balance_in_table: true,
        tax_codes_to_notes: true,
        islamic_banking_tags: true,
        ignore_repeated_headers: true,
      },
    },
    {
      bank_id: 'bafl',
      bank_name: 'Bank Alfalah Limited',
      currency: 'PKR',
      date_convention: 'DD/MM/YYYY',
      keywords: ['bank alfalah', 'alfalah', 'bafl'],
      account_number_regex: '(?:Account|IBAN)\\s*(?:No|#)?\\s*[:.\\-]?\\s*([A-Za-z0-9\\-]{10,24})',
      statement_period_regex: '(?:Statement\\s+Period|Period)\\s*[:.\\-]?\\s*([0-9A-Za-z\\-/]+)\\s*(?:to|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: 'Opening\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: 'Closing\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: {
        has_dual_dates: false,
        has_dr_cr_indicator: false,
        cheque_in_separate_col: true,
        parentheses_are_negative: true,
        running_balance_in_table: true,
        tax_codes_to_notes: true,
        islamic_banking_tags: false,
        ignore_repeated_headers: true,
      },
    },
    {
      bank_id: 'scb',
      bank_name: 'Standard Chartered Bank',
      currency: 'PKR',
      date_convention: 'DD/MM/YYYY',
      keywords: ['standard chartered', 'scb', 'standard chartered bank'],
      account_number_regex: 'Account\\s*Number\\s*[:.\\-]?\\s*([0-9\\-]{10,24})',
      statement_period_regex: '(?:Statement\\s+Period|From)\\s*[:.\\-]?\\s*([0-9A-Za-z\\-/]+)\\s*(?:to|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: 'Opening\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: 'Closing\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: {
        has_dual_dates: true,
        has_dr_cr_indicator: false,
        cheque_in_separate_col: false,
        parentheses_are_negative: true,
        running_balance_in_table: true,
        tax_codes_to_notes: true,
        islamic_banking_tags: false,
        ignore_repeated_headers: true,
      },
    },
    {
      bank_id: 'generic',
      bank_name: 'Generic Universal Fallback',
      currency: 'PKR',
      date_convention: 'DD/MM/YYYY',
      keywords: [],
      account_number_regex: '(?:Account|IBAN|Acc)\\s*(?:No|#)?\\s*[:.\\-]?\\s*([A-Za-z0-9\\-]{8,30})',
      statement_period_regex: '(?:Period|Statement\\s+Period)\\s*[:.\\-]?\\s*(?:From\\s+)?([0-9A-Za-z\\-/]+)\\s*(?:to|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: '(?:Opening\\s+Balance|Balance\\s+B/F)\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: '(?:Closing\\s+Balance|Ending\\s+Balance)\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: {
        has_dual_dates: false,
        has_dr_cr_indicator: false,
        cheque_in_separate_col: false,
        parentheses_are_negative: true,
        running_balance_in_table: true,
        tax_codes_to_notes: true,
        islamic_banking_tags: false,
        ignore_repeated_headers: true,
      },
    },
  ]);

  // Form state for creating a new bank profile
  const [newBankId, setNewBankId] = useState<string>('');
  const [newBankName, setNewBankName] = useState<string>('');
  const [newCurrency, setNewCurrency] = useState<string>('PKR');
  const [newDateConv, setNewDateConv] = useState<string>('DD/MM/YYYY');
  const [newKeywords, setNewKeywords] = useState<string>('');
  const [newQuirks, setNewQuirks] = useState<QuirkFlags>({
    has_dual_dates: false,
    has_dr_cr_indicator: false,
    cheque_in_separate_col: true,
    parentheses_are_negative: true,
    running_balance_in_table: true,
    tax_codes_to_notes: true,
    islamic_banking_tags: false,
    ignore_repeated_headers: true,
  });

  const activeProfile = profiles.find((p) => p.bank_id === selectedProfileId) || profiles[0];

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankId.trim() || !newBankName.trim()) return;

    const created: BankProfileConfig = {
      bank_id: newBankId.toLowerCase().replace(/\s+/g, '_'),
      bank_name: newBankName.trim(),
      currency: newCurrency.trim().toUpperCase() || 'PKR',
      date_convention: newDateConv,
      keywords: newKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      account_number_regex: '(?:Account|IBAN)\\s*(?:No|#)?\\s*[:.\\-]?\\s*([A-Za-z0-9\\-]{8,30})',
      statement_period_regex: '(?:Period|From)\\s*[:.\\-]?\\s*([0-9A-Za-z\\-/]+)\\s*(?:to|-)\\s*([0-9A-Za-z\\-/]+)',
      opening_balance_regex: 'Opening\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      closing_balance_regex: 'Closing\\s+Balance\\s*[:.\\-]?\\s*([0-9,.]+)',
      quirks: newQuirks,
    };

    setProfiles((prev) => [...prev, created]);
    setSelectedProfileId(created.bank_id);
    setIsCreatingNew(false);

    if (onApplyCustomConfig) {
      onApplyCustomConfig(created);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(activeProfile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeProfile.bank_id}_config.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeProfile, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 tracking-tight">
                Bank Format Adapters & Layout Quirk Configurations
              </h2>
              <p className="text-xs text-neutral-500">
                Declarative profile architecture supporting HBL, Meezan, Bank Alfalah, Standard Chartered, MCB, and custom formats.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatingNew((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{isCreatingNew ? 'Close Creator' : 'Add Custom Bank Profile'}</span>
          </button>
        </div>
      </div>

      {/* New Bank Profile Creator Form */}
      {isCreatingNew && (
        <div className="bg-neutral-50 border border-neutral-300 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-neutral-900">
                New Bank Layout Profile Specification
              </h3>
            </div>
            <span className="text-[11px] text-neutral-500">
              Generates a verified <code className="font-mono text-neutral-700">BankLayoutConfig</code>
            </span>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  Bank Identifier (ID)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. faysal_bank"
                  value={newBankId}
                  onChange={(e) => setNewBankId(e.target.value)}
                  className="w-full font-mono text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  Bank Official Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faysal Bank Limited"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  Primary Currency
                </label>
                <input
                  type="text"
                  placeholder="PKR, USD, EUR..."
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">
                  Date Convention
                </label>
                <select
                  value={newDateConv}
                  onChange={(e) => setNewDateConv(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK / Pakistan standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US convention)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 font-medium mb-1">
                Detection Keywords (Comma separated)
              </label>
              <input
                type="text"
                placeholder="faysal bank, fbl, barkat islamic"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Layout Quirks Checkboxes */}
            <div>
              <span className="block text-neutral-700 font-semibold mb-2">
                Layout Quirks & Specific Handlers:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuirks.has_dual_dates}
                    onChange={(e) => setNewQuirks({ ...newQuirks, has_dual_dates: e.target.checked })}
                    className="rounded text-neutral-900"
                  />
                  <span>Dual Dates (Post & Value Date)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuirks.cheque_in_separate_col}
                    onChange={(e) => setNewQuirks({ ...newQuirks, cheque_in_separate_col: e.target.checked })}
                    className="rounded text-neutral-900"
                  />
                  <span>Cheque in Separate Column</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuirks.has_dr_cr_indicator}
                    onChange={(e) => setNewQuirks({ ...newQuirks, has_dr_cr_indicator: e.target.checked })}
                    className="rounded text-neutral-900"
                  />
                  <span>DR / CR Suffix on Balance</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQuirks.islamic_banking_tags}
                    onChange={(e) => setNewQuirks({ ...newQuirks, islamic_banking_tags: e.target.checked })}
                    className="rounded text-neutral-900"
                  />
                  <span>Islamic Banking Profit / Tax Tags</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
              >
                Register Bank Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Split Explorer: Profile List on Left, Active Profile Details & Quirks on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left 4 Cols: Bank Profiles Selector */}
        <div className="md:col-span-4 bg-white rounded-xl shadow-xs border border-neutral-200 p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block px-3 py-1 tracking-wider">
            Registered Bank Formats ({profiles.length})
          </span>
          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.bank_id;
            return (
              <button
                key={p.bank_id}
                onClick={() => setSelectedProfileId(p.bank_id)}
                className={`w-full text-left p-3 rounded-lg text-xs transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-xs font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div>
                  <div className="font-semibold">{p.bank_name}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    ID: {p.bank_id} • {p.currency} • {p.date_convention}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-neutral-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right 8 Cols: Profile Quirks and Rules Inspector */}
        <div className="md:col-span-8 bg-white rounded-xl shadow-xs border border-neutral-200 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-neutral-900">
                  {activeProfile.bank_name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                  Active Profile
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Bank Code: <strong className="text-neutral-800">{activeProfile.bank_id}</strong> • Currency: {activeProfile.currency}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileJson className="w-3.5 h-3.5 text-neutral-500" />}
                <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500" />
                <span>Export Profile</span>
              </button>
            </div>
          </div>

          {/* Quirks Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider mb-2">
              Enabled Layout Quirks & Processing Rules:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">
                  Dual Date Disambiguation
                </span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  {activeProfile.quirks.has_dual_dates
                    ? 'Active: Disambiguates adjacent Post Date and Value Date columns; stores Value Date in notes.'
                    : 'Disabled: Single standard transaction date column.'}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">
                  Cheque & Instrument Separation
                </span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  {activeProfile.quirks.cheque_in_separate_col
                    ? 'Active: Isolates cheque/instrument numbers into the audit notes column.'
                    : 'Standard: Cheque numbers detected in narration lines.'}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">
                  DR / CR Balance Suffix
                </span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  {activeProfile.quirks.has_dr_cr_indicator
                    ? 'Active: Normalizes balances marked with "CR" (positive) or "DR" (overdraft/negative).'
                    : 'Disabled: Balances are signed numeric decimals.'}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 block mb-1">
                  Islamic Banking Specific Tags
                </span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  {activeProfile.quirks.islamic_banking_tags
                    ? 'Active: Parses Mudarabah profit sharing, Halal profit credited, and withholding tax (236P).'
                    : 'Standard: Conventional transaction labeling.'}
                </p>
              </div>
            </div>
          </div>

          {/* Regex & Matching Metadata */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-neutral-500 tracking-wider mb-2">
              Header Matching & Extraction Signatures:
            </h4>
            <div className="bg-neutral-900 text-neutral-200 p-3.5 rounded-lg font-mono text-xs space-y-1.5 border border-neutral-800 overflow-x-auto">
              <div>
                <span className="text-emerald-400"># Keywords: </span>
                <span>{activeProfile.keywords.length ? activeProfile.keywords.join(', ') : 'Universal Fallback'}</span>
              </div>
              <div>
                <span className="text-amber-400"># Account Regex: </span>
                <span className="text-neutral-300">{activeProfile.account_number_regex}</span>
              </div>
              <div>
                <span className="text-amber-400"># Period Regex: </span>
                <span className="text-neutral-300">{activeProfile.statement_period_regex}</span>
              </div>
              <div>
                <span className="text-amber-400"># Opening Balance Regex: </span>
                <span className="text-neutral-300">{activeProfile.opening_balance_regex}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
