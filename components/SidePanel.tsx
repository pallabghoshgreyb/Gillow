import React, { useState, useEffect } from 'react';
import { TechNode, ChartDataPoint, TechLevel } from '../types';
import { X, TrendingUp, Building2, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface SidePanelProps {
  node: TechNode | null;
  onClose: () => void;
}

const hasText = (value?: string | null) => Boolean(value && value.trim());

const formatGrowth = (growth: number) => {
  if (growth > 0) return { label: `+${growth}% vs prior period`, className: 'text-emerald-600' };
  if (growth < 0) return { label: `${growth}% vs prior period`, className: 'text-red-600' };
  return { label: 'No visible change vs prior period', className: 'text-slate-500' };
};

const buildContextCopy = (node: TechNode) => {
  const scope =
    node.level === TechLevel.DOMAIN
      ? `${node.name} is a primary technology domain in this landscape.`
      : `${node.name} is a level 2 subdomain within ${node.domain}.`;
  const momentum =
    node.growth > 0
      ? `Filing activity is up ${node.growth}% versus the prior comparison period.`
      : node.growth < 0
        ? `Filing activity is down ${Math.abs(node.growth)}% versus the prior comparison period.`
        : 'Filing activity is flat versus the prior comparison period.';
  const assignee = hasText(node.topAssignee)
    ? `${node.topAssignee} appears most often in the current dataset for this segment.`
    : 'No lead entity is disclosed in the current dataset for this segment.';

  return `${scope} ${momentum} ${assignee}`;
};

const SidePanel: React.FC<SidePanelProps> = ({ node, onClose }) => {
  const navigate = useNavigate();
  const [trends, setTrends] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTrends = async () => {
      if (!node) return;
      setLoading(true);
      try {
        const data = await api.getTrends(node.id);
        setTrends(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTrends();
  }, [node]);

  if (!node) return null;

  const growth = formatGrowth(node.growth);
  const leadEntity = hasText(node.topAssignee) ? node.topAssignee : 'Not disclosed';

  return (
    <div className="absolute top-4 right-4 bottom-4 z-30 flex w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/82 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl animate-in slide-in-from-right duration-300 md:w-[430px]">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 p-6">
        <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#00bdcd]">{node.domain}</div>
            <h2 className="text-2xl font-semibold leading-tight text-white">{node.name}</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-white/45 transition-colors hover:bg-white/5 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-white/55">
                    <FileText size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Volume</span>
                </div>
                <div className="text-2xl font-semibold text-white">{node.patentCount.toLocaleString()}</div>
                <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${growth.className}`}>
                    <TrendingUp size={12} />
                    {growth.label}
                </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-white/55">
                    <Building2 size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">Lead Entity</span>
                </div>
                <div className="line-clamp-2 text-sm font-semibold text-white/85">{leadEntity}</div>
            </div>
        </div>

        {/* Chart */}
        <div>
            <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-white/80">
                Filing Trend History
                {loading && <Loader2 size={14} className="animate-spin text-[#00bdcd]" />}
            </h3>
            <div className="h-48 w-full rounded-2xl border border-white/10 bg-white/5 p-3">
                {trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={node.color} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={node.color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                  borderColor: 'rgba(255,255,255,0.12)',
                                  borderRadius: '12px',
                                  color: '#fff',
                                }}
                            />
                            <Area type="monotone" dataKey="count" stroke={node.color} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-xl text-xs text-white/40">
                        {loading ? 'Fetching data...' : 'No trend data available'}
                    </div>
                )}
            </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-[#00bdcd]/20 bg-[#00bdcd]/10 p-4">
             <h4 className="mb-1 text-sm font-medium text-[#7ce9f2]">Landscape Context</h4>
             <p className="text-xs leading-relaxed text-white/72">
                 {buildContextCopy(node)}
             </p>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/10 bg-slate-950/90 p-6">
        <button 
            onClick={() => navigate(`/technology/${node.id}`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00bdcd] py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-[#00a9b8]"
        >
            View Detailed Analysis
            <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SidePanel;
