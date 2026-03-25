import React, { useState, useEffect } from 'react';
import { X, Server, Save, RotateCcw } from 'lucide-react';
import { getServerUrl, setServerUrl } from '../utils/api';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getServerUrl() || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    setServerUrl(url);
    window.location.reload(); 
  };

  const handleReset = () => {
    setUrl('');
    setServerUrl('');
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                    <Server size={18} />
                </div>
                Connect PatentXchange Backend
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
                Enter your FastAPI server URL (e.g., <code>http://localhost:8000</code>). The app will automatically connect to your PostgreSQL database through the PatentXchange API.
            </p>
            
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Server Base URL</label>
                <input 
                    type="text" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Connected Endpoints:</h4>
                <ul className="text-[10px] space-y-1 font-mono text-slate-400">
                    <li>GET /api/technologies/</li>
                    <li>GET /api/technologies/map</li>
                    <li>GET /api/patents/</li>
                </ul>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
                <RotateCcw size={16} />
                Clear Config
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <Save size={16} />
                Connect & Reload
            </button>
        </div>

      </div>
    </div>
  );
};

export default ServerConfigModal;
