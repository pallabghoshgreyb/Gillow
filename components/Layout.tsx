import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, Heart, User, Building2, 
  Menu, Info, Bell, X, Trash2, Clock, 
  AlertCircle, ChevronRight, SlidersHorizontal, Map as MapIcon
} from 'lucide-react';
import { useGillow } from '../context/GillowContext';
import AdvancedSearchModal from './AdvancedSearchModal';
import ServerConfigModal from './ServerConfigModal';
import { api } from '../utils/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { notifications, markRead, searchHistory, clearSearchHistory, favorites } = useGillow();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      const query = searchValue.trim();
      // Check for exact patent ID match before redirecting to search results
      const patent = await api.getPatent(query);
      if (patent) {
        navigate(`/patent/${patent.id}`);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setShowSearchHistory(false);
      setSearchValue('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col min-h-screen w-full bg-white text-slate-900 font-sans">
      
      {/* Demo Banner */}
      <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 px-6 flex items-center justify-center gap-4 relative z-[60]">
          <span className="flex items-center gap-1.5 text-blue-400">
            <AlertCircle size={12} /> PROTOTYPE MODE
          </span>
          <span className="opacity-40">|</span>
          <span>SAMPLE DATA ONLY</span>
          <span className="opacity-40">|</span>
          <button 
            onClick={() => setIsServerConfigOpen(true)}
            className="underline hover:text-blue-400"
          >
            CONNECT TO BACKEND
          </button>
      </div>

      {/* Top Navigation */}
      <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex-shrink-0 z-50 sticky top-0 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between gap-6">
            
            <div className="flex items-center gap-10">
                <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-[#006AFF] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-all">
                        <span className="font-black text-white text-xl">G</span>
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">Gillow</span>
                </Link>

                <nav className="hidden xl:flex items-center space-x-8">
                    <NavLink to="/browse" className={({isActive}) => `text-sm font-black uppercase tracking-widest hover:text-[#006AFF] transition-colors ${isActive ? 'text-[#006AFF]' : 'text-slate-500'}`}>Marketplace</NavLink>
                    <NavLink to="/landscape" className={({isActive}) => `text-sm font-black uppercase tracking-widest hover:text-[#006AFF] transition-colors ${isActive ? 'text-[#006AFF]' : 'text-slate-500'}`}>Landscape</NavLink>
                    <button className="text-sm font-black uppercase tracking-widest text-slate-500 hover:text-[#006AFF] transition-colors">Valuation</button>
                </nav>
            </div>

            {/* Search Input Area */}
            <div className="flex-1 max-w-xl relative group hidden md:block">
                <form onSubmit={handleSearchSubmit}>
                    <div className="flex items-center border-2 border-slate-50 rounded-2xl px-5 py-2.5 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all cursor-pointer focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400 focus-within:bg-white shadow-inner">
                        <SearchIcon size={18} className="text-slate-400 mr-3" />
                        <input 
                            type="text" 
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onFocus={() => setShowSearchHistory(true)}
                            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                            placeholder="Search #US10123456, Tesla, AI..." 
                        />
                        <button 
                          type="button"
                          onClick={() => setIsAdvancedOpen(true)}
                          className="ml-2 p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                          title="Advanced Search"
                        >
                          <SlidersHorizontal size={16} />
                        </button>
                    </div>
                </form>

                {showSearchHistory && searchHistory.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-[70]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Recent History</span>
                            <button onClick={clearSearchHistory} className="text-[10px] font-black text-red-500 uppercase hover:underline">Clear all</button>
                        </div>
                        <div className="space-y-1">
                            {searchHistory.map((h, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => navigate(`/search?q=${encodeURIComponent(h)}`)}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                      <SearchIcon size={14} className="opacity-30" />
                                      {h}
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50 border border-transparent'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</span>
                                <button onClick={() => setShowNotifications(false)}><X size={16} className="text-slate-400" /></button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n.id} onClick={() => markRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'alert' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                                <div className="text-sm font-medium text-slate-700 leading-snug">{n.text}</div>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-black mt-2 ml-5 uppercase tracking-wider">Just now</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center text-slate-300 italic text-sm">No new alerts</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <NavLink to="/saved" className={({isActive}) => `w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${isActive ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-red-600 hover:bg-slate-50'}`}>
                    <Heart size={20} fill={favorites.length > 0 && window.location.hash.includes('saved') ? 'currentColor' : 'none'} />
                    {favorites.length > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-[#006AFF] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
                            {favorites.length}
                        </span>
                    )}
                </NavLink>

                <div className="h-8 w-px bg-slate-100 mx-2"></div>

                <button className="flex items-center gap-3 h-10 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                    <User size={16} />
                    <span className="hidden lg:inline">Sign In</span>
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>

      <footer className="bg-white text-slate-900 py-32 px-6 border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-24">
                  <div className="md:col-span-5">
                      <div className="flex items-center gap-2 mb-10">
                          <div className="w-10 h-10 rounded-xl bg-[#006AFF] flex items-center justify-center shadow-xl shadow-blue-200">
                              <span className="font-black text-white text-xl">G</span>
                          </div>
                          <span className="font-black text-2xl tracking-tighter">Gillow</span>
                      </div>
                      <p className="text-slate-400 max-w-sm mb-12 text-lg font-medium leading-relaxed">
                          Reimagining intellectual property management for the modern era. Navigate, value, and acquire patents with global transparency.
                      </p>
                      <div className="flex gap-4">
                          <SocialIcon icon="LinkedIn" />
                          <SocialIcon icon="X" />
                          <SocialIcon icon="Youtube" />
                      </div>
                  </div>

                  <div className="md:col-span-2">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Platform</h4>
                      <ul className="space-y-6 text-sm font-black text-slate-600">
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Marketplace</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Landscape</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">AI Valuation</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">API Docs</li>
                      </ul>
                  </div>

                  <div className="md:col-span-2">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Company</h4>
                      <ul className="space-y-6 text-sm font-black text-slate-600">
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Our Mission</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Security</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Privacy</li>
                          <li className="hover:text-[#006AFF] cursor-pointer transition-colors">Support</li>
                      </ul>
                  </div>

                  <div className="md:col-span-3">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Newsletter</h4>
                      <p className="text-sm text-slate-500 mb-6 font-medium">Get the latest on high-value portfolio listings.</p>
                      <div className="flex flex-col gap-3">
                        <input className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400" placeholder="your@email.com" />
                        <button className="bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Subscribe</button>
                      </div>
                  </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      © 2025 Gillow Intelligence • Built for Global IP Excellence
                  </div>
                  <div className="flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="cursor-pointer hover:text-slate-900">Term of Use</span>
                    <span className="cursor-pointer hover:text-slate-900">Compliance</span>
                    <span className="cursor-pointer hover:text-slate-900">Patent Search API</span>
                  </div>
              </div>
          </div>
      </footer>

      <AdvancedSearchModal 
        isOpen={isAdvancedOpen} 
        onClose={() => setIsAdvancedOpen(false)} 
        onSearch={(filters) => {
          navigate(`/search?q=${encodeURIComponent(searchValue)}&adv=true`);
        }}
      />

      <ServerConfigModal 
        isOpen={isServerConfigOpen} 
        onClose={() => setIsServerConfigOpen(false)} 
      />
    </div>
  );
};

const SocialIcon = ({ icon }: { icon: string }) => (
  <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#006AFF] hover:text-white hover:-translate-y-1 transition-all">
    <span className="text-[10px] font-black uppercase tracking-tighter">{icon[0]}</span>
  </button>
);

export default Layout;