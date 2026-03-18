import React, { useState, useEffect } from 'react';
import { Patent } from '../types';
import { api } from '../utils/api';
import { TrendingUp, FileText, Globe, Zap, History, ShieldCheck, MapPin } from 'lucide-react';

interface ComparisonTableProps {
  patentIds: string[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ patentIds }) => {
  const [patents, setPatents] = useState<Patent[]>([]);

  useEffect(() => {
    const load = async () => {
      const all = await api.getPatents();
      setPatents(all.filter(p => patentIds.includes(p.publicationNumber)));
    };
    load();
  }, [patentIds]);

  const rows = [
    { label: 'Market Valuation', key: 'askingPrice', format: () => `$`, icon: <TrendingUp size={16}/> },
    { label: 'Quality Score', key: 'qualityScore', format: (val: number) => `${val}/100`, icon: <Zap size={16}/> },
    { label: 'Independent Claims', key: 'independentClaims', icon: <FileText size={16}/> },
    { label: 'Family Size', key: 'familySize', icon: <Globe size={16}/> },
    { label: 'Jurisdiction', key: 'jurisdiction', icon: <MapPin size={16}/> },
    { label: 'Assignee', key: 'assignee', format: (val: any) => val.name, icon: <ShieldCheck size={16}/> },
    { label: 'Status', key: 'legalStatus', icon: <History size={16}/> },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-6 w-1/4 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">Specifications</th>
            {patents.map(p => (
              <th key={p.publicationNumber} className="p-6 border-b border-slate-200 min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-mono font-bold text-blue-600">{p.publicationNumber}</div>
                  <div className="text-sm font-black text-slate-900 leading-tight line-clamp-2 h-10">{p.title}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
              <td className="p-6 border-b border-slate-100 flex items-center gap-3 text-sm font-bold text-slate-500">
                <span className="text-slate-300">{row.icon}</span>
                {row.label}
              </td>
              {patents.map(p => (
                <td key={p.publicationNumber} className="p-6 border-b border-slate-100">
                  <span className={`text-sm font-black ${row.key === 'askingPrice' ? 'text-blue-600' : 'text-slate-900'}`}>
                    {row.format ? row.format((p as any)[row.key]) : (p as any)[row.key]}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="p-6 text-sm font-bold text-slate-500">Tech Abstract</td>
            {patents.map(p => (
              <td key={p.publicationNumber} className="p-6">
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-6">{p.abstract}</p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;