
import React from 'react';
import { Patent } from '../types';
import { TrendingUp, Zap, Scale, ShieldCheck, DollarSign } from 'lucide-react';

interface ValuationBreakdownProps {
  patent: Patent;
}

export const ValuationBreakdown: React.FC<ValuationBreakdownProps> = ({ patent }) => {
  const metrics = [
    { label: 'Technical Quality', value: patent.valuationMetrics.technicalQuality, icon: <Zap size={16} />, color: 'bg-blue-500' },
    { label: 'Market Breadth', value: patent.valuationMetrics.marketBreadth, icon: <TrendingUp size={16} />, color: 'bg-emerald-500' },
    { label: 'Enforcement Strength', value: patent.valuationMetrics.enforcementStrength, icon: <Scale size={16} />, color: 'bg-amber-500' }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <DollarSign size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-emerald-600 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Algorithm Breakdown</h2>
      </div>

      <div className="space-y-8 mb-10">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="text-slate-300">{m.icon}</span>
                {m.label}
              </div>
              <span className="text-sm font-black text-slate-900">{m.value}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
              <div 
                className={`h-full ${m.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Gillow Valuation Model V4</div>
          <p className="text-[11px] text-emerald-700 font-medium leading-relaxed italic">
            Computed estimate based on historical transaction data, citation velocity, and multi-jurisdictional family depth.
          </p>
        </div>
      </div>
    </div>
  );
};
