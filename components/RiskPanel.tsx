
import React from 'react';
import { Patent } from '../types';
import { AlertCircle, ShieldAlert, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { hasItems, isKnownNumber } from '../utils/patentDisplay';

interface RiskPanelProps {
  patent: Patent;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ patent }) => {
  const score = patent.infringementRiskScore;
  const hasScore = isKnownNumber(score);
  const riskFactors = patent.riskFactors.filter(Boolean);
  const productCategories = patent.keyProductCategories.filter(Boolean);
  const hasRiskFactors = hasItems(patent.riskFactors);
  const hasProductCategories = hasItems(patent.keyProductCategories);

  if (!hasScore && !hasRiskFactors && !hasProductCategories) return null;
  
  const getRiskColor = (s: number) => {
    if (s >= 8) return '#ef4444'; // Red
    if (s >= 5) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const getRiskLabel = (s: number) => {
    if (s >= 8) return 'HIGH EXPOSURE';
    if (s >= 5) return 'MODERATE EXPOSURE';
    return 'LOW EXPOSURE';
  };

  const getFTOBadge = (status: string) => {
    switch(status) {
      case 'Clear': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Caution': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Blocked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getFTOIcon = (status: string) => {
    switch(status) {
      case 'Clear': return <CheckCircle2 size={10} />;
      case 'Caution': return <AlertCircle size={10} />;
      case 'Blocked': return <ShieldAlert size={10} />;
      default: return <HelpCircle size={10} />;
    }
  };

  // SVG Gauge Calculations
  const radius = 70;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // We want a gap at the top, similar to the image, so we use a partial stroke
  const strokeDashoffset = circumference - ((hasScore ? score : 0) / 10) * circumference;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <ShieldAlert size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-red-500 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Infringement Risk Assessment</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-[3rem] border border-slate-100/50">
           <div className="relative w-48 h-48 flex items-center justify-center">
              <svg 
                viewBox="0 0 160 160" 
                className="w-full h-full -rotate-90 drop-shadow-sm"
              >
                {/* Background track */}
                <circle 
                  cx="80" cy="80" r={normalizedRadius} 
                  stroke="#e2e8f0" 
                  strokeWidth={strokeWidth} 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  style={{ strokeDashoffset: circumference * 0.15 }} // Create the gap at the top
                />
                {/* Score Fill */}
                <circle 
                  cx="80" cy="80" r={normalizedRadius} 
                  stroke={getRiskColor(score)}
                  strokeWidth={strokeWidth} 
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset + (circumference * 0.15)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-6xl font-black text-slate-900 leading-none tracking-tighter">{score}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Scale 1-10</span>
              </div>
           </div>
           
           <div className="text-center mt-10 space-y-2">
              <div className="text-lg font-black tracking-tight" style={{ color: getRiskColor(score) }}>
                {getRiskLabel(score)}
              </div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
                Propensity for Infringement
              </div>
           </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center space-y-10">
           <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Freedom to Operate (FTO)</div>
              <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-sm ${getFTOBadge(patent.ftoStatus)}`}>
                 {getFTOIcon(patent.ftoStatus)}
                 Market Access: {patent.ftoStatus}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Our automated FTO analyzer classifies this asset's operational clearance as <strong>{patent.ftoStatus}</strong>. 
                {patent.ftoStatus === 'Caution' && ' Market entrance requires strategic claim mapping and potentially defensive licensing.'}
                {patent.ftoStatus === 'Clear' && ' Strategic landscape appears favorable for immediate technical deployment.'}
              </p>
           </div>

           {hasRiskFactors && (
           <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Risk Factors</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-4 rounded-xl shadow-sm group bg-white border border-slate-100 hover:border-red-200 transition-colors">
                    <div className="mt-0.5 transition-colors text-amber-500 group-hover:text-red-500">
                      <AlertCircle size={14} />
                    </div>
                    <span className="text-xs font-bold leading-tight text-slate-700">{factor}</span>
                  </li>
                ))}
              </ul>
           </div>
           )}
        </div>
      </div>

      {hasProductCategories && (
      <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
            <ArrowRight size={14} className="text-blue-500" /> Vulnerable Product Categories
         </div>
         <div className="flex flex-wrap gap-3">
            {productCategories.map((category, idx) => (
              <div key={idx} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-default bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                 <ShieldCheck size={14} className="text-blue-400" />
                 {category}
              </div>
            ))}
         </div>
      </div>
      )}
    </div>
  );
};
