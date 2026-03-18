
import React from 'react';
import { Patent } from '../types';
import { History, FileText, Calendar, RotateCw, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface ProsecutionPanelProps {
  patent: Patent;
}

export const ProsecutionPanel: React.FC<ProsecutionPanelProps> = ({ patent }) => {
  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    try {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return d;
    }
  };

  const years = Math.floor(patent.prosecutionDuration / 365);
  const months = Math.floor((patent.prosecutionDuration % 365) / 30);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <History size={120} />
      </div>

      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-slate-900 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Prosecution History Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <ProsecutionStat 
          label="Office Actions" 
          value={patent.officeActionsCount} 
          icon={<FileText size={18} />} 
          color="slate"
        />
        <ProsecutionStat 
          label="RCE Filings" 
          value={patent.rceCount} 
          icon={<RotateCw size={18} />} 
          color="blue"
        />
        <ProsecutionStat 
          label="First Action" 
          value={formatDate(patent.firstActionDate)} 
          icon={<Calendar size={18} />} 
          color="amber"
          isDate
        />
        <ProsecutionStat 
          label="Allowance" 
          value={formatDate(patent.allowanceDate)} 
          icon={<CheckCircle2 size={18} />} 
          color="emerald"
          isDate
        />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-blue-500" /> Prosecution Lifecycle
           </h4>
           <div className="px-4 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Duration: {years}Y {months}M ({patent.prosecutionDuration} Days)
           </div>
        </div>

        <div className="relative pt-6 pb-12 px-4">
            <div className="absolute top-10 left-0 right-0 h-1 bg-slate-100 rounded-full" />
            <div className="flex justify-between items-start relative z-10">
                <TimelinePoint label="Filing" date={patent.filingDate} active />
                <TimelinePoint label="First Action" date={patent.firstActionDate} active />
                <TimelinePoint label="Allowance" date={patent.allowanceDate} active />
                <TimelinePoint label="Granted" date={patent.publicationDate} active highlight />
            </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
               <FileText size={20} />
            </div>
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public PAIR Records</div>
               <div className="text-sm font-black text-slate-900 leading-none mt-1">Access Full File Wrapper History</div>
            </div>
         </div>
         <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

const ProsecutionStat = ({ label, value, icon, color, isDate }: { label: string, value: string | number, icon: any, color: string, isDate?: boolean }) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={`font-black text-slate-900 ${isDate ? 'text-sm' : 'text-2xl'}`}>{value}</div>
    </div>
  );
};

const TimelinePoint = ({ label, date, active, highlight }: { label: string, date: string, active?: boolean, highlight?: boolean }) => (
  <div className="flex flex-col items-center gap-4 w-24">
    <div className={`w-4 h-4 rounded-full border-4 ${highlight ? 'bg-blue-600 border-white shadow-lg ring-2 ring-blue-100' : active ? 'bg-slate-900 border-white shadow-sm' : 'bg-white border-slate-200'}`} />
    <div className="text-center">
      <div className={`text-[9px] font-black uppercase tracking-tighter leading-none mb-1 ${highlight ? 'text-blue-600' : 'text-slate-500'}`}>{label}</div>
      <div className="text-[10px] font-bold text-slate-900 whitespace-nowrap">
        {new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  </div>
);
