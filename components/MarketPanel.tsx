
import React from 'react';
import { Patent } from '../types';
import { BarChart3, Globe, TrendingUp, Users, Target, Activity, MapPin } from 'lucide-react';

interface MarketPanelProps {
  patent: Patent;
}

export const MarketPanel: React.FC<MarketPanelProps> = ({ patent }) => {
  const formatUSD = (val: number) => {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const valuationToTamRatio = (patent.valuationEstimate / patent.totalAddressableMarket) * 100;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <BarChart3 size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Market Intelligence & TAM</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MarketMetric 
          label="Target Sector" 
          value={patent.marketSector} 
          icon={<Target size={18} />} 
          color="blue"
        />
        <MarketMetric 
          label="Market TAM" 
          value={formatUSD(patent.totalAddressableMarket)} 
          icon={<Globe size={18} />} 
          color="emerald"
        />
        <MarketMetric 
          label="Growth Rate" 
          value={`+${patent.marketGrowthRate}%`} 
          icon={<TrendingUp size={18} />} 
          color="amber"
          trend="up"
        />
        <MarketMetric 
          label="Capture Value" 
          value={`${valuationToTamRatio.toFixed(4)}%`} 
          sub="Asset / TAM Ratio"
          icon={<Activity size={18} />} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Users size={14} className="text-blue-500" /> Competitive Landscape
           </div>
           <div className="flex flex-wrap gap-3">
              {patent.keyCompetitors.map((competitor, idx) => (
                <div key={idx} className="px-5 py-2.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-slate-100 transition-colors shadow-sm group">
                   <span className="opacity-40 group-hover:opacity-100 transition-opacity mr-2">#</span>
                   {competitor}
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <MapPin size={14} className="text-emerald-500" /> Deployment Regions
           </div>
           <div className="flex flex-wrap gap-3">
              {patent.marketRegion.map((region, idx) => (
                <div key={idx} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl text-xs font-black uppercase tracking-tight">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                   {region}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const MarketMetric = ({ label, value, sub, icon, color, trend }: { label: string, value: string, sub?: string, icon: any, color: string, trend?: 'up' | 'down' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white transition-all group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm transition-transform group-hover:-translate-y-1 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-black text-slate-900 leading-tight">{value}</div>
      {sub ? (
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{sub}</div>
      ) : trend === 'up' ? (
          <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mt-1 flex items-center gap-1">
             <TrendingUp size={10} /> High Momentum
          </div>
      ) : null}
    </div>
  );
};
