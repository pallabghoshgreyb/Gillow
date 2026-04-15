import React, { useState, useEffect } from 'react';
import { useGillow } from '../context/GillowContext';
import { api } from '../utils/api';
import { Patent } from '../types';
import PatentCard from '../components/PatentCard';
import { FolderHeart, Share2, Trash2, ArrowRight, GitCompare, ChevronRight, LayoutGrid, CheckSquare, Square, X, Heart, ListFilter } from 'lucide-react';
import ComparisonTable from '../components/ComparisonTable';
import { exportPatentsToCsv } from '../utils/exportUtils';

const Saved: React.FC = () => {
  const { favorites, toggleFavorite, comparisonList, addToComparison, removeFromComparison, clearComparison } = useGillow();
  const [savedPatents, setSavedPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await api.getPatents();
      setSavedPatents(all.filter(p => favorites.includes(p.id)));
      setLoading(false);
    };
    load();
  }, [favorites]);

  const handleToggleComparison = (id: string) => {
    if (comparisonList.includes(id)) {
      removeFromComparison(id);
    } else {
      addToComparison(id);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    toggleFavorite(id);
    removeFromComparison(id);
  };

  const comparisonPatents = savedPatents.filter((patent) => comparisonList.includes(patent.id));

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Syncing Collection...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <div className="bg-white border-b border-slate-200 pt-10 pb-6 px-6 md:px-12">
          <div className="max-w-[1400px] mx-auto">
              <nav className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  <span>Dashboard</span>
                  <ChevronRight size={14} />
                  <span className="text-slate-900">Saved Patents</span>
              </nav>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                      <h1 className="flex items-center gap-4 text-4xl font-semibold text-slate-900">
                          <FolderHeart size={40} className="text-red-500" /> My Portfolio
                      </h1>
                      <p className="mt-2 text-base leading-7 text-slate-500">Manage and benchmark your tracked intellectual property patents.</p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button
                          onClick={() => exportPatentsToCsv(savedPatents, 'saved-patents.csv')}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50"
                      >
                          <Share2 size={18} /> Export List
                      </button>
                      <button 
                        onClick={() => setSelectionMode(!selectionMode)}
                        className={`flex items-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-semibold shadow-sm transition-all ${selectionMode ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                      >
                          <GitCompare size={18} /> {selectionMode ? 'Finish Selection' : 'Compare Patents'}
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
          {savedPatents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {savedPatents.map(patent => (
                      <div key={patent.id} className="relative group">
                          {selectionMode && (
                              <button 
                                onClick={() => handleToggleComparison(patent.id)}
                                className={`absolute top-4 left-4 z-20 p-2 rounded-lg border-2 transition-all ${comparisonList.includes(patent.id) ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-110' : 'bg-white/90 backdrop-blur-md border-white/50 text-slate-400 hover:text-blue-500 hover:border-blue-500'}`}
                              >
                                  {comparisonList.includes(patent.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                              </button>
                          )}
                          <PatentCard 
                            patent={patent} 
                            href={!selectionMode ? `/patent/${patent.publicationNumber}` : undefined}
                            isFavorite={true}
                            onToggleFavorite={() => handleRemoveFavorite(patent.id)}
                          />
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                      <Heart size={40} />
                  </div>
                  <h3 className="mb-2 text-2xl font-semibold text-slate-800">Portfolio Empty</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                      Discover high-value patents in the marketplace and save them to your tracker.
                  </p>
                  <button 
                      onClick={() => window.location.hash = '#/browse'}
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
                  >
                      Explore Marketplace <ArrowRight size={18} />
                  </button>
              </div>
          )}
      </div>

      {/* Floating Global Comparison Bar */}
      {comparisonList.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-20 duration-500 w-full max-w-2xl px-6">
              <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between gap-6 border border-slate-700 backdrop-blur-md bg-opacity-95">
                  <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold shadow-lg">{comparisonList.length}</div>
                      <div>
                          <div className="text-xs font-medium uppercase tracking-[0.16em] text-blue-400">Benchmarking</div>
                          <div className="text-sm font-semibold">Patents in comparison queue</div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setShowComparison(true)}
                        className="flex items-center gap-2 rounded-xl bg-[#00bdcd] px-6 py-2.5 text-sm font-semibold transition-all hover:bg-blue-700"
                      >
                          Compare <ChevronRight size={16} />
                      </button>
                      <button onClick={clearComparison} className="p-2 text-slate-400 hover:text-white transition-colors">
                          <Trash2 size={20} />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showComparison && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                             <GitCompare size={24} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Patent Benchmarking</h3>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Side-by-side technical & market analysis</p>
                          </div>
                      </div>
                      <button onClick={() => setShowComparison(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                        <X size={24} />
                      </button>
                  </div>
                  <div className="flex-1 overflow-auto p-10 bg-slate-50/20">
                      <ComparisonTable patentIds={comparisonList} />
                  </div>
                  <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-white">
                      <button
                        onClick={() => exportPatentsToCsv(comparisonPatents, 'comparison-report.csv')}
                        className="rounded-xl px-8 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
                      >
                        Download CSV Report
                      </button>
                      <button 
                        onClick={() => setShowComparison(false)}
                        className="rounded-xl bg-slate-900 px-10 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
                      >
                        Dismiss
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Saved;
