import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PATENTS } from '../data/patents';

interface SearchAutocompleteProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ onSearch, placeholder, className }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => {
    const subdomains = PATENTS
      .map((patent) => patent.subdomain)
      .filter(Boolean) as string[];
    const assignees = PATENTS.flatMap((patent) => patent.currentAssignees).filter(Boolean);
    return Array.from(new Set([...subdomains, ...assignees])).sort();
  }, []);
  const filteredSuggestions = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return suggestions.slice(0, 8);
    return suggestions.filter((suggestion) => suggestion.toLowerCase().includes(trimmedQuery)).slice(0, 8);
  }, [query, suggestions]);

  const handleSearch = (q: string) => {
    setQuery(q);
    onSearch(q);
    setIsFocused(false);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <Search className={`absolute left-5 transition-colors duration-300 ${isFocused ? 'text-[#00bdcd]' : 'text-slate-400'}`} size={22} />
        <input 
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={placeholder || "Search patents by ID, title, or tech..."}
          className="w-full h-16 pl-14 pr-16 bg-white border-2 border-slate-100 rounded-full shadow-xl shadow-slate-200/50 text-slate-800 text-lg font-medium outline-none focus:border-[#00bdcd] transition-all placeholder-slate-400"
        />
        {query && (
          <button onClick={() => handleSearch('')} className="absolute right-14 text-slate-300 hover:text-slate-500">
            <X size={18} />
          </button>
        )}
        <button 
          onClick={() => handleSearch(query)}
          className="absolute right-2 top-2 h-12 w-12 bg-[#00bdcd] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95"
        >
          <Search size={24} />
        </button>
      </div>

      {isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Suggested Subdomains & Assignees
          </div>
          <div className="space-y-1">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSearch(suggestion);
                }}
                className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <span>{suggestion}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Search</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
