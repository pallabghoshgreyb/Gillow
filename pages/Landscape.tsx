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
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50 relative">
      {/* Landscape Header */}
      <div className="absolute top-6 left-6 right-6 z-20 pointer-events-none flex justify-between items-start">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl pointer-events-auto">
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>Marketplace</span>
            <ChevronRight size={12} />
            <span className="text-slate-900">Landscape Explorer</span>
          </nav>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles size={24} className="text-blue-600" /> Technology Universe
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Discover technical clusters based on patent density and filing momentum.</p>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <button className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg flex items-center gap-3 hover:bg-white transition-all text-slate-600 font-bold text-xs uppercase tracking-widest">
            <Filter size={16} /> Advanced Layering
          </button>
          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live Patent Tracking</span>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full h-full">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapping Technical Clusters...</span>
          </div>
        ) : (
          <TechMap 
            nodes={nodes} 
            onSelectNode={setSelectedNode} 
            selectedNodeId={selectedNode?.id || null} 
          />
        )}
      </div>

      {/* Floating Panel for Selection */}
      <SidePanel 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
      />

      {/* Macro Info Overlay */}
      {!selectedNode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000">
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