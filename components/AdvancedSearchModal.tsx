import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Calendar, Zap, FileText, Filter, Layers, Target } from 'lucide-react';
import { PATENTS } from '../data/patents';

export type AdvancedSearchField = 'title' | 'abstract' | 'inventor' | 'assignee' | 'domain' | 'subdomain';

export interface AdvancedSearchFormData {
  booleanMode: 'AND' | 'OR';
  searchIn: AdvancedSearchField[];
  minValuation: number;
  minCitations: number;
  minClaims: number;
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
    booleanMode: 'AND',
    searchIn: ['title', 'abstract', 'inventor', 'assignee', 'domain', 'subdomain'],
    minValuation: 0,
    minCitations: 0,
    minClaims: 0,
    excludeExpired: true,
    jurisdiction: 'All'
};

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onSearch, initialValues }) => {
  const [formData, setFormData] = useState<AdvancedSearchFormData>(initialValues || DEFAULT_FORM_DATA);
  const jurisdictions = useMemo(() => (
    ['All', ...Array.from(new Set(PATENTS.map((patent) => patent.jurisdiction).filter(Boolean))).sort()]
  ), []);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Advanced Technical Search</h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Refined IP Discovery Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Boolean Logic */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <Target size={14} /> Search Logic
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setFormData({...formData, booleanMode: 'AND'})}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${formData.booleanMode === 'AND' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  ALL TERMS (AND)
                </button>
                <button 
                  onClick={() => setFormData({...formData, booleanMode: 'OR'})}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${formData.booleanMode === 'OR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                >
                  ANY TERM (OR)
                </button>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                <Search size={14} /> Search Within
              </label>
              <div className="flex flex-wrap gap-2">
                {(['title', 'abstract', 'inventor', 'assignee', 'domain', 'subdomain'] as AdvancedSearchField[]).map(field => (
                  <button 
                    key={field}
                    onClick={() => handleToggleIn(field)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-all ${formData.searchIn.includes(field) ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div className="space-y-6 md:col-span-2 pt-4 border-t border-slate-50">
               <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                 <Zap size={14} /> Technical Thresholds
               </label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <ThresholdInput 
                    label="Min Citations" 
                    value={formData.minCitations} 
                    onChange={v => setFormData({...formData, minCitations: v})} 
                    max={500} 
                 />
                 <ThresholdInput 
                    label="Min Claims" 
                    value={formData.minClaims} 
                    onChange={v => setFormData({...formData, minClaims: v})} 
                    max={50} 
                 />
                 <ThresholdInput 
                    label="Min Valuation ($M)" 
                    value={formData.minValuation} 
                    onChange={v => setFormData({...formData, minValuation: v})} 
                    max={100} 
                 />
               </div>
            </div>

            {/* Legal Filters */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
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

            <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Exclude Expired Patents</div>
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Show only enforceable patents</div>
                  </div>
                </div>
                <button 
                  onClick={() => setFormData({...formData, excludeExpired: !formData.excludeExpired})}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.excludeExpired ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.excludeExpired ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={() => setFormData(DEFAULT_FORM_DATA)}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
          >
            Clear All
          </button>
          <button 
            onClick={() => { onSearch(formData); onClose(); }}
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
