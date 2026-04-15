import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    List, Map as MapIcon, SlidersHorizontal, 
    Save, LayoutGrid, Loader2,
    CheckCircle2, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { usePatentFilters } from '../hooks/usePatentFilters';
import FilterSidebar from '../components/FilterSidebar';
import PatentCard from '../components/PatentCard';
import PatentMap from '../components/PatentMap';
import SearchAutocomplete from '../components/SearchAutocomplete';
import SaveSearchModal from '../components/SaveSearchModal';
import { useGillow } from '../context/GillowContext';
import { PATENTS } from '../data/patents';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { filters, updateFilters, filteredPatents, loading, query, setQuery, resetFilters } = usePatentFilters();
  const { favorites, toggleFavorite, addSearchHistory } = useGillow();
  
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const quickDomainFilters = Array.from(new Set(PATENTS.map(patent => patent.domain).filter(Boolean))).sort().slice(0, 6);
  const activeFilterCount =
    filters.assignees.length +
    filters.categories.length +
    filters.subCategories.length +
    filters.statuses.length +
    filters.patentTypes.length;

  useEffect(() => {
    if (query) addSearchHistory(query);
  }, [query, addSearchHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters, view, pageSize]);

  const onSaveSearch = (name: string) => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const goToPatentPage = (publicationNumber: string) => {
    setSidebarOpen(false);
    setIsSaveModalOpen(false);
    setShowSavedToast(false);
    const baseUrl = window.location.href.split('#')[0];
    window.location.assign(`${baseUrl}#/patent/${publicationNumber}`);
  };

  const removeFilterValue = (field: keyof typeof filters, value: string) => {
    const current = filters[field];
    if (!Array.isArray(current)) return;
    updateFilters({ [field]: current.filter((item) => item !== value) } as any);
  };

  const totalPages = Math.max(1, Math.ceil(filteredPatents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedPatents = filteredPatents.slice(startIndex, startIndex + pageSize);
  const startResult = filteredPatents.length === 0 ? 0 : startIndex + 1;
  const endResult = Math.min(startIndex + pageSize, filteredPatents.length);

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'ellipsis-start', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis-end', totalPages];
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] bg-white font-sans">
      
      {/* Search & Action Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 z-40 shadow-sm relative">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-[500px]">
                      <SearchAutocomplete 
                        onSearch={setQuery} 
                        className="scale-90 origin-left" 
                        placeholder="Search patents, assignees, domains, or subdomains..."
                      />
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1.5 border border-slate-200">
                          <button 
                            onClick={() => setView('grid')}
                            className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-md text-[#00bdcd]' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                              <LayoutGrid size={18} />
                          </button>
                          <button 
                            onClick={() => setView('list')}
                            className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-md text-[#00bdcd]' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                              <List size={18} />
                          </button>
                          <button 
                            onClick={() => setView('map')}
                            className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-white shadow-md text-[#00bdcd]' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                              <MapIcon size={18} />
                          </button>
                      </div>

                      <div className="h-8 w-px bg-slate-200 hidden md:block" />

                      <select 
                        value={filters.sortBy}
                        onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#00bdcd] cursor-pointer shadow-sm"
                      >
                          <option value="relevance">Relevance</option>
                          <option value="newest">Newest Listed</option>
                          <option value="citations">Citation Count</option>
                      </select>

                      <button 
                        className="md:hidden p-2 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50"
                        onClick={() => setSidebarOpen(true)}
                      >
                          <SlidersHorizontal size={20} />
                      </button>
                  </div>
              </div>

              {/* Filtering Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mr-2">
                    <Filter size={12} /> Technology Domains
                  </div>
                  {quickDomainFilters.map(domain => {
                      const isActive = filters.categories.includes(domain);
                      return (
                          <button 
                            key={domain}
                            onClick={() => updateFilters({ categories: isActive ? [] : [domain] })}
                            className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all shadow-sm ${isActive ? 'bg-[#00bdcd] border-[#00bdcd] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#00bdcd]'}`}
                          >
                              {domain}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>

      <div className="flex-1 flex relative">
        {sidebarOpen && <div className="md:hidden fixed inset-0 bg-slate-900/40 z-[60] backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

        <div className={`
          absolute md:relative inset-y-0 left-0 z-[70] md:z-30 transition-transform duration-300 ease-in-out transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-80 flex-shrink-0 h-full bg-white
        `}>
          <FilterSidebar 
            onFilterChange={updateFilters} 
            onReset={resetFilters} 
            activeFilters={filters}
          />
        </div>

        <div className="flex-1 bg-slate-50/50 relative">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                           {query ? `Search: "${query}"` : filters.assignees[0] ? `${filters.assignees[0]} Portfolio View` : 'Marketplace Hub'}
                        </h2>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Found {filteredPatents.length} patent{filteredPatents.length === 1 ? '' : 's'}
                        </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                        {view !== 'map' && filteredPatents.length > 0 && (
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patents Per Page</span>
                                <select
                                  value={pageSize}
                                  onChange={(e) => setPageSize(Number(e.target.value))}
                                  className="bg-transparent text-sm font-black text-slate-700 outline-none"
                                >
                                  {[10, 20, 50, 100].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </select>
                            </div>
                        )}
                        <button 
                            onClick={() => setIsSaveModalOpen(true)}
                            className="flex items-center justify-center gap-2 text-xs font-black text-[#00bdcd] hover:bg-blue-50 px-5 py-3 rounded-xl transition-all bg-white border border-blue-100 shadow-sm"
                        >
                            <Save size={16} /> Save this search
                        </button>
                    </div>
                </div>

                {activeFilterCount > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        {filters.assignees.map((assignee) => (
                            <button
                                key={`assignee-${assignee}`}
                                onClick={() => removeFilterValue('assignees', assignee)}
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                            >
                                Assignee: {assignee} x
                            </button>
                        ))}
                        {filters.categories.map((category) => (
                            <button
                                key={`category-${category}`}
                                onClick={() => removeFilterValue('categories', category)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                                Domain: {category} x
                            </button>
                        ))}
                        {filters.subCategories.map((subCategory) => (
                            <button
                                key={`sub-${subCategory}`}
                                onClick={() => removeFilterValue('subCategories', subCategory)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                                Subdomain: {subCategory} x
                            </button>
                        ))}
                        {filters.statuses.map((status) => (
                            <button
                                key={`status-${status}`}
                                onClick={() => removeFilterValue('statuses', status)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                                Status: {status} x
                            </button>
                        ))}
                        {filters.patentTypes.map((type) => (
                            <button
                                key={`type-${type}`}
                                onClick={() => removeFilterValue('patentTypes', type)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                            >
                                Type: {type} x
                            </button>
                        ))}
                        <button
                            onClick={resetFilters}
                            className="rounded-full px-3 py-1.5 text-xs font-black text-slate-500 hover:text-slate-900"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[420px] bg-white rounded-3xl border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : view === 'map' ? (
                    <div className="h-[75vh] rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl bg-white animate-in zoom-in-95 duration-700">
                        <PatentMap 
                            patents={filteredPatents} 
                            onSelectPatent={(p) => {
                              goToPatentPage(p.publicationNumber);
                            }} 
                        />
                    </div>
                ) : filteredPatents.length > 0 ? (
                    <>
                    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-bold text-slate-600">
                            Showing <span className="text-slate-900">{startResult}-{endResult}</span> of <span className="text-slate-900">{filteredPatents.length}</span> patents
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Page {safeCurrentPage} of {totalPages}
                        </div>
                    </div>
                    <div className={`grid gap-8 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                        {paginatedPatents.map(patent => (
                            <div key={patent.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PatentCard 
                                    patent={patent} 
                                    layout={view === 'list' ? 'list' : 'grid'}
                                    onClick={(id) => goToPatentPage(id)}
                                    isFavorite={favorites.includes(patent.id)}
                                    onToggleFavorite={() => toggleFavorite(patent.id)}
                                />
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-10 flex flex-col items-center gap-4">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button
                                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                  disabled={safeCurrentPage === 1}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition-all hover:border-[#00bdcd] hover:text-[#00bdcd] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <ChevronLeft size={16} />
                                  Prev
                                </button>
                                {getVisiblePages().map((page, index) => (
                                  typeof page === 'number' ? (
                                    <button
                                      key={page}
                                      onClick={() => setCurrentPage(page)}
                                      className={`min-w-10 rounded-xl px-3 py-2 text-sm font-black shadow-sm transition-all ${page === safeCurrentPage ? 'bg-[#00bdcd] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-[#00bdcd] hover:text-[#00bdcd]'}`}
                                    >
                                      {page}
                                    </button>
                                  ) : (
                                    <span key={`${page}-${index}`} className="px-2 text-sm font-black text-slate-300">
                                      ...
                                    </span>
                                  )
                                ))}
                                <button
                                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                  disabled={safeCurrentPage === totalPages}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm transition-all hover:border-[#00bdcd] hover:text-[#00bdcd] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Next
                                  <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-24 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm mt-10">
                        <h3 className="text-3xl font-black text-slate-900 mb-4">No patents found</h3>
                        <button 
                            onClick={resetFilters}
                            className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <SaveSearchModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onSave={onSaveSearch}
        currentFiltersCount={activeFilterCount}
      />

      {showSavedToast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 backdrop-blur-md">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                  <span className="font-bold">Patent parameters archived</span>
                  <div className="w-px h-6 bg-slate-700 mx-2" />
                  <button onClick={() => setShowSavedToast(false)} className="text-xs text-slate-400 hover:text-white uppercase font-black tracking-widest">Dismiss</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Search;
