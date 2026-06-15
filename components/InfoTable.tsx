import React from 'react';
import { Patent } from '../types';

interface InfoTableProps {
  patent: Patent;
}

const InfoTable: React.FC<InfoTableProps> = ({ patent }) => {
  const items = [
    { label: 'Publication #', value: patent.id },
    { label: 'Filing Date', value: patent.filingDate },
    { label: 'Publication Date', value: patent.publicationDate },
    { label: 'Patent Type', value: patent.patentType },
    { label: 'Assignee', value: patent.assignee.name },
    { label: 'Status', value: patent.status },
    { label: 'Jurisdiction', value: patent.jurisdiction },
    { label: 'Family Size', value: patent.familySize },
    // Fix: Using correct property names 'independentClaimsCount' and 'totalClaims' from the Patent type
    { label: 'Claims', value: `${patent.independentClaimsCount} Independent / ${patent.totalClaims} Total` },
    { label: 'Citations', value: patent.citations },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-200 rounded-xl overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className={`flex items-center justify-between p-4 border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} last:border-0`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
          <span className="text-sm font-semibold text-slate-800 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default InfoTable;