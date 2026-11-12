import React, { useState } from 'react';
import { ChevronDown, Filter, RefreshCcw, Search } from 'lucide-react';
import { FilterState } from '../hooks/usePatentFilters';
import { useFacets } from '../hooks/useFacets';

interface FilterSidebarProps {
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  activeFilters: FilterState;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ onFilterChange, onReset, activeFilters }) => {
  const [expanded, setExpanded] = useState<string[]>(['assignee', 'tech', 'status', 'years']);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const { facets, loading } = useFacets();
  const assignees = facets?.assignees || [];
  const technologyDomains = facets?.domains || [];
  const subdomainCounts = new Map<string, number>();
  technologyDomains.forEach(({ subdomains }) => subdomains.forEach(({ subdomain, count }) => {
    subdomainCounts.set(subdomain, (subdomainCounts.get(subdomain) || 0) + count);
  }));
  const technologySubdomains = Array.from(subdomainCounts, ([subdomain, count]) => ({ subdomain, count }))
    .sort((a, b) => a.subdomain.localeCompare(b.subdomain));
  const legalStatuses = facets?.legalStatuses || [];
  const minYear = facets?.yearRange.min;
  const maxYear = facets?.yearRange.max;
  const publicationYears = minYear != null && maxYear != null
    ? Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)
    : [];
  
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

  const filteredAssignees = assignees.filter((assignee) =>
    assignee.name.toLowerCase().includes(assigneeQuery.trim().toLowerCase())
  );

  const handleReset = () => {
    setAssigneeQuery('');
    onReset();
  };

  return (
    <aside className="w-full bg-white flex flex-col border-r border-slate-200 h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Filter size={18} className="text-[#00bdcd]" /> Filters
        </h2>
        <div className="relative group">
          <button 
            onClick={handleReset}
            aria-label="Reset all filters"
            className="p-2 text-slate-400 hover:text-[#00bdcd] hover:bg-blue-50 rounded-lg transition-all"
          >
            <RefreshCcw size={16} />
          </button>
          <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-2xl group-hover:block group-focus-within:block">
            Reset all filters
          </span>
        </div>
      </div>

      <fieldset disabled={loading || !facets} aria-busy={loading} className="p-6 space-y-8 disabled:opacity-60">
        {(loading || !facets) && <p role="status" className="text-sm text-slate-400">{loading ? 'Loading filters…' : 'Filters unavailable.'}</p>}
        <FilterSection title="Assignee" isOpen={expanded.includes('assignee')} onToggle={() => toggleSection('assignee')}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={assigneeQuery}
                onChange={(e) => setAssigneeQuery(e.target.value)}
                placeholder="Search assignees"
                aria-label="Search assignees"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#00bdcd] focus:bg-white focus:ring-2 focus:ring-[#00bdcd]/10"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {filteredAssignees.length > 0 ? (
                filteredAssignees.map(({ name: assignee, count }) => (
                  <label key={assignee} className="flex items-center group cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={activeFilters.assignees.includes(assignee)}
                      onChange={() => handleMultiToggle('assignees', assignee)}
                      className="w-4 h-4 border-slate-300 rounded text-[#00bdcd] focus:ring-[#00bdcd]"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{assignee}</span>
                    <span className="ml-auto pl-2 text-xs text-slate-400">{count.toLocaleString()}</span>
                  </label>
                ))
              ) : (
                loading ? <LoadingOption /> : <p className="py-2 text-sm text-slate-400">No assignees found.</p>
              )}
            </div>
          </div>
        </FilterSection>

        {/* Technology Sector */}
        <FilterSection title="Technology Domain" isOpen={expanded.includes('tech')} onToggle={() => toggleSection('tech')}>
          <div className="space-y-2">
            {loading && <LoadingOption />}
            {technologyDomains.map(({ domain: cat, count }) => (
              <label key={cat} className="flex items-center group cursor-pointer py-0.5">
                <input 
                  type="checkbox" 
                  checked={activeFilters.categories.includes(cat)}
                  onChange={() => handleMultiToggle('categories', cat)}
                  className="w-4 h-4 border-slate-300 rounded text-[#00bdcd] focus:ring-[#00bdcd]" 
                />
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{cat}</span>
                <span className="ml-auto pl-2 text-xs text-slate-400">{count.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Level 2 Subdomain" isOpen={expanded.includes('subtech')} onToggle={() => toggleSection('subtech')}>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {loading && <LoadingOption />}
            {technologySubdomains.map(({ subdomain: sub, count }) => (
              <label key={sub} className="flex items-center group cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={activeFilters.subCategories.includes(sub)}
                  onChange={() => handleMultiToggle('subCategories', sub)}
                  className="w-4 h-4 border-slate-300 rounded text-[#00bdcd] focus:ring-[#00bdcd]"
                />
                <span className="ml-3 text-sm font-medium text-slate-600 group-hover:text-slate-900">{sub}</span>
                <span className="ml-auto pl-2 text-xs text-slate-400">{count.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Legal Status */}
        <FilterSection title="Legal Status" isOpen={expanded.includes('status')} onToggle={() => toggleSection('status')}>
          <div className="flex flex-wrap gap-2">
            {loading && <LoadingOption />}
            {legalStatuses.map(({ value: status, count }) => (
              <button 
                key={status}
                onClick={() => handleMultiToggle('statuses', status)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeFilters.statuses.includes(status) 
                    ? 'bg-[#00bdcd] border-[#00bdcd] text-white' 
                    : 'border-slate-200 text-slate-500 hover:border-[#00bdcd] hover:bg-blue-50'
                }`}
              >
                {status} {count != null && <span className="opacity-60">({count.toLocaleString()})</span>}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Filing Date Range */}
        <FilterSection title="Publication Year" isOpen={expanded.includes('years')} onToggle={() => toggleSection('years')}>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">From</label>
                <select 
                  value={activeFilters.publicationYearFrom}
                  onChange={(e) => onFilterChange({
                    publicationYearFrom: e.target.value,
                    publicationYearTo: e.target.value && activeFilters.publicationYearTo && Number(e.target.value) > Number(activeFilters.publicationYearTo) ? e.target.value : activeFilters.publicationYearTo,
                  })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                >
                   <option value="">{loading ? 'Loading…' : `Any${minYear != null ? ` (${minYear} onward)` : ''}`}</option>
                   {activeFilters.publicationYearFrom && !publicationYears.includes(Number(activeFilters.publicationYearFrom)) && <option value={activeFilters.publicationYearFrom}>{activeFilters.publicationYearFrom}</option>}
                   {publicationYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">To</label>
                <select 
                  value={activeFilters.publicationYearTo}
                  onChange={(e) => onFilterChange({
                    publicationYearTo: e.target.value,
                    publicationYearFrom: e.target.value && activeFilters.publicationYearFrom && Number(e.target.value) < Number(activeFilters.publicationYearFrom) ? e.target.value : activeFilters.publicationYearFrom,
                  })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                >
                   <option value="">{loading ? 'Loading…' : `Any${maxYear != null ? ` (through ${maxYear})` : ''}`}</option>
                   {activeFilters.publicationYearTo && !publicationYears.includes(Number(activeFilters.publicationYearTo)) && <option value={activeFilters.publicationYearTo}>{activeFilters.publicationYearTo}</option>}
                   {publicationYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
             </div>
          </div>
        </FilterSection>

        {/* Metrics Section */}
        <div className="pt-4 border-t border-slate-100">
           <FilterSection title="Metrics" isOpen={expanded.includes('more')} onToggle={() => toggleSection('more')}>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Asset Type</label>
                    <div className="flex flex-wrap gap-2">
                      {loading && <LoadingOption />}
                      {(facets?.patentTypes || []).map(({ value: t, count }) => (
                        <button 
                          key={t}
                          onClick={() => handleMultiToggle('patentTypes', t)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${
                            activeFilters.patentTypes.includes(t) 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          {t} {count != null && <span className="opacity-60">({count.toLocaleString()})</span>}
                        </button>
                      ))}
                    </div>
                 </div>

                 {(loading || (facets && (facets.citations.min != null || facets.citations.max != null))) && <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="flex justify-between text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                          Min Citations <span>{activeFilters.minCitations}+</span>
                       </label>
                       <input 
                         type="range" min="0" max={Math.max(activeFilters.minCitations, facets?.citations.max || 0)} step="1"
                         disabled={loading || facets?.citations.max == null}
                         value={activeFilters.minCitations}
                         onChange={(e) => onFilterChange({ minCitations: Number(e.target.value) })}
                         className="w-full accent-slate-800"
                       />
                    </div>
                 </div>}
              </div>
           </FilterSection>
        </div>
      </fieldset>
    </aside>
  );
};

const FilterSection: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }> = ({ title, children, isOpen, onToggle }) => (
  <div className="space-y-4">
    <button onClick={onToggle} className="flex w-full items-center justify-between text-left text-sm font-semibold tracking-tight text-slate-800">
      {title}
      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
    </button>
    {isOpen && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{children}</div>}
  </div>
);

const LoadingOption = () => (
  <label className="flex items-center gap-3 py-1 text-sm text-slate-400">
    <input type="checkbox" disabled /> Loading…
  </label>
);

export default FilterSidebar;
