import React, { useState, useEffect } from 'react';
import TechMap from '../components/TechMap';
import SidePanel from '../components/SidePanel';
import { TechNode } from '../types';
import { api } from '../utils/api';
import { Info, Sparkles, Filter, ChevronRight } from 'lucide-react';

const Landscape: React.FC = () => {
  const [nodes, setNodes] = useState<TechNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLayerGuide, setShowLayerGuide] = useState(true);

  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      const data = await api.getTechnologies();
      setNodes(data);
      setLoading(false);
    };
    loadNodes();
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50">
      {/* Landscape Header */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex flex-col gap-2 md:left-4 md:right-4 md:top-4 md:flex-row md:justify-between md:items-start">
        <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 shadow-lg backdrop-blur-md">
          <nav className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Marketplace</span>
            <ChevronRight size={12} />
            <span className="text-slate-900">Landscape Explorer</span>
          </nav>
          <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight text-slate-900 md:text-2xl">
            <Sparkles size={20} className="text-blue-600" /> Technology Universe
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Discover technical clusters based on patent density and filing momentum.</p>
        </div>

        <div className="pointer-events-auto flex flex-row gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowLayerGuide((value) => !value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md transition-all ${
              showLayerGuide
                ? 'border-blue-200 bg-blue-50/90 text-blue-700 hover:bg-blue-50'
                : 'border-slate-200 bg-white/88 text-slate-600 hover:bg-white'
            }`}
          >
            <Filter size={16} /> {showLayerGuide ? 'Layer Guide On' : 'Advanced Layering'}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Patent Tracking</span>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 min-h-0 w-full p-2 md:p-4">
        {loading ? (
          <div className="w-full h-full rounded-[2rem] flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapping Technical Clusters...</span>
          </div>
        ) : (
          <TechMap 
            nodes={nodes} 
            onSelectNode={setSelectedNode} 
            selectedNodeId={selectedNode?.id || null} 
            showLegend={showLayerGuide}
          />
        )}
      </div>

      {showLayerGuide && !loading && (
        <div className="pointer-events-none absolute right-4 top-20 z-20 hidden max-w-xs rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md lg:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Layering Guide</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
            Domain peaks stay visible from the overview. Zoom deeper to reveal subdomain clusters and click any label to center that zone.
          </p>
        </div>
      )}

      {/* Floating Panel for Selection */}
      <SidePanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

      {/* Macro Info Overlay */}
      {!selectedNode && (
        <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white/80 px-6 py-3 shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-1000 lg:flex">
          <Info size={16} className="text-blue-600" />
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Select a cluster peak to analyze portfolio depth and assignee dominance
          </p>
        </div>
      )}
    </div>
  );
};

export default Landscape;
