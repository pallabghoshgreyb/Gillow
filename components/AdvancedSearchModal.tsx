import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Calendar, Zap, Filter, Layers, Target } from 'lucide-react';
import { PATENTS } from '../data/patents';

export type AdvancedSearchField =
  | 'publicationNumber'
  | 'applicationNumber'
  | 'title'
  | 'abstract'
  | 'inventor'
  | 'assignee'
  | 'domain'
  | 'subdomain';

export interface AdvancedSearchFormData {
  query: string;
  booleanMode: 'AND' | 'OR';
  searchIn: AdvancedSearchField[];
  minValuation: number;
  minCitations: number;
  minClaims: number;
  minFamilySize: number;
  patentTypes: string[];
  assigneeTypes: string[];
  litigation: 'all' | 'include' | 'exclude';
  excludeExpired: boolean;
  jurisdiction: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: AdvancedSearchFormData) => void;
  initialValues?: AdvancedSearchFormData;
}

const DEFAULT_FORM_DATA: AdvancedSearchFormData = {
    query: '',
    booleanMode: 'AND',
    searchIn: ['publicationNumber', 'applicationNumber', 'title', 'abstract', 'inventor', 'assignee', 'domain', 'subdomain'],
    minValuation: 0,
    minCitations: 0,
    minClaims: 0,
    minFamilySize: 0,
    patentTypes: [],
    assigneeTypes: [],
    litigation: 'all',
    excludeExpired: true,
    jurisdiction: 'All'
};

const SEARCH_FIELD_OPTIONS: Array<{ field: AdvancedSearchField; label: string }> = [
  { field: 'publicationNumber', label: 'Pub No.' },
  { field: 'applicationNumber', label: 'App No.' },
  { field: 'title', label: 'Title' },
  { field: 'abstract', label: 'Abstract' },
  { field: 'inventor', label: 'Inventor' },
  { field: 'assignee', label: 'Assignee' },
  { field: 'domain', label: 'Domain' },
  { field: 'subdomain', label: 'Subdomain' },
];

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onSearch, initialValues }) => {
  const [formData, setFormData] = useState<AdvancedSearchFormData>(initialValues || DEFAULT_FORM_DATA);
  const jurisdictions = useMemo(() => (
    ['All', ...Array.from(new Set(PATENTS.map((patent) => patent.jurisdiction).filter(Boolean))).sort()]
  ), []);
  const patentTypes = useMemo(
    () => Array.from(new Set(PATENTS.map((patent) => patent.patentType).filter(Boolean))).sort(),
    []
  );
  const assigneeTypes = useMemo(
    () => Array.from(new Set(PATENTS.map((patent) => patent.assignee.type).filter(Boolean))).sort(),
    []
  );
  const familySizeMax = useMemo(() => {
    const maxFamilySize = PATENTS.reduce((max, patent) => Math.max(max, patent.familySize || 0), 0);
    return Math.max(10, Math.min(50, maxFamilySize));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialValues || DEFAULT_FORM_DATA);
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleToggleIn = (field: AdvancedSearchField) => {
    setFormData(prev => ({
      ...prev,
      searchIn: prev.searchIn.includes(field) 
        ? prev.searchIn.filter(f => f !== field)
        : [...prev.searchIn, field]
    }));
  };

  const handleToggleArrayValue = (key: 'patentTypes' | 'assigneeTypes', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[min(92vh,56rem)] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Advanced Filters</h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Refine patent results</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-100 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <Search size={14} /> Search Terms
              </label>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="Enter patent number or keyword"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <p className="text-xs text-slate-400">
                Use the header search bar for patent numbers only. This field supports broader search terms.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Target size={14} /> Search Logic
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setFormData({ ...formData, booleanMode: 'AND' })}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${formData.booleanMode === 'AND' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    ALL TERMS (AND)
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, booleanMode: 'OR' })}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${formData.booleanMode === 'OR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    ANY TERM (OR)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Search size={14} /> Search Within
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEARCH_FIELD_OPTIONS.map(({ field, label }) => (
                    <button
                      key={field}
                      onClick={() => handleToggleIn(field)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-all ${formData.searchIn.includes(field) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 border-t border-slate-50 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Zap size={14} /> Technical Thresholds
                </label>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <ThresholdInput
                    label="Min Citations"
                    value={formData.minCitations}
                    onChange={(v) => setFormData({ ...formData, minCitations: v })}
                    max={500}
                  />
                  <ThresholdInput
                    label="Min Claims"
                    value={formData.minClaims}
                    onChange={(v) => setFormData({ ...formData, minClaims: v })}
                    max={50}
                  />
                  <ThresholdInput
                    label="Min Valuation ($M)"
                    value={formData.minValuation}
                    onChange={(v) => setFormData({ ...formData, minValuation: v })}
                    max={100}
                  />
                  <ThresholdInput
                    label="Min Family Size"
                    value={formData.minFamilySize}
                    onChange={(v) => setFormData({ ...formData, minFamilySize: v })}
                    max={familySizeMax}
                  />
                </div>
              </div>

              <div className="space-y-5 border-t border-slate-50 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Filter size={14} /> Portfolio Filters
                </label>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">Patent Type</span>
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        {formData.patentTypes.length > 0 ? `${formData.patentTypes.length} selected` : 'Any'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patentTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => handleToggleArrayValue('patentTypes', type)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-all ${formData.patentTypes.includes(type) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700">Assignee Type</span>
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        {formData.assigneeTypes.length > 0 ? `${formData.assigneeTypes.length} selected` : 'Any'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assigneeTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => handleToggleArrayValue('assigneeTypes', type)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-all ${formData.assigneeTypes.includes(type) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Litigation Filter</label>
                    <div className="flex rounded-xl bg-slate-100 p-1">
                      {(['all', 'include', 'exclude'] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setFormData({ ...formData, litigation: value })}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${formData.litigation === value ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-50 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <Layers size={14} /> Jurisdiction
                </label>
                <select
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
                >
                  {jurisdictions.map((jurisdiction) => (
                    <option key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 border-t border-slate-50 pt-4 md:col-span-2">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">Exclude Expired Patents</div>
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Show only enforceable patents</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, excludeExpired: !formData.excludeExpired })}
                    className={`relative h-6 w-12 rounded-full transition-all ${formData.excludeExpired ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${formData.excludeExpired ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:p-8">
          <button
            onClick={() => setFormData(DEFAULT_FORM_DATA)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              onSearch(formData);
              onClose();
            }}
            disabled={formData.searchIn.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
          >
            Execute Search <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ThresholdInput = ({ label, value, onChange, max }: { label: string, value: number, onChange: (v: number) => void, max: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{value}{label.includes('$M') ? 'M+' : '+'}</span>
    </div>
    <input 
      type="range" 
      min="0" 
      max={max} 
      value={value} 
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

export default AdvancedSearchModal;
