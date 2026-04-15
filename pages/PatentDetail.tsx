import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, Share2, Heart, ExternalLink, 
    Users, Globe, Download, Info,
    ChevronRight, CheckCircle2, Building2,
    Scale, AlertTriangle, Tag, ListTree,
    Calendar, History, DollarSign, Clock,
    Zap, Gavel, ShieldAlert, BadgeCheck, XCircle, ArrowDown,
    Dna, Layers, Cpu, Flag, FileText,
    type LucideIcon
} from 'lucide-react';
import { Patent } from '../types';
import { api } from '../utils/api';
import PatentFamilyMap from '../components/PatentFamilyMap';
import MaintenanceFeeChart from '../components/MaintenanceFeeChart';
import { ClaimsPanel } from '../components/ClaimsPanel';
import { LicensingPanel, getLicensingColor } from '../components/LicensingPanel';
import { TRLPanel } from '../components/TRLPanel';
import { MarketPanel } from '../components/MarketPanel';
import { RiskPanel } from '../components/RiskPanel';
import { PortfolioPanel } from '../components/PortfolioPanel';
import { ProsecutionPanel } from '../components/ProsecutionPanel';
import { ProceduralSignalsPanel } from '../components/ProceduralSignalsPanel';
import { useGillow } from '../context/GillowContext';
import { exportPatentToCsv } from '../utils/exportUtils';
import { shareContent } from '../utils/shareUtils';
import { hasItems, hasText, isKnownNumber } from '../utils/patentDisplay';

