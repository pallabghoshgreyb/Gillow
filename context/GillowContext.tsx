import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patent } from '../types';
import { PATENTS } from '../data/patents';

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  timestamp: number;
}

interface Notification {
  id: string;
  text: string;
  type: 'alert' | 'update' | 'saved';
  read: boolean;
  timestamp: number;
}

interface GillowContextType {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  searchHistory: string[];
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  comparisonList: string[];
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  notifications: Notification[];
  markRead: (id: string) => void;
  savedSearches: SavedSearch[];
  saveSearch: (name: string, query: string, filters: any) => void;
}

const GillowContext = createContext<GillowContextType | undefined>(undefined);

export const GillowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const favs = localStorage.getItem('GILLOW_FAVORITES');
      const hist = localStorage.getItem('GILLOW_HISTORY');
      const saved = localStorage.getItem('GILLOW_SAVED_SEARCHES');
      
      if (favs) setFavorites(JSON.parse(favs));
      if (hist) setSearchHistory(JSON.parse(hist));
      if (saved) setSavedSearches(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading localStorage state", e);
    }

    // Mock initial notifications for demo - keeping only the requested one
    const demoPatentNumber = PATENTS[0]?.publicationNumber || 'the latest patent';
    setNotifications([
      { id: '2', text: `Recent valuation update for ${demoPatentNumber}`, type: 'update', read: false, timestamp: Date.now() - 3600000 }
    ]);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('GILLOW_FAVORITES', JSON.stringify(next));
      return next;
    });
  };

  const addSearchHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const next = [query, ...prev.filter(q => q !== query)].slice(0, 8);
      localStorage.setItem('GILLOW_HISTORY', JSON.stringify(next));
      return next;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('GILLOW_HISTORY');
  };

  const addToComparison = (id: string) => {
    if (comparisonList.length >= 4) return; // Limit to 4 for UX
    setComparisonList(prev => [...new Set([...prev, id])]);
  };

  const removeFromComparison = (id: string) => {
    setComparisonList(prev => prev.filter(p => p !== id));
  };

  const clearComparison = () => setComparisonList([]);

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const saveSearch = (name: string, query: string, filters: any) => {
    const newSaved = { id: Date.now().toString(), name, query, filters, timestamp: Date.now() };
    setSavedSearches(prev => {
      const next = [newSaved, ...prev];
      localStorage.setItem('GILLOW_SAVED_SEARCHES', JSON.stringify(next));
      return next;
    });
  };

  return (
    <GillowContext.Provider value={{
      favorites, toggleFavorite,
      searchHistory, addSearchHistory, clearSearchHistory,
      comparisonList, addToComparison, removeFromComparison, clearComparison,
      notifications, markRead,
      savedSearches, saveSearch
    }}>
      {children}
    </GillowContext.Provider>
  );
};

export const useGillow = () => {
  const context = useContext(GillowContext);
  if (!context) throw new Error('useGillow must be used within a GillowProvider');
  return context;
};
