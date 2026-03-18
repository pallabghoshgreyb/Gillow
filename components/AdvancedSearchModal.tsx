import React, { useState } from 'react';
import { X, Search, Calendar, Zap, FileText, Filter, Layers, Target } from 'lucide-react';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: any) => void;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [formData, setFormData] = useState({
    booleanMode: 'AND',
    searchIn: ['title', 'abstract', 'claims'],
    minValuation: 0,
    minCitations: 0,
    minClaims: 0,
    excludeExpired: true,
    jurisdiction: 'All'
  });

  if (!isOpen) return null;

  const handleToggleIn = (field: string) => {
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
              <h3 className="font-black text-slate-900 text-xl tracking-tight">Advanced Technical Search</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Refined IP Discovery Engine</p>
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
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
                <Target size={14} /> Search Logic
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setFormData({...formData, booleanMode: 'AND'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.booleanMode === 'AND' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  ALL TERMS (AND)
                </button>
                <button 
                  onClick={() => setFormData({...formData, booleanMode: 'OR'})}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${formData.booleanMode === 'OR' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  ANY TERM (OR)
                </button>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
                <Search size={14} /> Search Within
              </label>
              <div className="flex flex-wrap gap-2">
                {['title', 'abstract', 'claims', 'inventor', 'assignee'].map(field => (
                  <button 
                    key={field}
                    onClick={() => handleToggleIn(field)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${formData.searchIn.includes(field) ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div className="space-y-6 md:col-span-2 pt-4 border-t border-slate-50">
               <label className="text-xs font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
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
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">Exclude Expired Patents</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Show only enforceable patents</div>
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
            onClick={onClose}
            className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
          >
            Clear All
          </button>
          <button 
            onClick={() => { onSearch(formData); onClose(); }}
            className="flex-1 px-6 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95"
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
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{value}{label.includes('$M') ? 'M+' : '+'}</span>
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