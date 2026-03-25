import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Tag, ArrowRight, Heart, 
  Map as MapIcon, Grid, Zap, ShieldCheck, 
  Layers, BarChart3, Globe, Building2, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { Patent, TechNode } from '../types';
import { api } from '../utils/api';
import PatentCard from '../components/PatentCard';
import { BubbleChart } from '../components/BubbleChart';
import SearchAutocomplete from '../components/SearchAutocomplete';

const Home: React.FC = () => {
  const [nodes, setNodes] = useState<TechNode[]>([]);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBubble, setSelectedBubble] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [techData, patentData] = await Promise.all([
        api.getTechnologies(),
        api.getPatents()
      ]);
      setNodes(techData);
      setPatents(patentData);
      setFavorites(api.getFavorites());
      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const toggleFav = (id: string) => {
    setFavorites(api.toggleFavorite(id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      
      {/* Hero Section with 3D Landscape */}
      <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-20 overflow-hidden bg-slate-50 border-b border-slate-200">
          
          <div className="z-10 w-full max-w-[1400px] px-6 text-center mb-16 relative">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 text-[#00bdcd] text-[10px] font-black uppercase tracking-widest mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
                 <Sparkles size={14} fill="currentColor" /> Advanced 3D Technology Landscapes
               </div>
               <h1 className="text-6xl md:text-9xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
                   Navigate <span className="text-[#00bdcd]">Intelligence.</span>
               </h1>
               <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                 Ditch the spreadsheets. Explore the technical universe through high-density topographic maps and Gaussian clustering.
               </p>
               
               <SearchAutocomplete
                 onSearch={handleSearch}
                 className="max-w-2xl mx-auto z-30"
                 placeholder="Search subdomains or current assignees..."
               />
          </div>

          {/* 3D Landscape Map replaces the Sunburst */}
          <div className="w-full h-[850px] max-w-6xl px-6 relative z-20 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl bg-white">
            {!loading && (
              <BubbleChart 
                patents={patents}
                onSelectBubble={(bubble) => setSelectedBubble(bubble)}
                onSelectPatent={(patent) => navigate(`/patent/${patent.publicationNumber}`)}
              />
            )}
          </div>
      </section>

      {/* Featured Grid */}
      <main className="max-w-[1400px] mx-auto px-6 py-32 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-8">
            <div>
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Technical Portfolios</div>
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">Marketplace Highlights</h2>
            </div>
            <button 
              onClick={() => navigate('/browse')}
              className="group flex items-center gap-4 text-sm font-black text-white bg-slate-900 hover:bg-slate-800 px-10 py-5 rounded-2xl transition-all uppercase tracking-widest shadow-2xl active:scale-95"
            >
                Browse All Patents <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {patents.slice(0, 4).map((p) => (
                <PatentCard 
                  key={p.id} 
                  patent={p} 
                  href={`/patent/${p.publicationNumber}`}
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={() => toggleFav(p.id)}
                />
            ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
