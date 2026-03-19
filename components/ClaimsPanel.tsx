
import React from 'react';
import { Patent } from '../types';
import { calculateClaimMetrics } from '../utils/dataProcessor';
import { Shield, Layout, Layers } from 'lucide-react';

interface ClaimsPanelProps {
  patent: Patent;
}

export const ClaimsPanel: React.FC<ClaimsPanelProps> = ({ patent }) => {
  const { totalClaims, claimBreadthScore } = calculateClaimMetrics(patent);
  
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Shield size={120} />
      </div>
      
      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Claims & Scope Analysis</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-blue-100 transition-all duration-300">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
            <Layout size={24} />
          </div>
          <div className="text-4xl font-black text-slate-900 mb-1">{patent.independentClaimsCount}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Independent Claims</div>
        </div>
        
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:border-blue-100 transition-all duration-300">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
            <Layers size={24} />
          </div>
          <div className="text-4xl font-black text-slate-900 mb-1">{patent.dependentClaimsCount}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dependent Claims</div>
        </div>
        
        <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col items-center text-center group transition-all duration-300 shadow-xl shadow-slate-200">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-white">
            <Shield size={24} />
          </div>
          <div className="text-4xl font-black text-white mb-1">{totalClaims}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Protection Nodes</div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
                claimBreadthScore === 'Broad' ? 'bg-emerald-500 animate-pulse' :
                claimBreadthScore === 'Medium' ? 'bg-blue-500' :
                'bg-amber-500'
            }`} />
            <span className="text-sm font-black text-blue-900 uppercase tracking-tight">Scope Classification:</span>
        </div>
        
        <div className="flex-1 flex flex-wrap gap-3">
            <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.1em] ${
            claimBreadthScore === 'Broad' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
            claimBreadthScore === 'Medium' ? 'bg-blue-200 text-blue-900 border border-blue-300' :
            'bg-amber-100 text-amber-900 border border-amber-200'
            }`}>
            {claimBreadthScore} Protection Breadth
            </span>
        </div>
        
        <p className="text-[11px] text-blue-800 font-medium leading-relaxed max-w-sm italic">
          {claimBreadthScore === 'Broad' ? 'Significant technical capture. High enforcement potential across various market applications.' :
           claimBreadthScore === 'Medium' ? 'Solid structural protection with typical technical depth and specific implementation coverage.' :
           'Focussed specialized scope. Ideal for niche technical implementations or specific manufacturing processes.'}
        </p>
      </div>
    </div>
  );
};
