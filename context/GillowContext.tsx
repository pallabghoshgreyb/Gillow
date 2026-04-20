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

const NOTIFICATION_READ_KEY = 'GILLOW_NOTIFICATION_READ_IDS';

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeMaintenanceSignal = (value?: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === '-') return '';
  if (normalized.includes('not due')) return '';
  if (normalized.includes('unpaid') || normalized.includes('overdue') || normalized.includes('late')) {
    return String(value).trim();
  }
  if (normalized === 'due' || normalized.includes('due')) {
    return String(value).trim();
  }
  return '';
};

const getMaintenanceAlerts = (patent: Patent) =>
  [
    { label: '3.5 year', value: patent.maintenanceFees.year3_5Text },
    { label: '7.5 year', value: patent.maintenanceFees.year7_5Text },
    { label: '11.5 year', value: patent.maintenanceFees.year11_5Text },
  ]
    .map(({ label, value }) => {
      const status = normalizeMaintenanceSignal(value);
      return status ? `${label} (${status})` : '';
    })
    .filter(Boolean);

const createPatentNotifications = (
  patents: Patent[],
  favorites: string[],
  savedSearches: SavedSearch[],
  readIds: string[]
): Notification[] => {
  const notifications: Notification[] = [];
  const readSet = new Set(readIds);
  const favoriteSet = new Set(favorites);

  const pushNotification = (notification: Omit<Notification, 'read'>) => {
    notifications.push({
      ...notification,
      read: readSet.has(notification.id),
    });
  };

  patents
    .map((patent) => ({
      patent,
      alerts: getMaintenanceAlerts(patent),
    }))
    .filter(({ patent, alerts }) => alerts.length > 0 || patent.maintenanceFees.totalPending > 0)
    .sort((left, right) => {
      const leftWeight = left.alerts.length + (left.patent.maintenanceFees.totalPending > 0 ? 1 : 0);
      const rightWeight = right.alerts.length + (right.patent.maintenanceFees.totalPending > 0 ? 1 : 0);
      if (leftWeight !== rightWeight) return rightWeight - leftWeight;
      return right.patent.maintenanceFees.totalPending - left.patent.maintenanceFees.totalPending;
    })
    .slice(0, 2)
    .forEach(({ patent, alerts }) => {
      const pendingAmount = patent.maintenanceFees.totalPending > 0
        ? ` Pending amount: $${patent.maintenanceFees.totalPending.toLocaleString()}.`
        : '';
      const alertText = alerts.length > 0
        ? `maintenance fee action on ${alerts.join(', ')}`
        : 'pending maintenance fees';

      pushNotification({
        id: `maintenance-${patent.publicationNumber}`,
        text: `${patent.publicationNumber} has ${alertText}.${pendingAmount}`,
        type: 'alert',
        timestamp: toTimestamp(patent.estimatedExpirationDate),
      });
    });

  patents
    .filter((patent) => patent.flags.litigation || patent.flags.ptab || patent.flags.opposition)
    .slice(0, 2)
    .forEach((patent) => {
      const signal = patent.flags.litigation
        ? 'litigation activity'
        : patent.flags.ptab
          ? 'PTAB review'
          : 'opposition activity';

      pushNotification({
        id: `dispute-${patent.publicationNumber}`,
        text: `${patent.publicationNumber} is flagged for ${signal}.`,
        type: 'alert',
        timestamp: toTimestamp(patent.publicationDate),
      });
    });

  patents
    .filter((patent) => patent.licensingStatus === 'Available' || patent.licensingStatus === 'Under Negotiation')
    .slice(0, 2)
    .forEach((patent) => {
      const priceText = patent.askingPrice ? ` Asking price: $${patent.askingPrice.toLocaleString()}.` : '';
      pushNotification({
        id: `licensing-${patent.publicationNumber}`,
        text: `${patent.publicationNumber} is ${patent.licensingStatus.toLowerCase()}.${priceText}`,
        type: 'update',
        timestamp: toTimestamp(patent.publicationDate),
      });
    });

  patents
    .filter((patent) => patent.simpleLegalStatus === 'Dead' || favoriteSet.has(patent.publicationNumber))
    .slice(0, 3)
    .forEach((patent) => {
      if (favoriteSet.has(patent.publicationNumber)) {
        pushNotification({
          id: `favorite-${patent.publicationNumber}`,
          text: `${patent.publicationNumber} is on your watchlist with status ${patent.simpleLegalStatus || patent.legalStatus}.`,
          type: 'update',
          timestamp: toTimestamp(patent.publicationDate) || Date.now(),
        });
        return;
      }

      pushNotification({
        id: `status-${patent.publicationNumber}`,
        text: `${patent.publicationNumber} is marked ${patent.legalStatus} and no longer active.`,
        type: 'alert',
        timestamp: toTimestamp(patent.publicationDate),
      });
    });

  patents
    .slice()
    .sort((left, right) => toTimestamp(right.publicationDate) - toTimestamp(left.publicationDate))
    .slice(0, 2)
    .forEach((patent) => {
      pushNotification({
        id: `publication-${patent.publicationNumber}`,
        text: `${patent.publicationNumber} published in ${patent.domain || 'its technology domain'}.`,
        type: 'update',
        timestamp: toTimestamp(patent.publicationDate),
      });
    });

  savedSearches.slice(0, 2).forEach((savedSearch) => {
    pushNotification({
      id: `saved-search-${savedSearch.id}`,
      text: `Saved search "${savedSearch.name}" is ready for reuse.`,
      type: 'saved',
      timestamp: savedSearch.timestamp,
    });
  });

  return notifications
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 8);
};

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
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const favs = localStorage.getItem('GILLOW_FAVORITES');
      const hist = localStorage.getItem('GILLOW_HISTORY');
      const saved = localStorage.getItem('GILLOW_SAVED_SEARCHES');
      const readIds = localStorage.getItem(NOTIFICATION_READ_KEY);
      
      if (favs) setFavorites(JSON.parse(favs));
      if (hist) setSearchHistory(JSON.parse(hist));
      if (saved) setSavedSearches(JSON.parse(saved));
      if (readIds) setReadNotificationIds(JSON.parse(readIds));
    } catch (e) {
      console.error("Error loading localStorage state", e);
    }
  }, []);

  useEffect(() => {
    setNotifications(createPatentNotifications(PATENTS, favorites, savedSearches, readNotificationIds));
  }, [favorites, savedSearches, readNotificationIds]);

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
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(next));
      return next;
    });
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
