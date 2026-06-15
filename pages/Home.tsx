import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Tag, ArrowRight, Heart, 
  Map as MapIcon, Grid, Zap, ShieldCheck, 
  Layers, BarChart3, Globe, Building2, Sparkles, Filter, ChevronRight, Lightbulb, Compass
} from 'lucide-react';
import { DomainDetail, Patent } from '../types';
import { api } from '../utils/api';
import PatentCard from '../components/PatentCard';

const Home: React.FC = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [patentData, domainData] = await Promise.all([
        api.getPatents(),
        api.getDomains()
      ]);
      setPatents(patentData);
      setDomains(domainData);
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

      {/* Domain Interlinking Section */}
      <section id="domains" className="bg-white py-20 md:py-28 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">
                Domain Intelligence
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Browse by Technology Domain
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                Open a domain view for solution areas, key players, contributors, activity trends, and related patent records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/landscape')}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-[#00bdcd] hover:bg-slate-50 active:scale-95"
            >
              View Landscape <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-72 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : domains.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {domains.map((domain) => {
                const topTechnologies = domain.technologies.slice(0, 4);
                const topCompany = domain.companies[0];

                return (
                  <Link
                    key={domain.slug}
                    to={`/domains/${domain.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#00bdcd] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00bdcd] focus-visible:ring-offset-2"
                    aria-label={`Open ${domain.name} domain detail page`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#00bdcd]">
                          <Compass size={13} />
                          Domain
                        </div>
                        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{domain.name}</h3>
                      </div>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-[#00bdcd]">
                        <ChevronRight size={20} />
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">{domain.description}</p>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-lg font-semibold tabular-nums text-slate-900">{domain.stats[0]?.value || '0'}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Patents</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-lg font-semibold tabular-nums text-slate-900">{domain.technologies.length}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Areas</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-lg font-semibold tabular-nums text-slate-900">{domain.companies.length}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Players</p>
                      </div>
                    </div>

                    {topTechnologies.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {topTechnologies.map((technology) => (
                          <span
                            key={technology.slug}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {technology.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="truncate">{topCompany?.name || 'No assignee data'}</span>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#00bdcd]">
                        Open domain <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No technology domains are available yet.
            </div>
          )}
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
