
import React from 'react';
import { Patent } from '../types';
import { Lock, Unlock, CheckCircle, Info, Handshake, DollarSign, History } from 'lucide-react';
import { hasText, isKnownNumber } from '../utils/patentDisplay';

interface LicensingPanelProps {
  patent: Patent;
}

export const getLicensingColor = (status: string) => {
  switch(status) {
    case 'Available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Exclusive License': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Non-Exclusive License': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Sold': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Under Negotiation': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Not Available': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const LicensingPanel: React.FC<LicensingPanelProps> = ({ patent }) => {
  const hasLicensingStatus = hasText(patent.licensingStatus);
  const hasAskingPrice = isKnownNumber(patent.askingPrice);
  const hasDeals = patent.previousDeals && patent.previousDeals.length > 0;

  if (!hasLicensingStatus && !hasAskingPrice && !hasDeals) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[14px]">Licensing & Transactions</h2>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-slate-50 rounded-[2rem] border border-slate-100 mb-10">
        {hasLicensingStatus && (
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm bg-white ${getLicensingColor(patent.licensingStatus)}`}>
            {patent.licensingStatus === 'Available' && <Unlock size={32} />}
            {patent.licensingStatus === 'Exclusive License' && <Lock size={32} />}
            {patent.licensingStatus === 'Sold' && <CheckCircle size={32} />}
            {patent.licensingStatus === 'Under Negotiation' && <Handshake size={32} />}
            {(patent.licensingStatus === 'Not Available' || patent.licensingStatus === 'Non-Exclusive License' || !patent.licensingStatus) && <Info size={32} />}
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Readiness</div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getLicensingColor(patent.licensingStatus)}`}>
              {patent.licensingStatus}
            </div>
          </div>
        </div>
        )}
        
        {hasAskingPrice && (
          <div className="text-center md:text-right mt-6 md:mt-0">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Listing Price</div>
            <div className="text-4xl font-black text-slate-900 flex items-center justify-center md:justify-end gap-1">
              <span className="text-slate-300 text-2xl">$</span>
              {patent.askingPrice.toLocaleString()}
            </div>
          </div>
        )}
      </div>
      
      {hasDeals && (
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={14} className="text-slate-300" /> Transaction History
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {patent.previousDeals.map((deal, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Handshake size={20} />
                    </div>
                    <div>
                        <div className="font-black text-slate-900 text-sm">{deal.licensee}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{deal.date} • {deal.type}</div>
                    </div>
                </div>
                {deal.value && (
                  <div className="flex items-center gap-1 text-emerald-600 font-black text-sm">
                    <DollarSign size={14} />
                    {(deal.value / 1000000).toFixed(1)}M
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {patent.licensingStatus === 'Available' && (
        <button className="w-full mt-10 bg-slate-900 text-white font-black uppercase tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
          <Handshake size={20} />
          Initiate Acquisition Inquiry
        </button>
      )}
    </div>
  );
};
