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

  return (
    <div className="fixed top-16 right-0 bottom-0 w-full md:w-[450px] bg-white border-l border-slate-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-start">
        <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{node.domain}</div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{node.name}</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <FileText size={16} />
                    <span className="text-xs uppercase font-semibold">Volume</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{node.patentCount.toLocaleString()}</div>
                <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                    <TrendingUp size={12} />
                    +{node.growth}% Growth
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Building2 size={16} />
                    <span className="text-xs uppercase font-semibold">Lead Entity</span>
                </div>
                <div className="text-sm font-bold text-slate-800 line-clamp-2">{node.topAssignee}</div>
            </div>
        </div>

        {/* Chart */}
        <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                Filing Trend History
                {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </h3>
            <div className="h-48 w-full">
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
                                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                            />
                            <Area type="monotone" dataKey="count" stroke={node.color} strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg text-slate-400 text-xs">
                        {loading ? 'Fetching data...' : 'No trend data available'}
                    </div>
                )}
            </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
             <h4 className="text-sm font-bold text-blue-800 mb-1">Landscape Context</h4>
             <p className="text-xs text-blue-700 leading-relaxed">
                 {node.level === TechLevel.DOMAIN
                   ? `${node.name} is a primary technology domain in this landscape.`
                   : `${node.name} is a key level 2 subdomain within ${node.domain}.`}
                 {' '}This segment is currently showing strong momentum with {node.topAssignee} maintaining a dominant position.
             </p>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <button 
            onClick={() => navigate(`/technology/${node.id}`)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
        >
            View Detailed Analysis
            <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SidePanel;
