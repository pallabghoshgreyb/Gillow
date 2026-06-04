import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Tag, ArrowRight, Heart, 
  Map as MapIcon, Grid, Zap, ShieldCheck, 
  Layers, BarChart3, Globe, Building2, Sparkles, Filter, ChevronRight, Lightbulb, Compass
} from 'lucide-react';
import { Patent, TechNode } from '../types';
import { api } from '../utils/api';
import PatentCard from '../components/PatentCard';
import { BubbleChart } from '../components/BubbleChart';

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

  const toggleFav = (id: string) => {
    setFavorites(api.toggleFavorite(id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 overflow-visible bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
          
          <div className="z-10 w-full max-w-[1200px] px-6 text-center">
               <h1 className="mb-8 text-5xl font-bold leading-[1.2] tracking-[-0.02em] text-slate-900 md:text-7xl">
                   Turn Patent Data into <span className="text-[#00bdcd]">Strategic Intelligence</span>
               </h1>
               <p className="mx-auto mb-12 max-w-2xl text-base font-medium leading-relaxed text-slate-600 md:text-lg">
                 Discover technology trends, analyze competitors, explore innovation landscapes, and uncover high-value patent opportunities through AI-powered patent intelligence.
               </p>
               
               {/* CTA Buttons */}
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                 <div className="relative inline-flex group">
                   <button 
                     disabled
                     className="group inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-400 px-8 py-3.5 text-base font-semibold text-white shadow-lg opacity-80"
                   >
                       Search Patents
                   </button>
                   <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 w-[220px] -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
                     Search is under construction and will be available soon.
                   </div>
                 </div>
                 <button 
                   onClick={() => navigate('/landscape')}
                   className="flex items-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-3 text-base font-semibold text-slate-900 bg-white shadow-sm transition-all hover:border-[#00bdcd] hover:bg-slate-50 active:scale-95"
                 >
                     Explore Landscapes
                 </button>
               </div>
          </div>
      </section>

      {/* Feature Cards Section */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Why Choose PatIndex</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Everything you need to understand, analyze, and leverage the global patent landscape</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-[#00bdcd] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <MapIcon size={28} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Explore Patent Landscapes</h3>
              <p className="text-slate-600 leading-relaxed">Visualize technology domains, innovation clusters, and competitive activity in one interactive view. Understand market dynamics at a glance.</p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-[#00bdcd] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                <Building2 size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Analyze Competitors</h3>
              <p className="text-slate-600 leading-relaxed">Compare assignees, patent portfolios, and market positioning across emerging technology areas. Benchmark against industry players.</p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-[#00bdcd] hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors">
                <TrendingUp size={28} className="text-amber-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">Evaluate Patent Value</h3>
              <p className="text-slate-600 leading-relaxed">Identify high-value patents using citation, legal, market, and technology signals. Make data-driven investment decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Chart Section */}
      <section className="bg-white border-b border-slate-200 py-20 md:py-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Interactive Visualization</div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Explore Technology Domains</h2>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">Discover relationships between technologies, assignees, and innovation clusters through interactive patent landscapes.</p>
            </div>
            <button 
              onClick={() => navigate('/browse')}
              className="group flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 whitespace-nowrap"
            >
                View All Patents <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Bubble Chart */}
          <div className="w-full h-[600px] md:h-[700px] rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">
            {!loading && (
              <BubbleChart 
                patents={patents}
                onSelectBubble={(bubble) => setSelectedBubble(bubble)}
                onSelectPatent={(patent) => navigate(`/patent/${patent.publicationNumber}`)}
              />
            )}
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-slate-400">Loading landscape...</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Patents Grid */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 md:py-28">
        <div className="max-w-[1400px] mx-auto px-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
              <div>
                <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Featured Portfolios</div>
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Notable Patents</h2>
              </div>
              <button 
                onClick={() => navigate('/browse')}
                className="group flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 whitespace-nowrap"
              >
                  Browse All Patents <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 md:py-28">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Patent Strategy?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Start exploring the global patent landscape with AI-powered intelligence today.</p>
          <button 
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#00bdcd] px-10 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:shadow-lg hover:bg-[#00a8b8] active:scale-95"
          >
              Start Searching <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
