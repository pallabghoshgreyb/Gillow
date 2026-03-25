import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ChevronRight, DollarSign } from 'lucide-react';
import { Patent } from '../types';
import { calculateMaintenanceStatus } from '../utils/dataProcessor';
import { isKnownNumber, hasText } from '../utils/patentDisplay';

interface MaintenanceFeeChartProps {
  patent: Patent;
}

const MaintenanceFeeChart: React.FC<MaintenanceFeeChartProps> = ({ patent }) => {
  const status = calculateMaintenanceStatus(patent);
  const hasFeeData = [
    patent.maintenanceFees.year3_5,
    patent.maintenanceFees.year7_5,
    patent.maintenanceFees.year11_5,
    patent.maintenanceFees.totalPending,
  ].some((value) => isKnownNumber(value));

  if (!hasFeeData) return null;
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-emerald-500 border-emerald-600 text-white';
      case 'overdue': return 'bg-red-500 border-red-600 text-white';
      case 'pending': return 'bg-amber-500 border-amber-600 text-white';
      default: return 'bg-slate-200 border-slate-300 text-slate-500';
    }
  };
  
  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'paid': return <CheckCircle2 size={24} />;
      case 'overdue': return <AlertCircle size={24} />;
      case 'pending': return <Clock size={24} />;
      default: return <div className="w-6 h-6 rounded-full border-2 border-current" />;
    }
  };
  
  const steps = [
    { key: 'year_3_5', label: '3.5 Year' },
    { key: 'year_7_5', label: '7.5 Year' },
    { key: 'year_11_5', label: '11.5 Year' }
  ];
  
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
      <div className="flex justify-between items-start mb-10">
        <div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Maintenance Fee Hierarchy</h3>
            <p className="text-sm text-slate-500 font-medium">Tracking USPTO milestone payments for lifecycle enforcement</p>
        </div>
        {hasText(patent.entityType) && <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
            {patent.entityType}
        </div>}
      </div>
      
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-[4.5rem] hidden md:block" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {steps.map((step, index) => {
            const stepStatus = (status as any)[step.key];
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`
                  w-full rounded-2xl border-2 p-6 text-center transition-all duration-300 shadow-xl
                  ${getStatusColor(stepStatus.status)}
                `}>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">
                    {step.label} Milestone
                  </div>
                  <div className="text-3xl font-black mb-3">
                    ${stepStatus.amount.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                    {getStatusIcon(stepStatus.status)}
                    <span>{stepStatus.status}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Threshold</div>
                  <div className={`text-sm font-bold ${stepStatus.status === 'overdue' ? 'text-red-600' : 'text-slate-800'}`}>
                    {new Date(stepStatus.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <DollarSign size={14} /> Aggregate Financials
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Already Processed</span>
                <span className="text-emerald-600">${status.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Pending</span>
                <span className={status.totalPending > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  ${status.totalPending.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-xl shadow-blue-500/20 flex flex-col justify-center">
             <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Platform Action</div>
             <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-lg font-black">Escrow Maintenance</div>
                    <p className="text-xs opacity-80">Process via PatentXchange Direct</p>
                </div>
                <button className="px-6 py-2.5 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                    Initiate
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFeeChart;
