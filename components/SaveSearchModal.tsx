import React, { useState } from 'react';
import { X, Bell, Save, CheckCircle2 } from 'lucide-react';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentFiltersCount: number;
}

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({ isOpen, onClose, onSave, currentFiltersCount }) => {
  const [name, setName] = useState('');
  const [notify, setNotify] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-900">Save this search</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">
            We'll save your current criteria ({currentFiltersCount} filters applied) to your profile for quick access later.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search Name</label>
            <input 
              type="text" 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AI Patents in Palo Alto"
              className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-[#00bdcd] outline-none transition-all font-medium"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-5 h-5 rounded border-blue-200 text-[#00bdcd] focus:ring-[#00bdcd]"
            />
            <div className="flex-1">
              <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Bell size={14} /> Email notifications
              </div>
              <div className="text-xs text-blue-700/70">Alert me when new matching patents are listed</div>
            </div>
          </label>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={!name.trim()}
            onClick={() => { onSave(name); onClose(); }}
            className="flex-1 px-4 py-3 bg-[#00bdcd] text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Save size={18} /> Save Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSearchModal;