import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchAutocompleteProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ onSearch, placeholder, className }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (q: string) => {
    setQuery(q);
    onSearch(q);
    setIsFocused(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <Search className={`absolute left-5 transition-colors duration-300 ${isFocused ? 'text-[#006AFF]' : 'text-slate-400'}`} size={22} />
        <input 
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
          placeholder={placeholder || "Search patents by ID, title, or tech..."}
          className="w-full h-16 pl-14 pr-16 bg-white border-2 border-slate-100 rounded-full shadow-xl shadow-slate-200/50 text-slate-800 text-lg font-medium outline-none focus:border-[#006AFF] transition-all placeholder-slate-400"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-14 text-slate-300 hover:text-slate-500">
            <X size={18} />
          </button>
        )}
        <button 
          onClick={() => handleSearch(query)}
          className="absolute right-2 top-2 h-12 w-12 bg-[#006AFF] text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95"
        >
          <Search size={24} />
        </button>
      </div>
    </div>
  );
};

export default SearchAutocomplete;