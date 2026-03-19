import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Filter, Download, Building2, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { Patent, TechLevel, TechNode } from '../types';
import { exportTechLandscapeReport } from '../utils/exportUtils';

const TechDetail: React.FC = () => {
  const { techId } = useParams();
  const navigate = useNavigate();
  const [techInfo, setTechInfo] = useState<TechNode | null>(null);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!techId) return;
      try {
        setLoading(true);
        // Parallel fetch for info and patents
        const [info, patentList] = await Promise.all([
            api.getTechnology(techId),
            api.getPatents(techId)
        ]);
        setTechInfo(info || null);
        setPatents(patentList);
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [techId]);

  const filterOptions = useMemo(() => {
    const assignees = Array.from(new Set(patents.map((patent) => patent.assignee.name).filter(Boolean))).sort();
    const yearValues: number[] = Array.from(
      new Set(
        patents
          .map((patent) => new Date(patent.filingDate).getFullYear())
          .filter((year): year is number => !Number.isNaN(year))
      )
    );
    const years = yearValues.sort((a, b) => b - a).map(String);
    const jurisdictions = Array.from(new Set(patents.map((patent) => patent.jurisdiction).filter(Boolean))).sort();
    const statuses = Array.from(new Set(patents.map((patent) => patent.legalStatus).filter(Boolean))).sort();

    return { assignees, years, jurisdictions, statuses };
  }, [patents]);

  const filteredPatents = useMemo(() => {
    return patents.filter((patent) => {
      const filingYear = new Date(patent.filingDate).getFullYear().toString();

      if (selectedAssignee !== 'all' && patent.assignee.name !== selectedAssignee) return false;
      if (selectedYear !== 'all' && filingYear !== selectedYear) return false;
      if (selectedJurisdiction !== 'all' && patent.jurisdiction !== selectedJurisdiction) return false;
      if (selectedStatus !== 'all' && patent.legalStatus !== selectedStatus) return false;

      return true;
    });
  }, [patents, selectedAssignee, selectedJurisdiction, selectedStatus, selectedYear]);

  const competitorRows = useMemo(() => {
    const counts = new Map<string, number>();

    patents.forEach((patent) => {
      patent.currentAssignees.forEach((assignee) => {
        if (!assignee) return;
        counts.set(assignee, (counts.get(assignee) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [patents]);

  const marketVelocity = useMemo(() => {
    const years = patents
      .map((patent) => new Date(patent.filingDate).getFullYear())
      .filter((year): year is number => !Number.isNaN(year))
      .sort((a, b) => a - b);

    if (years.length === 0) {
      return { label: 'Stable', width: '40%', change: 0 };
    }

    const latestYear = Number(years[years.length - 1] || 0);
    const previousYear = latestYear - 1;
    const latestCount = patents.filter((patent) => new Date(patent.filingDate).getFullYear() === latestYear).length;
    const previousCount = patents.filter((patent) => new Date(patent.filingDate).getFullYear() === previousYear).length;
    const change = previousCount === 0 ? latestCount * 100 : Math.round(((latestCount - previousCount) / previousCount) * 100);

    if (change >= 25) return { label: 'High', width: '85%', change };
    if (change >= 5) return { label: 'Moderate', width: '65%', change };
    return { label: 'Stable', width: '45%', change };
  }, [patents]);

  const visibleFilters = [
    filterOptions.assignees.length > 1 && {
      key: 'assignee',
      label: 'Assignee',
      value: selectedAssignee,
      onChange: setSelectedAssignee,
      options: filterOptions.assignees,
    },
    filterOptions.years.length > 1 && {
      key: 'year',
      label: 'Filing Year',
      value: selectedYear,
      onChange: setSelectedYear,
      options: filterOptions.years,
    },
    filterOptions.jurisdictions.length > 1 && {
      key: 'jurisdiction',
      label: 'Jurisdiction',
      value: selectedJurisdiction,
      onChange: setSelectedJurisdiction,
      options: filterOptions.jurisdictions,
    },
    filterOptions.statuses.length > 1 && {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      onChange: setSelectedStatus,
      options: filterOptions.statuses,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    value: string;
    onChange: React.Dispatch<React.SetStateAction<string>>;
    options: string[];
  }>;

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
             <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
    );
  }

  if (!techInfo) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
             <h2 className="text-xl font-bold text-slate-800">Technology Not Found</h2>
             <button onClick={() => navigate('/')} className="text-blue-600 hover:underline flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Landscape
             </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Breadcrumb / Header */}
      <div className="bg-white border-b border-slate-200 py-8 px-6 md:px-12 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Landscape</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">{techInfo.name}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{techInfo.name} Landscape</h1>
                <p className="text-slate-500 max-w-2xl">
                    Deep dive into patent filings, assignee trends, and technological breakthroughs in the {techInfo.level === TechLevel.DOMAIN ? `${techInfo.name} domain` : `${techInfo.name} subdomain within ${techInfo.domain}`}.
                </p>
            </div>
            <div className="flex gap-3">
                <button
                  onClick={() => exportTechLandscapeReport(techInfo, filteredPatents, `${techInfo.id}-landscape-report.csv`)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-slate-300 shadow-sm"
                >
                    <Download size={16} /> Export Report
                </button>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Patent List */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border border-slate-200 sticky top-4 z-10 shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 mr-2">
                    <Filter size={18} />
                    <span className="text-sm font-semibold">Filters:</span>
                </div>
                {visibleFilters.length > 0 ? (
                  visibleFilters.map((filterConfig) => (
                    <FilterSelect
                      key={filterConfig.key}
                      label={filterConfig.label}
                      value={filterConfig.value}
                      options={filterConfig.options}
                      onChange={filterConfig.onChange}
                    />
                  ))
                ) : (
                  <div className="text-xs font-medium text-slate-400">No additional filters available for this technology slice.</div>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredPatents.length > 0 ? (
                    filteredPatents.map((patent) => (
                        <PatentCard key={patent.id} patent={patent} onClick={() => navigate(`/patent/${patent.id}`)} />
                    ))
                ) : (
                    <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
                        No patents found for this technology.
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Sticky Insights */}
        <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
                
                {/* Insight Card 1 */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Market Velocity</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-bold text-blue-600">{marketVelocity.label}</span>
                        <span className="text-sm text-slate-500 mb-1">Activity Level</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: marketVelocity.width }}></div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Filings have {marketVelocity.change >= 0 ? 'increased' : 'decreased'} by <span className={`${marketVelocity.change >= 0 ? 'text-emerald-600' : 'text-red-600'} font-bold`}>{Math.abs(marketVelocity.change)}%</span> versus the prior filing year in this technology slice.
                    </p>
                </div>

                 {/* Insight Card 2: Top Assignees */}
                 <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Key Players</h3>
                    <ul className="space-y-4">
                        {competitorRows.map((player, index) => (
                          <PlayerRow key={player.name} rank={index + 1} name={player.name} count={player.count} />
                        ))}
                    </ul>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: React.Dispatch<React.SetStateAction<string>>;
}> = ({
  label,
  value,
  options,
  onChange,
}) => (
    <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
        <span className="font-semibold">{label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="bg-transparent outline-none text-xs font-semibold text-slate-700"
        >
          <option value="all">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
    </label>
);

const PatentCard: React.FC<{ patent: Patent; onClick: () => void }> = ({ patent, onClick }) => (
    <div onClick={onClick} className="bg-white border border-slate-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{patent.id}</span>
            <span className="text-xs text-slate-400">{patent.publicationDate}</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{patent.title}</h3>
        {patent.abstract && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{patent.abstract}</p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-700 font-medium">{patent.assignee.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                <span>{patent.jurisdiction}</span>
            </div>
             <div className="flex items-center gap-1.5 ml-auto">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100">{patent.legalStatus || 'Unknown'}</span>
            </div>
        </div>
    </div>
);

const PlayerRow: React.FC<{ rank: number; name: string; count: number }> = ({ rank, name, count }) => (
    <li className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100 rounded-full border border-slate-200">{rank}</span>
            <span className="text-sm text-slate-700">{name}</span>
        </div>
        <span className="text-sm font-mono text-slate-500">{count.toLocaleString()}</span>
    </li>
);

export default TechDetail;
