
import React from 'react';
import { Patent } from '../types';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, Network, Box, ChevronRight, Fingerprint } from 'lucide-react';
import { hasText } from '../utils/patentDisplay';

interface PortfolioPanelProps {
  patent: Patent;
  allPatents: Patent[];
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({ patent, allPatents }) => {
  const relatedPatentData = patent.relatedPatents
    .map(pubNum => allPatents.find(p => p.publicationNumber === pubNum))
    .filter(Boolean);
  const hasStrategy = hasText(patent.patentFamilyStrategy);
  const hasSegment = hasText(patent.portfolioSegment);
  const hasRelatedPatents = relatedPatentData.length > 0;

  if (!hasStrategy && !hasSegment && !hasRelatedPatents) return null;
  
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Network size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Portfolio & Asset Linkage</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {hasStrategy && <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 group hover:border-blue-300 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Family Strategy</div>
              <div className="font-black text-slate-900">{patent.patentFamilyStrategy}</div>
            </div>
          </div>
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            Technical protection strategy utilizing <strong>{patent.patentFamilyStrategy}</strong> filings to expand technical coverage.
          </p>
        </div>}

        {hasSegment && <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-100 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
              <Box size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portfolio Segment</div>
              <div className="font-black text-slate-900">{patent.portfolioSegment}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Asset categorized within the <strong>{patent.portfolioSegment}</strong> vertical of the assignee's IP landscape.
          </p>
        </div>}
      </div>
      
      {hasRelatedPatents && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Network size={14} className="text-blue-500" /> Technical Continuations
            </h4>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {relatedPatentData.length} Linked Assets
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {relatedPatentData.map((related, idx) => (
              <Link 
                key={idx} 
                to={`/patent/${related?.publicationNumber}`}
                className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex-shrink-0">
                    <Fingerprint size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{related?.publicationNumber}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">• {related?.patentType}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{related?.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-4">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Analyze</span>
                  <ChevronRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
