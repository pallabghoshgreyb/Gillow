
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Building2, Users, Globe, Zap, ShieldCheck, AlertTriangle, Fingerprint, Tag, Scale, Rocket, ShieldAlert } from 'lucide-react';
import { Patent } from '../types';
import { formatCompactCurrency, isKnownNumber } from '../utils/patentDisplay';

interface PatentCardProps {
  patent: Patent;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  href?: string;
  layout?: 'grid' | 'list';
}

const PatentCard: React.FC<PatentCardProps> = ({ patent, isFavorite, onToggleFavorite, onClick, href, layout = 'grid' }) => {
  const isList = layout === 'list';
  const cardClassName = `group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex ${isList ? 'flex-row h-72' : 'flex-col h-full'}`;
  const cardContent = (
    <>
      {/* Technical Header */}
      <div className={`relative overflow-hidden flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 ${isList ? 'w-80 border-r border-slate-100' : 'h-48 border-b border-slate-100'}`}>
        <div className="absolute inset-0 bg-white/40 pattern-grid opacity-20"></div>
        
        <div className="relative text-center p-6 select-none flex flex-col items-center">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors">
               <Fingerprint size={32} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{patent.publicationNumber}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{patent.patentType} Patent</div>
        </div>
        
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] shadow-sm
            ${patent.legalStatus === 'Granted' ? 'text-emerald-600' : 'text-amber-600'}`}>
            <div className={`w-1 h-1 rounded-full ${patent.legalStatus === 'Granted' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {patent.legalStatus}
          </span>
          {patent.flags.litigation && (
            <span className="flex items-center gap-1.5 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white shadow-sm">
                <AlertTriangle size={8} /> Litigation
            </span>
          )}
          {patent.flags.sep && (
            <span className="flex items-center gap-1.5 rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white shadow-sm">
                <ShieldCheck size={8} /> SEP
            </span>
          )}
        </div>

        {(isKnownNumber(patent.technologyReadinessLevel) || isKnownNumber(patent.infringementRiskScore)) && (
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            {isKnownNumber(patent.technologyReadinessLevel) && (
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white shadow-sm ${patent.technologyReadinessLevel >= 7 ? 'bg-emerald-500' : patent.technologyReadinessLevel >= 4 ? 'bg-blue-500' : 'bg-amber-500'}`}>
                  <Rocket size={8} /> TRL {patent.technologyReadinessLevel}
              </div>
            )}
            {isKnownNumber(patent.infringementRiskScore) && (
              <div className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white shadow-sm ${patent.infringementRiskScore >= 8 ? 'bg-red-500' : 'bg-slate-700'}`}>
                  <ShieldAlert size={8} /> Risk {patent.infringementRiskScore}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(patent.publicationNumber);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-300 hover:text-red-500 hover:bg-white transition-all shadow-md active:scale-90 z-20"
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-red-500" : ""} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start mb-3">
          <div className="text-xl font-semibold leading-none text-slate-900">
            {formatCompactCurrency(patent.valuationEstimate)}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-blue-600">
              {isKnownNumber(patent.qualityScore) ? `${patent.qualityScore}% Quality` : 'Not scored'}
            </div>
            <span className={`rounded border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] ${
              patent.independentClaimsCount >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              patent.independentClaimsCount >= 2 ? 'bg-blue-50 text-blue-700 border-blue-100' :
              'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {patent.independentClaimsCount} IND / {patent.dependentClaimsCount} DEP
            </span>
          </div>
        </div>

        <h3 className={`mb-3 flex-1 line-clamp-2 font-semibold leading-tight text-slate-800 ${isList ? 'text-2xl' : 'text-base'}`}>
          {patent.title}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <Building2 size={12} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{patent.currentAssignees[0] || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <Users size={12} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">INV: {patent.inventors.slice(0, 2).join(', ')}{patent.inventors.length > 2 ? '...' : ''}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" title="Forward Citations">
              <Zap size={10} className="text-blue-500" /> {patent.forwardCitationsCount}
            </div>
            <div className="flex items-center gap-1" title="Family Size">
              <Globe size={10} className="text-emerald-500" /> {patent.familySize}
            </div>
            <div className="flex items-center gap-1" title="Art Unit">
              <Tag size={10} className="text-amber-500" /> {patent.gau}
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Scale size={10} /> {patent.jurisdiction}
          </div>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName} onClick={() => onClick?.(patent.publicationNumber)}>
      {cardContent}
    </div>
  );
};

export default PatentCard;
