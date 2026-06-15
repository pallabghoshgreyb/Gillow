
import React from 'react';
import { Patent } from '../types';
import { Rocket, FlaskConical, Settings, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { hasItems, hasText, isKnownNumber } from '../utils/patentDisplay';

interface TRLPanelProps {
  patent: Patent;
}

export const TRLPanel: React.FC<TRLPanelProps> = ({ patent }) => {
  const trl = patent.technologyReadinessLevel;
  const hasTrl = isKnownNumber(trl);
  const hasApplications = hasItems(patent.commercialApplications);
  const hasDescription = hasText(patent.trlDescription);
  const applications = patent.commercialApplications.filter(Boolean);

  if (!hasTrl && !hasApplications && !hasDescription) return null;
  
  const trlColor = trl >= 7 ? 'bg-emerald-500' :
                   trl >= 4 ? 'bg-blue-500' : 'bg-amber-500';
  
  const trlBg = trl >= 7 ? 'bg-emerald-50' :
                trl >= 4 ? 'bg-blue-50' : 'bg-amber-50';

  const trlText = trl >= 7 ? 'text-emerald-700' :
                  trl >= 4 ? 'text-blue-700' : 'text-amber-700';

  const trlBorder = trl >= 7 ? 'border-emerald-200' :
                    trl >= 4 ? 'border-blue-200' : 'border-amber-200';

  const getPhase = (level: number) => {
    if (level <= 3) return { label: 'Research Phase', icon: <FlaskConical size={18} /> };
    if (level <= 6) return { label: 'Development Phase', icon: <Settings size={18} /> };
    return { label: 'Production Phase', icon: <Rocket size={18} /> };
  };

  const phase = getPhase(trl);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Rocket size={120} />
      </div>

      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Technology Readiness (TRL)</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${trlBg} ${trlText} ${trlBorder}`}>
          {phase.icon}
          {phase.label}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-10">
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-xl mb-4 ${trlColor}`}>
              {trl}
           </div>
           <div className="text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TRL Maturity Level</div>
              <div className="text-sm font-bold text-slate-800">{trl >= 9 ? 'Operational Proven' : 'In-Development'}</div>
           </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Maturity Pipeline</span>
                <span className={trlText}>{trl}/9 Level</span>
              </div>
              <div className="relative h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden">
                <div 
                  className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${trlColor}`}
                  style={{ width: `${(trl / 9) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tight opacity-60">
                <span>Basic Research</span>
                <span>Demo / Testing</span>
                <span>Market Deployment</span>
              </div>
           </div>

           {hasDescription && (
           <div className={`p-6 rounded-2xl border ${trlBg} ${trlBorder}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-white shadow-sm ${trlText}`}>
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Status Description</div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {patent.trlDescription}
                  </p>
                </div>
              </div>
           </div>
           )}
        </div>
      </div>

      {hasApplications && (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <ArrowRight size={14} className="text-blue-500" /> Market Applications
        </div>
        <div className="flex flex-wrap gap-3">
          {applications.map((app, idx) => (
            <div key={idx} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight cursor-default bg-blue-50/50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors">
               <ShieldCheck size={14} />
               {app}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
