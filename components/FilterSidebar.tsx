import React, { useState } from 'react';
import { ChevronDown, Filter, RefreshCcw } from 'lucide-react';
import { PATENT_TYPES } from '../constants';
import { FilterState } from '../hooks/usePatentFilters';
import { PATENTS } from '../data/patents';

interface FilterSidebarProps {
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  activeFilters: FilterState;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange, onReset, activeFilters }) => {
  const [expanded, setExpanded] = useState<string[]>(['assignee', 'tech', 'status', 'years']);
  const assignees = Array.from(new Set(PATENTS.map(patent => patent.assignee.name).filter(Boolean))).sort();
  const technologyDomains = Array.from(new Set(PATENTS.map(patent => patent.domain).filter(Boolean))).sort();
  const technologySubdomains = Array.from(new Set(PATENTS.map(patent => patent.subdomain).filter(Boolean))).sort();
  const legalStatuses = Array.from(new Set(PATENTS.map(patent => patent.legalStatus).filter(Boolean))).sort();
  const filingYears = Array.from(
    new Set(
      PATENTS
        .map((patent) => new Date(patent.filingDate).getFullYear())
        .filter((year) => !Number.isNaN(year))
    )
  ).sort((a, b) => b - a);
  
  const toggleSection = (section: string) => {
    setExpanded(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleMultiToggle = (field: keyof FilterState, value: string) => {
    const current = (activeFilters[field] as string[]) || [];
    const next = current.includes(value) 
      ? current.filter(v => v !== value) 
      : [...current, value];
    onFilterChange({ [field]: next });
  };

  return (
    <aside className="w-full bg-white flex flex-col border-r border-slate-200 h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Filter size={18} className="text-[#006AFF]" /> Filters
        </h2>
        <button 
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-[#006AFF] hover:bg-blue-50 rounded-lg transition-all"
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        <FilterSection title="Assignee" isOpen={expanded.includes('assignee')} onToggle={() => toggleSection('assignee')}>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {assignees.map((assignee) => (
              <label key={assignee} className="flex items-center group cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={activeFilters.assignees.includes(assignee)}
                  onChange={() => handleMultiToggle('assignees', assignee)}
                  className="w-4 h-4 border-slate-300 rounded text-[#006AFF] focus:ring-[#006AFF]"
                />
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{assignee}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Technology Sector */}
        <FilterSection title="Technology Domain" isOpen={expanded.includes('tech')} onToggle={() => toggleSection('tech')}>
          <div className="space-y-2">
            {technologyDomains.map(cat => (
              <label key={cat} className="flex items-center group cursor-pointer py-0.5">
                <input 
                  type="checkbox" 
                  checked={activeFilters.categories.includes(cat)}
                  onChange={() => handleMultiToggle('categories', cat)}
                  className="w-4 h-4 border-slate-300 rounded text-[#006AFF] focus:ring-[#006AFF]" 
                />
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{cat}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Level 2 Subdomain" isOpen={expanded.includes('subtech')} onToggle={() => toggleSection('subtech')}>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {technologySubdomains.map(sub => (
              <label key={sub} className="flex items-center group cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={activeFilters.subCategories.includes(sub)}
                  onChange={() => handleMultiToggle('subCategories', sub)}
                  className="w-4 h-4 border-slate-300 rounded text-[#006AFF] focus:ring-[#006AFF]"
                />
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{sub}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Legal Status */}
        <FilterSection title="Legal Status" isOpen={expanded.includes('status')} onToggle={() => toggleSection('status')}>
          <div className="flex flex-wrap gap-2">
            {legalStatuses.map(status => (
              <button 
                key={status}
                onClick={() => handleMultiToggle('statuses', status)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  activeFilters.statuses.includes(status) 
                    ? 'bg-[#006AFF] border-[#006AFF] text-white' 
                    : 'border-slate-200 text-slate-500 hover:border-[#006AFF] hover:bg-blue-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filing Date Range */}
        <FilterSection title="Filing Date" isOpen={expanded.includes('years')} onToggle={() => toggleSection('years')}>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
                <select 
                  value={activeFilters.startYear}
                  onChange={(e) => onFilterChange({ startYear: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                >
                   {filingYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
                <select 
                  value={activeFilters.endYear}
                  onChange={(e) => onFilterChange({ endYear: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                >
                   {filingYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>
          </div>
        </FilterSection>

        {/* Metrics Section */}
        <div className="pt-4 border-t border-slate-100">
           <FilterSection title="Metrics" isOpen={expanded.includes('more')} onToggle={() => toggleSection('more')}>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Asset Type</label>
                    <div className="flex flex-wrap gap-2">
                      {PATENT_TYPES.map(t => (
                        <button 
                          key={t}
                          onClick={() => handleMultiToggle('patentTypes', t)}
                          className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                            activeFilters.patentTypes.includes(t) 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase flex justify-between">
                          Min Citations <span>{activeFilters.minCitations}+</span>
                       </label>
                       <input 
                         type="range" min="0" max="100" step="1"
                         value={activeFilters.minCitations}
                         onChange={(e) => onFilterChange({ minCitations: Number(e.target.value) })}
                         className="w-full accent-slate-800"
                       />
                    </div>
                 </div>
              </div>
           </FilterSection>
        </div>
      </div>
    </aside>
  );
};

const FilterSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }> = ({ title, children, isOpen, onToggle }) => (
  <div className="space-y-4">
    <button onClick={onToggle} className="w-full flex items-center justify-between text-sm font-black text-slate-800 uppercase tracking-wider text-left">
      {title}
      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
    </button>
    {isOpen && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

export default FilterSidebar;
