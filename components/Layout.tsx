import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, Heart, User, Building2, 
  Menu, Info, Bell, X, Trash2, Clock, 
  AlertCircle, ChevronRight, SlidersHorizontal, Map as MapIcon
} from 'lucide-react';
import { useGillow } from '../context/GillowContext';
import AdvancedSearchModal, { type AdvancedSearchFormData } from './AdvancedSearchModal';
import ServerConfigModal from './ServerConfigModal';
import { api } from '../utils/api';
import { PATENTS } from '../data/patents';

interface LayoutProps {
  children: React.ReactNode;
}

interface InfoDialogState {
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: 'home' | 'browse' | 'landscape' | 'server-config' | 'sample-patent';
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { notifications, markRead, searchHistory, clearSearchHistory, favorites } = useGillow();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [infoDialog, setInfoDialog] = useState<InfoDialogState | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isLandscapePage = location.pathname === '/landscape';
  const searchSuggestions = useMemo(() => {
    const publicationNumbers = PATENTS.map((patent) => patent.publicationNumber).filter(Boolean) as string[];
    const subdomains = PATENTS.map((patent) => patent.subdomain).filter(Boolean) as string[];
    const assignees = PATENTS.flatMap((patent) => patent.currentAssignees).filter(Boolean);
    return Array.from(new Set([...publicationNumbers, ...subdomains, ...assignees])).sort();
  }, []);
  const filteredSuggestions = useMemo(() => {
    const trimmedQuery = searchValue.trim().toLowerCase();
    if (!trimmedQuery) return searchSuggestions.slice(0, 8);
    return searchSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(trimmedQuery)).slice(0, 8);
  }, [searchSuggestions, searchValue]);
  const advancedSearchInitialValues = useMemo<AdvancedSearchFormData>(() => {
    const params = new URLSearchParams(location.search);
    const searchIn = params.getAll('in');

    return {
      booleanMode: params.get('mode') === 'or' ? 'OR' : 'AND',
      searchIn: searchIn.length > 0 ? (searchIn as AdvancedSearchFormData['searchIn']) : ['title', 'abstract', 'inventor', 'assignee', 'domain', 'subdomain'],
      minValuation: Math.floor((Number(params.get('minV')) || 0) / 1000000),
      minCitations: Number(params.get('minCit')) || 0,
      minClaims: Number(params.get('minC')) || 0,
      excludeExpired: params.get('alive') === '1',
      jurisdiction: params.get('jur') || 'All',
    };
  }, [location.search]);
  const formatNotificationAge = (timestamp: number) => {
    const delta = Math.max(0, Date.now() - timestamp);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (delta < minute) return 'Just now';
    if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
    if (delta < day) return `${Math.floor(delta / hour)}h ago`;
    if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  useEffect(() => {
    setShowNotifications(false);
    setShowSearchHistory(false);
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur?.();
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setShowSearchHistory(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!newsletterStatus) return;
    const timer = window.setTimeout(() => setNewsletterStatus(''), 3000);
    return () => window.clearTimeout(timer);
  }, [newsletterStatus]);

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

  const handleSuggestionSelect = async (value: string) => {
    setSearchValue(value);
    const patent = await api.getPatent(value);
    if (patent) {
      navigate(`/patent/${patent.id}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
    setShowSearchHistory(false);
    setSearchValue('');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const runInfoAction = (actionType?: InfoDialogState['actionType']) => {
    setInfoDialog(null);

    if (actionType === 'home') {
      navigate('/');
      return;
    }

    if (actionType === 'browse') {
      navigate('/browse');
      return;
    }

    if (actionType === 'landscape') {
      navigate('/landscape');
      return;
    }

    if (actionType === 'server-config') {
      setIsServerConfigOpen(true);
      return;
    }

    if (actionType === 'sample-patent' && PATENTS[0]) {
      navigate(`/patent/${PATENTS[0].publicationNumber}`);
    }
  };

  const handleNewsletterSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedEmail = newsletterEmail.trim();

    if (!trimmedEmail) {
      setNewsletterStatus('Enter an email address first.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setNewsletterStatus('Use a valid email address.');
      return;
    }

    setNewsletterStatus(`Subscribed ${trimmedEmail}`);
    setNewsletterEmail('');
  };

  const openShareWindow = (platform: 'linkedin' | 'x') => {
    const pageUrl = encodeURIComponent(window.location.href);
    const pageText = encodeURIComponent('Explore this patent intelligence view on PatentXchange');
    const targetUrl =
      platform === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`
        : `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageText}`;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex w-full bg-white text-slate-900 font-sans ${isLandscapePage ? 'h-screen overflow-hidden flex-col' : 'min-h-screen flex-col'}`}>
      
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
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    setShowSearchHistory(false);
                    navigate('/');
                  }}
                  className="flex items-center gap-2 group flex-shrink-0"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#00bdcd] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-all">
                        <span className="font-black text-white text-xl">G</span>
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">PatentXchange</span>
                </button>

                <nav className="hidden xl:flex items-center space-x-8">
                    <NavLink to="/browse" className={({isActive}) => `text-sm font-black uppercase tracking-widest hover:text-[#00bdcd] transition-colors ${isActive ? 'text-[#00bdcd]' : 'text-slate-500'}`}>Marketplace</NavLink>
                    <NavLink to="/landscape" className={({isActive}) => `text-sm font-black uppercase tracking-widest hover:text-[#00bdcd] transition-colors ${isActive ? 'text-[#00bdcd]' : 'text-slate-500'}`}>Landscape</NavLink>
                </nav>
            </div>

            {/* Search Input Area */}
            <div ref={searchContainerRef} className="flex-1 max-w-xl relative group hidden md:block">
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
                            placeholder="Search subdomains or assignees..." 
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

                {showSearchHistory && (filteredSuggestions.length > 0 || searchHistory.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-[70]">
                        {filteredSuggestions.length > 0 && (
                          <>
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><SearchIcon size={12}/> Suggested Matches</span>
                            </div>
                            <div className="space-y-1 mb-3">
                              {filteredSuggestions.map((suggestion) => (
                                <button 
                                    key={suggestion}
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      void handleSuggestionSelect(suggestion);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                      <SearchIcon size={14} className="opacity-30" />
                                      {suggestion}
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {searchHistory.length > 0 && (
                          <>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Recent History</span>
                                <button onMouseDown={(event) => event.preventDefault()} onClick={clearSearchHistory} className="text-[10px] font-black text-red-500 uppercase hover:underline">Clear all</button>
                            </div>
                            <div className="space-y-1">
                              {searchHistory.map((h, i) => (
                                  <button 
                                      key={i} 
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => {
                                        setShowSearchHistory(false);
                                        navigate(`/search?q=${encodeURIComponent(h)}`);
                                      }}
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
                          </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <div ref={notificationsRef} className="relative">
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
                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'alert' ? 'bg-blue-500' : n.type === 'saved' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <div className="text-sm font-medium text-slate-700 leading-snug">{n.text}</div>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-black mt-2 ml-5 uppercase tracking-wider">{formatNotificationAge(n.timestamp)}</div>
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
                        <span className="absolute top-0 right-0 w-4 h-4 bg-[#00bdcd] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white translate-x-1/4 -translate-y-1/4">
                            {favorites.length}
                        </span>
                    )}
                </NavLink>

                <div className="h-8 w-px bg-slate-100 mx-2"></div>

                <button
                  onClick={() => setInfoDialog({
                    title: 'Sign In',
                    description: 'Authentication is not enabled in this prototype yet. You can still explore search, landscape, exports, and patent detail workflows right now.',
                    actionLabel: 'Open Marketplace',
                    actionType: 'browse',
                  })}
                  className="flex items-center gap-3 h-10 px-6 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                    <User size={16} />
                    <span className="hidden lg:inline">Sign In</span>
                </button>
            </div>
        </div>
      </header>

      <main
        key={`${location.pathname}${location.search}`}
        className={`flex flex-col min-w-0 ${isLandscapePage ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1'}`}
      >
        {children}
      </main>

      {!isLandscapePage && (
      <footer className="bg-white text-slate-900 py-32 px-6 border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 mb-24">
                  <div className="md:col-span-5">
                      <div className="flex items-center gap-2 mb-10">
                          <div className="w-10 h-10 rounded-xl bg-[#00bdcd] flex items-center justify-center shadow-xl shadow-blue-200">
                              <span className="font-black text-white text-xl">G</span>
                          </div>
                          <span className="font-black text-2xl tracking-tighter">PatentXchange</span>
                      </div>
                      <p className="text-slate-400 max-w-sm mb-12 text-lg font-medium leading-relaxed">
                          Reimagining intellectual property management for the modern era. Navigate, value, and acquire patents with global transparency.
                      </p>
                      <div className="flex gap-4">
                          <SocialIcon icon="LinkedIn" label="Share on LinkedIn" onClick={() => openShareWindow('linkedin')} />
                          <SocialIcon icon="X" label="Share on X" onClick={() => openShareWindow('x')} />
                          <SocialIcon
                            icon="Youtube"
                            label="Open product tour info"
                            onClick={() => setInfoDialog({
                              title: 'Video Tours',
                              description: 'Recorded product walkthroughs are not published yet, but the live Landscape and Marketplace pages are ready to explore.',
                              actionLabel: 'Open Landscape',
                              actionType: 'landscape',
                            })}
                          />
                      </div>
                  </div>

                  <div className="md:col-span-2">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Platform</h4>
                      <ul className="space-y-6 text-sm font-black text-slate-600">
                          <li><button onClick={() => navigate('/browse')} className="hover:text-[#00bdcd] transition-colors">Marketplace</button></li>
                          <li><button onClick={() => navigate('/landscape')} className="hover:text-[#00bdcd] transition-colors">Landscape</button></li>
                          <li><button onClick={() => setInfoDialog({ title: 'AI Valuation', description: 'Valuation insights are available inside each patent detail page, including pricing, quality score, and risk context.', actionLabel: 'Open Sample Patent', actionType: 'sample-patent' })} className="hover:text-[#00bdcd] transition-colors">AI Valuation</button></li>
                          <li><button onClick={() => setIsServerConfigOpen(true)} className="hover:text-[#00bdcd] transition-colors">API Docs</button></li>
                      </ul>
                  </div>

                  <div className="md:col-span-2">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Company</h4>
                      <ul className="space-y-6 text-sm font-black text-slate-600">
                          <li><button onClick={() => setInfoDialog({ title: 'Our Mission', description: 'PatentXchange helps teams explore patent landscapes, evaluate portfolio strength, and move from discovery to transaction faster.', actionLabel: 'Go Home', actionType: 'home' })} className="hover:text-[#00bdcd] transition-colors">Our Mission</button></li>
                          <li><button onClick={() => setInfoDialog({ title: 'Security', description: 'This prototype runs on local sample data and browser storage. Backend connectivity is optional and can be configured from the server connection panel.', actionLabel: 'Open Server Config', actionType: 'server-config' })} className="hover:text-[#00bdcd] transition-colors">Security</button></li>
                          <li><button onClick={() => setInfoDialog({ title: 'Privacy', description: 'Search history, favorites, and saved searches are currently stored in your browser for this prototype session.', actionLabel: 'Open Marketplace', actionType: 'browse' })} className="hover:text-[#00bdcd] transition-colors">Privacy</button></li>
                          <li><button onClick={() => { window.location.href = 'mailto:support@gillow.ai?subject=PatentXchange%20Support'; }} className="hover:text-[#00bdcd] transition-colors">Support</button></li>
                      </ul>
                  </div>

                  <div className="md:col-span-3">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-10">Newsletter</h4>
                      <p className="text-sm text-slate-500 mb-6 font-medium">Get the latest on high-value portfolio listings.</p>
                      <form onSubmit={handleNewsletterSubscribe} className="flex flex-col gap-3">
                        <input
                          value={newsletterEmail}
                          onChange={(event) => setNewsletterEmail(event.target.value)}
                          className="px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-400"
                          placeholder="your@email.com"
                        />
                        <button type="submit" className="bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Subscribe</button>
                        {newsletterStatus && (
                          <p className="text-xs font-bold text-blue-600">{newsletterStatus}</p>
                        )}
                      </form>
                  </div>
              </div>

              <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      © 2025 PatentXchange • Built for Global IP Excellence
                  </div>
                  <div className="flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <button onClick={() => setInfoDialog({ title: 'Terms of Use', description: 'This prototype is intended for evaluation workflows with sample data. Final legal terms can be added once production authentication and backend policies are in place.' })} className="hover:text-slate-900">Term of Use</button>
                    <button onClick={() => setInfoDialog({ title: 'Compliance', description: 'Compliance workflows depend on your connected backend and data source policies. Use the server configuration panel to point the app at your approved systems.', actionLabel: 'Open Server Config', actionType: 'server-config' })} className="hover:text-slate-900">Compliance</button>
                    <button onClick={() => setIsServerConfigOpen(true)} className="hover:text-slate-900">Patent Search API</button>
                  </div>
              </div>
          </div>
      </footer>
      )}

      {infoDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">PatentXchange</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{infoDialog.title}</h3>
              </div>
              <button onClick={() => setInfoDialog(null)} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{infoDialog.description}</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setInfoDialog(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                Close
              </button>
              {infoDialog.actionLabel && (
                <button onClick={() => runInfoAction(infoDialog.actionType)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800">
                  {infoDialog.actionLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AdvancedSearchModal 
        isOpen={isAdvancedOpen} 
        onClose={() => setIsAdvancedOpen(false)} 
        initialValues={advancedSearchInitialValues}
        onSearch={(filters) => {
          const params = new URLSearchParams();
          const effectiveQuery = searchValue.trim() || new URLSearchParams(location.search).get('q')?.trim() || '';

          if (effectiveQuery) {
            params.set('q', effectiveQuery);
          }

          if (filters.booleanMode === 'OR') {
            params.set('mode', 'or');
          }

          filters.searchIn.forEach((field) => params.append('in', field));

          if (filters.minValuation > 0) {
            params.set('minV', String(filters.minValuation * 1000000));
          }

          if (filters.minCitations > 0) {
            params.set('minCit', String(filters.minCitations));
          }

          if (filters.minClaims > 0) {
            params.set('minC', String(filters.minClaims));
          }

          if (filters.excludeExpired) {
            params.set('alive', '1');
          }

          if (filters.jurisdiction !== 'All') {
            params.set('jur', filters.jurisdiction);
          }

          navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
        }}
      />

      <ServerConfigModal 
        isOpen={isServerConfigOpen} 
        onClose={() => setIsServerConfigOpen(false)} 
      />
    </div>
  );
};

const SocialIcon = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#00bdcd] hover:text-white hover:-translate-y-1 transition-all"
  >
    <span className="text-[10px] font-black uppercase tracking-tighter">{icon[0]}</span>
  </button>
);

export default Layout;

