import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag, ArrowRight, 
  Map as MapIcon, BarChart3, Globe, Sparkles, Lightbulb, SlidersHorizontal, Search as SearchIcon
} from 'lucide-react';
import { DomainDetail, Patent } from '../types';
import { api } from '../utils/api';
import PatentCard from '../components/PatentCard';

const LANDING_DOMAINS = [
  { name: 'Robotic Surgery', desc: 'Surgical robotics, imaging, and procedural automation.', slug: 'robotic-surgery' },
  { name: 'Electric Vehicles', desc: 'Battery systems, charging, and mobility platforms.', slug: 'electric-vehicles' },
  { name: 'Semiconductors', desc: 'Chip design, fabrication, and packaging innovations.', slug: 'semiconductors' },
  { name: 'Battery Technology', desc: 'Cell chemistry, storage systems, and thermal control.', slug: 'battery-technology' },
  { name: 'Drug Discovery', desc: 'Molecule screening, biologics, and R&D automation.', slug: 'drug-discovery' },
  { name: 'Quantum Computing', desc: 'Quantum hardware, algorithms, and error correction.', slug: 'quantum-computing' },
  { name: '5G Networks', desc: 'Wireless infrastructure, spectrum, and network slicing.', slug: '5g-networks' },
  { name: 'Space Technology', desc: 'Satellites, launch systems, and orbital operations.', slug: 'space-technology' },
];

const FEATURE_CARDS = [
  { title: 'Patent Search', desc: 'Find relevant patents faster with semantic and patent-number search.', icon: <Tag size={18} /> },
  { title: 'Landscape Analysis', desc: 'Explore technical clusters and discover emerging innovation zones.', icon: <MapIcon size={18} /> },
  { title: 'Competitor Tracking', desc: 'Monitor companies, assignees, and portfolio movement across domains.', icon: <Globe size={18} /> },
  { title: 'Portfolio Analytics', desc: 'Analyze strengths, white spaces, and filing momentum.', icon: <BarChart3 size={18} /> },
  { title: 'AI Insights', desc: 'Generate concise summaries and opportunity signals from patent data.', icon: <Lightbulb size={18} /> },
];

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
    <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

const Home: React.FC = () => {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [domains, setDomains] = useState<DomainDetail[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityNotice, setAvailabilityNotice] = useState<string | null>(null);
  const availabilityTimerRef = useRef<number | null>(null);
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

  useEffect(() => {
    return () => {
      if (availabilityTimerRef.current !== null) {
        window.clearTimeout(availabilityTimerRef.current);
      }
    };
  }, []);

  const showAvailableSoon = () => {
    if (availabilityTimerRef.current !== null) {
      window.clearTimeout(availabilityTimerRef.current);
    }
    setAvailabilityNotice('Available soon');
    availabilityTimerRef.current = window.setTimeout(() => {
      setAvailabilityNotice(null);
      availabilityTimerRef.current = null;
    }, 2200);
  };

  const handleDomainClick = (slug: string) => {
    if (slug === 'robotic-surgery') {
      navigate('/domains/robotic-surgery');
      return;
    }

    showAvailableSoon();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_center,rgba(0,189,205,0.10),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col gap-14 px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 md:text-7xl">
                Turn Patent Data into <span className="text-[#00bdcd]">Strategic Intelligence</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                Search millions of patents, discover emerging technologies, track competitors, and uncover innovation opportunities through AI-powered landscape analysis.
              </p>

              <div className="mt-8">
                <button
                  onClick={() => navigate('/browse')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95"
                >
                  Go to PatIndex <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => navigate('/landscape-preview')}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#00bdcd] hover:bg-slate-50"
                  >
                    <SearchIcon size={18} className="text-slate-400" />
                    <div className="text-sm text-slate-400">View full landscape</div>
                    <SlidersHorizontal size={16} className="ml-auto text-slate-400" />
                  </button>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniStat label="Live Domains" value="300+" />
                    <MiniStat label="Coverage" value="180+ Countries" />
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Landscape Preview</div>
                      <div className="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200">
                        <div className="grid grid-cols-3 gap-3">
                          {['A', 'B', 'C', 'D', 'E', 'F'].map((item, index) => (
                            <div
                              key={item}
                              className={`h-12 w-12 rounded-full border border-white/60 ${index % 2 === 0 ? 'bg-[#00bdcd]/70' : 'bg-emerald-400/65'} shadow-md`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 max-w-3xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Everything you need for patent intelligence</div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Features built for research, strategy, and execution</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <div key={feature.title} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#00bdcd] hover:shadow-lg">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#00bdcd]">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="domains" className="border-b border-slate-200 bg-slate-50 py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Browse by Technology Domain</div>
              <p className="text-lg text-slate-600">
                Open a domain view for solution areas, key players, contributors, activity trends, and related patent records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/landscape-preview')}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:border-[#00bdcd] hover:bg-slate-50 active:scale-95"
            >
              View full landscape <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {LANDING_DOMAINS.map((domain) => (
              <button
                key={domain.slug}
                type="button"
                onClick={() => handleDomainClick(domain.slug)}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#00bdcd] hover:shadow-lg"
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#00bdcd]">
                  Domain
                </div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{domain.name}</h3>
                  <ArrowRight size={18} className="mt-1 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#00bdcd]" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{domain.desc}</p>
                <div className="mt-auto pt-6 text-sm font-semibold text-[#00bdcd]">{domain.slug === 'robotic-surgery' ? 'Open Robotic Surgery' : 'Available soon'}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 max-w-3xl">
            <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">How PatentIndex works</div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">From search to strategy in four steps</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['1', 'Search patents', 'Find patents by number, company, keyword, or technology.'],
              ['2', 'Explore landscapes', 'Visualize technical clusters and innovation momentum.'],
              ['3', 'Analyze competitors', 'Compare companies, assignees, and portfolio depth.'],
              ['4', 'Export insights', 'Turn patent data into research-ready intelligence.'],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#00bdcd] shadow-sm">{step}</div>
                <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
              </div>
            ))}
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

      {availabilityNotice && (
        <div className="fixed bottom-6 right-6 z-[80] rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          {availabilityNotice}
        </div>
      )}
    </div>
  );
};

export default Home;
