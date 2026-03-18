import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Filter, ChevronDown, Download, Building2, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { Patent, TechLevel, TechNode } from '../types';

const TechDetail: React.FC = () => {
  const { techId } = useParams();
  const navigate = useNavigate();
  const [techInfo, setTechInfo] = useState<TechNode | null>(null);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!techId) return;
      try {
        setLoading(true);
        // Parallel fetch for info and patents
        const [info, patentList] = await Promise.all([
            api.getTechnology(techId),
            api.getPatents(techId)
        ]);
        setTechInfo(info || null);
        setPatents(patentList);
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [techId]);

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
             <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
    );
  }

  if (!techInfo) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
             <h2 className="text-xl font-bold text-slate-800">Technology Not Found</h2>
             <button onClick={() => navigate('/')} className="text-blue-600 hover:underline flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Landscape
             </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Breadcrumb / Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-6 md:px-12 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Landscape</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">{techInfo.name}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{techInfo.name} Landscape</h1>
                <p className="text-slate-500 max-w-2xl">
                    Deep dive into patent filings, assignee trends, and technological breakthroughs in the {techInfo.level === TechLevel.DOMAIN ? `${techInfo.name} domain` : `${techInfo.name} subdomain within ${techInfo.domain}`}.
                </p>
            </div>
            <div className="flex gap-3">
                <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-slate-300 shadow-sm">
                    <Download size={16} /> Export Report
                </button>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Patent List */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 sticky top-4 z-10 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mr-2">
                    <Filter size={18} />
                    <span className="text-sm font-semibold">Filters:</span>
                </div>
                <FilterPill label="Assignee" />
                <FilterPill label="Year: 2020-2024" />
                <FilterPill label="Jurisdiction: US, EP" />
                <FilterPill label="Status: Active" active />
            </div>

            {/* List */}
            <div className="space-y-4">
                {patents.length > 0 ? (
                    patents.map((patent) => (
                        <PatentCard key={patent.id} patent={patent} onClick={() => navigate(`/patent/${patent.id}`)} />
                    ))
                ) : (
                    <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
                        No patents found for this technology.
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Sticky Insights */}
        <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
                
                {/* Insight Card 1 */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Market Velocity</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-blue-600">High</span>
                        <span className="text-sm text-slate-500 mb-1">Activity Level</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Filings have increased by <span className="text-emerald-600 font-bold">{techInfo.growth}%</span> in the last 12 months, outpacing the global average for tech sectors.
                    </p>
                </div>

                 {/* Insight Card 2: Top Assignees */}
                 <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Key Players</h3>
                    <ul className="space-y-4">
                        <PlayerRow rank={1} name={techInfo.topAssignee} count={techInfo.patentCount} />
                        <PlayerRow rank={2} name="Competitor A" count={Math.floor(techInfo.patentCount * 0.8)} />
                        <PlayerRow rank={3} name="Competitor B" count={Math.floor(techInfo.patentCount * 0.6)} />
                        <PlayerRow rank={4} name="Competitor C" count={Math.floor(techInfo.patentCount * 0.45)} />
                    </ul>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

const FilterPill = ({ label, active }: { label: string; active?: boolean }) => (
    <button className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${active ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
        {label}
        <ChevronDown size={12} />
    </button>
);

const PatentCard: React.FC<{ patent: Patent; onClick: () => void }> = ({ patent, onClick }) => (
    <div onClick={onClick} className="bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{patent.id}</span>
            <span className="text-xs text-slate-400">{patent.publicationDate}</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{patent.title}</h3>
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">{patent.abstract}</p>
        
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-700 font-medium">{patent.assignee.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                <span>{patent.jurisdiction}</span>
            </div>
             <div className="flex items-center gap-1.5 ml-auto">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">Active</span>
            </div>
        </div>
    </div>
);

const PlayerRow = ({ rank, name, count }: { rank: number; name: string; count: number }) => (
    <li className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100 rounded-full border border-slate-200">{rank}</span>
            <span className="text-sm text-slate-700">{name}</span>
        </div>
        <span className="text-sm font-mono text-slate-500">{count.toLocaleString()}</span>
    </li>
);

export default TechDetail;