const PatentDetail: React.FC = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useGillow();
  
  const [patent, setPatent] = useState<Patent | null>(null);
  const [allPatents, setAllPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState('');

  const isSaved = patent ? favorites.includes(patent.publicationNumber) : false;

  useEffect(() => {
    const fetchData = async () => {
        if (!patentId) return;
        try {
            setLoading(true);
            window.scrollTo(0, 0);
            const [data, patentList] = await Promise.all([
              api.getPatent(patentId),
              api.getPatents()
            ]);
            if (data) setPatent(data);
            setAllPatents(patentList);
        } catch (error) {
            console.error("Failed to load patent", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [patentId]);

  useEffect(() => {
    if (!shareStatus) return;
    const timer = window.setTimeout(() => setShareStatus(''), 2500);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  const handleSharePatent = async () => {
    if (!patent) return;

    try {
      const result = await shareContent({
        title: patent.publicationNumber,
        text: `${patent.title} by ${patent.currentAssignees[0] || 'Unknown assignee'}`,
        url: window.location.href,
      });
      setShareStatus(result === 'copied' ? 'Patent link copied.' : 'Patent shared.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setShareStatus('Unable to share right now.');
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Processing Intellectual Patent...</span>
    </div>
  );

  if (!patent) return (
    <div className="p-20 text-center flex flex-col items-center">
        <Info size={48} className="text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Patent Not Found</h2>
        <button onClick={() => navigate('/browse')} className="mt-4 text-blue-600 font-bold hover:underline flex items-center gap-2">
            <ArrowLeft size={18} /> Marketplace Hub
        </button>
    </div>
  );

  const hasTechDna = hasText(patent.abstract) || hasText(patent.domain) || hasText(patent.subdomain) || patent.cpcs.length > 0 || patent.ipcs.length > 0;
  const hasLegalProfile = hasText(patent.legalStatus) || hasText(patent.simpleLegalStatus) || patent.flags.sep || patent.flags.opposition || patent.flags.ptab || patent.flags.litigation;
  const hasMaintenanceSection = [
    patent.maintenanceFees.year3_5,
    patent.maintenanceFees.year7_5,
    patent.maintenanceFees.year11_5,
    patent.maintenanceFees.totalPending,
  ].some((value) => isKnownNumber(value));
  const hasPortfolioSection = hasText(patent.patentFamilyStrategy) || hasText(patent.portfolioSegment) || patent.relatedPatents.length > 0;
  const hasProceduralSignalsSection =
    hasItems(patent.trackOneCodes) ||
    hasItems(patent.nonPublicationCodes) ||
    hasItems(patent.cipConDiv) ||
    hasItems(patent.iprPgr) ||
    hasItems(patent.fit) ||
    hasItems(patent.largestFamilies) ||
    patent.flags.governmentInterest ||
    patent.flags.sep ||
    patent.flags.litigation;
  const hasProsecutionSection = hasText(patent.firstActionDate) || hasText(patent.allowanceDate) || isKnownNumber(patent.prosecutionDuration) || isKnownNumber(patent.officeActionsCount) || isKnownNumber(patent.rceCount);
  const hasMarketSection = hasText(patent.marketSector) || isKnownNumber(patent.totalAddressableMarket) || isKnownNumber(patent.marketGrowthRate) || hasItems(patent.keyCompetitors) || hasItems(patent.marketRegion);
  const hasRiskSection = isKnownNumber(patent.infringementRiskScore) || hasItems(patent.riskFactors) || hasItems(patent.keyProductCategories);
  const hasTrlSection = isKnownNumber(patent.technologyReadinessLevel) || hasText(patent.trlDescription) || hasItems(patent.commercialApplications);
  const hasClaimsSection = patent.totalClaims > 0;
  const hasLicensingSection = hasText(patent.licensingStatus) || isKnownNumber(patent.askingPrice) || patent.previousDeals.length > 0;
  const hasGeographySection = patent.countries.length > 0;
  const hasMarketSidebar = hasText(patent.marketSector) || isKnownNumber(patent.totalAddressableMarket);
  const hasTrlSidebar = isKnownNumber(patent.technologyReadinessLevel);
  const hasLicensingSidebar = hasText(patent.licensingStatus);
  const hasRiskSidebar = isKnownNumber(patent.infringementRiskScore);
  const marketSidebarValue = hasText(patent.marketSector) ? patent.marketSector : `$${(patent.totalAddressableMarket / 1e9).toFixed(1)}B TAM`;
  const marketSidebarSub = isKnownNumber(patent.totalAddressableMarket) ? `TAM: $${(patent.totalAddressableMarket / 1e9).toFixed(1)}B` : 'Market Data';
  const timelineMilestones = [
    {
      label: 'Priority',
      date: patent.priorityDate,
      detail: 'Earliest claimed priority',
      icon: Flag,
      tone: 'completed' as const,
    },
    {
      label: 'Filing',
      date: patent.priorityDate === patent.filingDate ? 'Self-Contained' : patent.filingDate,
      detail: patent.priorityDate === patent.filingDate ? 'Filed without a separate provisional' : 'Formal application submitted',
      icon: FileText,
      tone: 'completed' as const,
    },
    {
      label: 'Publication',
      date: patent.publicationDate,
      detail: 'Public disclosure milestone',
      icon: Globe,
      tone: 'completed' as const,
    },
    {
      label: 'Estimated Expiration',
      date: patent.estimatedExpirationDate,
      detail: 'Projected end of enforceable term',
      icon: Clock,
      tone: 'pending' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 pb-40">
      
      {/* Detail Toolbar */}
      <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 px-6 shadow-sm">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                  <Link to="/browse" className="hover:text-blue-600 transition-colors">Marketplace</Link>
                  <ChevronRight size={12} />
                  <span className="text-slate-600 truncate max-w-[150px]">{patent.domain}</span>
                  <ChevronRight size={12} />
                  <span className="text-slate-900">{patent.publicationNumber}</span>
              </nav>
              <div className="flex items-center gap-3">
                  {shareStatus && (
                    <span className="hidden text-[10px] font-black uppercase tracking-widest text-blue-600 md:inline">
                      {shareStatus}
                    </span>
                  )}
                  <button onClick={() => toggleFavorite(patent.publicationNumber)} className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all font-black text-xs uppercase tracking-widest shadow-sm ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                      {isSaved ? 'Tracked' : 'Track'}
                  </button>
                  <button
                    onClick={() => void handleSharePatent()}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    aria-label="Share patent"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => exportPatentToCsv(patent, `${patent.publicationNumber}.csv`)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                  >
                    <Download size={18} />
                  </button>
              </div>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 pt-16 grid grid-cols-1 lg:grid-cols-12 lg:items-start gap-16">
        <div className="lg:col-span-8 space-y-20">
            
            {/* Header Section */}
            <section id="header" className="space-y-10">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            {patent.publicationNumber}
                        </span>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border flex items-center gap-1.5 ${patent.legalStatus === 'Granted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            <CheckCircle2 size={12} /> {patent.legalStatus}
                        </span>
                        <span className="px-3 py-1 text-[10px] font-black bg-slate-900 text-white rounded-lg uppercase tracking-widest">
                            {patent.patentType}
                        </span>
                        {hasText(patent.licensingStatus) && <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getLicensingColor(patent.licensingStatus)}`}>
                            {patent.licensingStatus}
                        </span>}
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">{patent.title}</h1>
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                       <MetricCompact icon={<Building2 size={16} />} label="Owner" value={patent.currentAssignees[0] || 'Unassigned'} />
                       <MetricCompact icon={<Tag size={16} />} label="Entity Type" value={patent.entityType || 'Unknown'} />
                       <MetricCompact icon={<ListTree size={16} />} label="Art Unit" value={patent.gau} />
                       <MetricCompact icon={<Calendar size={16} />} label="Filed" value={patent.filingDate} />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <MetricCard icon={<Globe size={20} />} label="Family" value={String(patent.familySize ?? 0)} color="emerald" />
                    <MetricCard icon={<Zap size={20} />} label="Forward" value={String(patent.forwardCitationsCount ?? 0)} color="blue" />
                    <MetricCard icon={<History size={20} />} label="Backward" value={String(patent.backwardCitationsCount ?? 0)} color="slate" />
                    <MetricCard 
                        icon={<Clock size={20} />} 
                        label="Expires" 
                        value={
                            patent.estimatedExpirationDate?.includes(',') 
                                ? patent.estimatedExpirationDate.split(',')[1].trim() 
                                : patent.estimatedExpirationDate?.split(' ').pop() || 'Unknown'
                        } 
                        color="amber" 
                    />
                </div>
            </section>

            {/* Patent Timeline */}
            <section id="timeline" className="space-y-10 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-[14px]">Patent Timeline</h2>
                </div>
                <div className="rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/80 to-cyan-50/80 p-8 md:p-10 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.35)] backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_28%)]" />
                    <div className="absolute -bottom-10 -right-6 opacity-[0.07] text-slate-900"><Scale size={180} /></div>
                    <div className="relative">
                        <div className="mb-8 flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600">Lifecycle View</p>
                                <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">Track the core prosecution milestones from earliest priority through the expected patent term endpoint.</p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute left-8 right-8 top-7 hidden h-1 rounded-full bg-gradient-to-r from-slate-200 via-sky-200 to-cyan-200 md:block" />
                            <div className="absolute left-8 right-8 top-7 hidden h-1 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 md:block" />
                            <div className="flex gap-6 overflow-x-auto px-1 pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-5 md:overflow-visible">
                                {timelineMilestones.map((milestone, index) => (
                                  <React.Fragment key={milestone.label}>
                                    <TimelineNode
                                      label={milestone.label}
                                      date={milestone.date}
                                      detail={milestone.detail}
                                      icon={milestone.icon}
                                      tone={milestone.tone}
                                      isLast={index === timelineMilestones.length - 1}
                                    />
                                  </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 1. Intellectual Stakeholders */}
            <section id="parties" className="space-y-12 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-[14px]">Intellectual Stakeholders</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                            <Building2 size={16} className="text-blue-600" /> Chain of Ownership
                        </div>
                        <div className="relative space-y-8 pl-4">
                            <div className="absolute left-0 top-2 bottom-8 w-0.5 bg-slate-100" />
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-sm z-10" />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter">Current Holder</span>
                                    </div>
                                    {patent.currentAssignees.length > 0 ? [...new Set(patent.currentAssignees)].map((item, idx) => (
                                        <div key={idx} className="p-5 bg-white border-2 border-blue-100 rounded-2xl text-sm font-black text-slate-900 flex items-center justify-between hover:border-blue-300 transition-all shadow-sm">
                                            {item} <ExternalLink size={14} className="text-blue-400" />
                                        </div>
                                    )) : (
                                        <div className="p-5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 text-center">
                                            No ownership data available
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-center -my-4 relative z-0">
                                <ArrowDown size={14} className="text-slate-200" />
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-4 h-4 bg-slate-200 rounded-full border-4 border-white shadow-sm z-10" />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">Original Applicant</span>
                                    </div>
                                    {patent.originalAssignees.length > 0 ? [...new Set(patent.originalAssignees)].map((item, idx) => {
                                        const isSame = patent.currentAssignees.includes(item);
                                        return (
                                            <div key={idx} className={`p-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold flex items-center justify-between transition-colors ${isSame ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {item} {isSame && <span className="text-[8px] font-black uppercase text-slate-300">Identical</span>}
                                                <History size={14} className="opacity-20" />
                                            </div>
                                        );
                                    }) : (
                                        <div className="p-5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 text-center">
                                            No original applicant data
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                            <Users size={16} className="text-blue-600" /> Technical Contributors
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Inventors List</div>
                            <div className="space-y-3">
                                {[...new Set(patent.inventors)].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                                            {(String(item)).split(' ').map(n => n[0]).join('')}
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Technology DNA */}
            {hasTechDna && <section id="tech-dna" className="space-y-10">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest text-[12px] flex items-center gap-2">
                        <Dna size={18} className="text-blue-600" /> Technology DNA
                      </h2>
                   </div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      Art Unit: {patent.gau}
                   </div>
                </div>
                {hasText(patent.abstract) && <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                      <Dna size={200} />
                    </div>
                    <p className="text-slate-700 leading-relaxed text-xl font-medium italic font-serif relative z-10">
                        "{patent.abstract}"
                    </p>
                </div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(hasText(patent.domain) || hasText(patent.subdomain)) && <div className="space-y-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Layers size={14} className="text-blue-500" /> Taxonomic Classification
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {hasText(patent.domain) && <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Tag size={12}/> Domain</div>
                                <div className="font-black text-slate-900 text-lg">{patent.domain}</div>
                            </div>}
                            {hasText(patent.subdomain) && <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-100 transition-all">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ListTree size={12}/> Subdomain</div>
                                <div className="font-black text-slate-900 text-lg">{patent.subdomain}</div>
                            </div>}
                        </div>
                    </div>}
                    {(patent.cpcs.length > 0 || patent.ipcs.length > 0) && <div className="space-y-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Cpu size={14} className="text-blue-500" /> Classification DNA
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
                           {patent.cpcs.length > 0 && <div className="space-y-3">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">CPC (Cooperative Patent Classification)</div>
                              <div className="flex flex-wrap gap-2">
                                 {patent.cpcs.slice(0, 6).map((cpc, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-mono font-bold hover:bg-blue-600 hover:text-white transition-all cursor-default">
                                       {cpc}
                                    </span>
                                 ))}
                              </div>
                           </div>}
                           {patent.cpcs.length > 0 && patent.ipcs.length > 0 && <div className="h-px bg-slate-50 w-full" />}
                           {patent.ipcs.length > 0 && <div className="space-y-3">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">IPC (International Patent Classification)</div>
                              <div className="flex flex-wrap gap-2">
                                 {patent.ipcs.slice(0, 4).map((ipc, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] font-mono font-bold hover:bg-slate-800 hover:text-white transition-all cursor-default">
                                       {ipc}
                                    </span>
                                 ))}
                              </div>
                           </div>}
                        </div>
                    </div>}
                </div>
            </section>}

            {/* 3. Procedural & Strategic Signals */}
            {hasProceduralSignalsSection && <section id="procedural-signals">
                <ProceduralSignalsPanel patent={patent} />
            </section>}

            {/* 4. Global Enforceability Footprint */}
            {hasGeographySection && <section id="geography" className="space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase tracking-widest text-[14px]">Global Enforceability Footprint</h2>
                </div>
                <PatentFamilyMap patent={patent} height={500} />
            </section>}

            {/* 5. Legal Status & Enforcement */}
            {hasLegalProfile && <section id="legal-profile" className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Gavel size={28} className="text-blue-600" /> Legal Status & Enforcement
                    </h2>
                    {hasText(patent.simpleLegalStatus) && <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border ${patent.simpleLegalStatus === 'Alive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {patent.simpleLegalStatus === 'Alive' ? <BadgeCheck size={14} /> : <XCircle size={14} />}
                        Portfolio Status: {patent.simpleLegalStatus}
                    </div>}
                 </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                        {hasText(patent.legalStatus) && <div className="space-y-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Legal Designation</div>
                            <div className="text-3xl font-black text-slate-900">{patent.legalStatus}</div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Recognized as <strong>{patent.legalStatus}</strong> by the relevant patent office. 
                                {hasText(patent.simpleLegalStatus) && <> Its operational viability is classified as <strong>{patent.simpleLegalStatus}</strong>.</>}
                            </p>
                        </div>}
                        <div className="space-y-4">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enforcement Landscape</div>
                            <div className="flex flex-wrap gap-3">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${patent.flags.litigation ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
                                    <ShieldAlert size={14} /> Litigation History
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${patent.flags.sep ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-slate-100 text-slate-400 opacity-60'}`}>
                                    <Tag size={14} /> SEP Candidate
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-200">
                        <FlagCard label="SEP Candidate" active={patent.flags.sep} />
                        <FlagCard label="Oppositions" active={patent.flags.opposition} />
                        <FlagCard label="PTAB Review" active={patent.flags.ptab} />
                        <FlagCard label="Active Litigation" active={patent.flags.litigation} />
                    </div>
                 </div>
            </section>}

            {/* 6. Maintenance Fee Hierarchy */}
            {hasMaintenanceSection && <section id="maintenance">
                <MaintenanceFeeChart patent={patent} />
            </section>}

            {/* 7. Portfolio & Asset Linkage */}
            {hasPortfolioSection && <section id="portfolio-context">
                <PortfolioPanel patent={patent} allPatents={allPatents} />
            </section>}

            {/* 8. Prosecution History Summary */}
            {hasProsecutionSection && <section id="prosecution">
                <ProsecutionPanel patent={patent} />
            </section>}

            {/* 9. Market Intelligence & TAM */}
            {hasMarketSection && <section id="market-intel">
                <MarketPanel patent={patent} />
            </section>}

            {/* 10. Infringement Risk Assessment */}
            {hasRiskSection && <section id="risk-assessment">
                <RiskPanel patent={patent} />
            </section>}

            {/* 11. Technology Readiness (TRL) */}
            {hasTrlSection && <section id="trl">
                <TRLPanel patent={patent} />
            </section>}

            {/* 12. Claims & Scope Analysis */}
            {hasClaimsSection && <section id="claims">
                <ClaimsPanel patent={patent} />
            </section>}

            {/* 13. Licensing & Transactions */}
            {hasLicensingSection && <section id="licensing">
                <LicensingPanel patent={patent} />
            </section>}

        </div>

         {/* Sidebar Marketplace Panel */}
        <div className="lg:col-span-4">
            <div className="sticky top-40 space-y-10">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 space-y-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 -translate-y-1/2 translate-x-1/2 rounded-full" />
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <DollarSign size={12}/> Estimated Valuation
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-slate-900 leading-none">
                                $
                                {(patent.valuationEstimate / 1000000).toFixed(1)}M
                            </span>
                        </div>
                    </div>
                    <div className="space-y-5 border-t border-slate-50 pt-10">
                        <SideStat label="Patent Quality" value={`${patent.qualityScore}/100`} sub="Technical Momentum" />
                        {hasMarketSidebar && <SideStat label="Market Sector" value={marketSidebarValue} sub={marketSidebarSub} />}
                        {hasTrlSidebar && <SideStat label="TRL Maturity" value={`Level ${patent.technologyReadinessLevel}`} sub="Readiness State" />}
                        {hasLicensingSidebar && <SideStat label="Licensing" value={patent.licensingStatus} sub="Acquisition Availability" />}
                        {hasRiskSidebar && <SideStat label="Risk Profile" value={`${patent.infringementRiskScore}/10`} sub={`FTO: ${patent.ftoStatus}`} />}
                    </div>
                </div>
                <div className="bg-slate-950 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 p-6 opacity-5"><Scale size={160} /></div>
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                       <History size={20} className="text-blue-400" /> Patent Timeline
                    </h3>
                    <div className="space-y-8">
                       <SidebarTimelineEvent label="Priority" date={patent.priorityDate} />
                       <SidebarTimelineEvent label="Filing" date={patent.priorityDate === patent.filingDate ? 'Self-Contained' : patent.filingDate} />
                       <SidebarTimelineEvent label="Publication" date={patent.publicationDate} />
                       <SidebarTimelineEvent label="Estimated Expiration" date={patent.estimatedExpirationDate} highlight />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const MetricCompact = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-2.5">
        <div className="text-slate-300">{icon}</div>
        <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</div>
            <div className="text-sm font-bold text-slate-700">{value}</div>
        </div>
    </div>
);

const MetricCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors group">
        <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1 ${color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-slate-400'}`}>
            {icon}
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
);

const SideStat = ({ label, value, sub }: { label: string, value: string, sub: string }) => (
    <div className="flex justify-between items-center group">
        <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{label}</div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter line-clamp-1">{sub}</div>
        </div>
        <div className="text-sm font-black text-slate-900">{value}</div>
    </div>
);

const TimelineNode = ({
    label,
    date,
    detail,
    icon: Icon,
    tone,
    isLast,
}: {
    label: string,
    date: string,
    detail: string,
    icon: LucideIcon,
    tone: 'completed' | 'pending',
    isLast?: boolean,
}) => (
    <div className="group min-w-[220px] flex-1 md:min-w-0">
        <div className="flex flex-col items-center text-center">
            <div className="relative">
                {tone === 'completed' && <div className="absolute inset-1 rounded-full bg-sky-400/30 animate-pulse" />}
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-105 ${tone === 'pending' ? 'bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-200/80' : 'bg-gradient-to-br from-blue-600 to-cyan-400 shadow-sky-200/80'}`}>
                    <Icon size={22} />
                </div>
            </div>
            <div className={`mt-4 h-10 w-px ${tone === 'pending' ? 'bg-gradient-to-b from-amber-400 to-transparent' : 'bg-gradient-to-b from-sky-500 to-transparent'}`} />
            <div className="w-full rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)] backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-28px_rgba(14,116,144,0.45)]">
                <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${tone === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                    {label}
                </div>
                <div className={`text-base font-black tracking-tight ${tone === 'pending' ? 'text-amber-600' : 'text-slate-900'}`}>{date}</div>
                <div className="mt-2 text-xs font-medium text-slate-500">{detail}</div>
            </div>
            {!isLast && <div className="mt-5 h-px w-full bg-gradient-to-r from-sky-200 via-cyan-200 to-transparent md:hidden" />}
        </div>
    </div>
);

const SidebarTimelineEvent = ({ label, date, highlight }: { label: string, date: string, highlight?: boolean }) => (
    <div className="flex gap-6 relative">
        <div className="flex flex-col items-center">
            <div className={`w-3.5 h-3.5 rounded-full border-2 ${highlight ? 'bg-blue-500 border-white' : 'bg-slate-800 border-slate-700'}`} />
            <div className="flex-1 w-px bg-slate-800" />
        </div>
        <div className="pb-4">
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-blue-400' : 'text-slate-500'}`}>{label}</div>
            <div className={`text-sm font-bold tracking-tight ${highlight ? 'text-white' : 'text-slate-300'}`}>{date}</div>
        </div>
    </div>
);

const FlagCard = ({ label, active }: { label: string, active: boolean }) => (
    <div className={`p-5 rounded-2xl border flex flex-col items-center gap-4 transition-all ${active ? 'bg-red-50 border-red-200 shadow-xl scale-105' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${active ? 'bg-white text-red-600' : 'bg-slate-100 text-slate-400'}`}>
           {active ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest text-center ${active ? 'text-red-700' : 'text-slate-500'}`}>
            {label}
        </div>
    </div>
);

export default PatentDetail;
