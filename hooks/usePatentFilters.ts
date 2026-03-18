
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PATENTS } from '../data/patents';
import { Patent } from '../types';

export interface FilterState {
  categories: string[];
  subCategories: string[];
  statuses: string[];
  patentTypes: string[];
  assigneeTypes: string[];
  minValuation: number;
  maxValuation: number;
  minClaims: number;
  minCitations: number;
  minFamilySize: number;
  startYear: string;
  endYear: string;
  litigation: 'all' | 'include' | 'exclude';
  sortBy: 'relevance' | 'newest' | 'price-low' | 'price-high' | 'citations';
}

export const usePatentFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const query = searchParams.get('q') || '';
  
  const filters = useMemo((): FilterState => {
    return {
      categories: searchParams.getAll('category'),
      subCategories: searchParams.getAll('sub'),
      statuses: searchParams.getAll('status'),
      patentTypes: searchParams.getAll('type'),
      assigneeTypes: searchParams.getAll('assigneeType'),
      minValuation: Number(searchParams.get('minV')) || 0,
      maxValuation: Number(searchParams.get('maxV')) || 50000000,
      minClaims: Number(searchParams.get('minC')) || 0,
      minCitations: Number(searchParams.get('minCit')) || 0,
      minFamilySize: Number(searchParams.get('minFam')) || 0,
      startYear: searchParams.get('startY') || '1990',
      endYear: searchParams.get('endY') || '2024',
      litigation: (searchParams.get('lit') as any) || 'all',
      sortBy: (searchParams.get('sort') as any) || 'relevance',
    };
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const next = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    
    next.categories.forEach(c => params.append('category', c));
    next.subCategories.forEach(s => params.append('sub', s));
    next.statuses.forEach(s => params.append('status', s));
    next.patentTypes.forEach(t => params.append('type', t));
    next.assigneeTypes.forEach(a => params.append('assigneeType', a));
    
    if (next.minValuation > 0) params.set('minV', next.minValuation.toString());
    if (next.maxValuation < 50000000) params.set('maxV', next.maxValuation.toString());
    if (next.minClaims > 0) params.set('minC', next.minClaims.toString());
    // Fix: next.minCit should be next.minCitations and next.minFam should be next.minFamilySize
    if (next.minCitations > 0) params.set('minCit', next.minCitations.toString());
    if (next.minFamilySize > 0) params.set('minFam', next.minFamilySize.toString());
    if (next.startYear !== '1990') params.set('startY', next.startYear);
    if (next.endYear !== '2024') params.set('endY', next.endYear);
    if (next.litigation !== 'all') params.set('lit', next.litigation);
    
    params.set('sort', next.sortBy);
    setSearchParams(params);
  };

  const setQuery = (q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q);
    else params.delete('q');
    setSearchParams(params);
  };

  const filteredPatents = useMemo(() => {
    let result = [...PATENTS];

    if (query) {
      const q = query.toLowerCase();
      const exactMatch = result.find(p => p.id.toLowerCase() === q || p.applicationNumber.toLowerCase() === q);
      if (exactMatch) return [exactMatch];

      result = result.filter(p => 
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.assignee.name.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.subdomain.toLowerCase().includes(q)
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.domain));
    }

    if (filters.subCategories.length > 0) {
      result = result.filter(p => filters.subCategories.includes(p.subdomain));
    }
    
    if (filters.statuses.length > 0) {
      result = result.filter(p => filters.statuses.includes(p.legalStatus));
    }

    if (filters.patentTypes.length > 0) {
      result = result.filter(p => filters.patentTypes.includes(p.patentType));
    }

    if (filters.assigneeTypes.length > 0) {
      result = result.filter(p => filters.assigneeTypes.includes(p.assignee.type));
    }

    result = result.filter(p => 
      p.valuation.current >= filters.minValuation && 
      p.valuation.current <= filters.maxValuation &&
      p.totalClaims >= filters.minClaims &&
      p.forwardCitationsCount >= filters.minCitations &&
      p.familySize >= filters.minFamilySize
    );

    const start = parseInt(filters.startYear);
    const end = parseInt(filters.endYear);
    result = result.filter(p => {
      const filingYear = new Date(p.filingDate).getFullYear();
      return filingYear >= start && filingYear <= end;
    });

    if (filters.litigation === 'include') {
      result = result.filter(p => p.flags.litigation === true);
    } else if (filters.litigation === 'exclude') {
      result = result.filter(p => p.flags.litigation === false);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest': {
          const timeB = new Date(b.filingDate).getTime() || 0;
          const timeA = new Date(a.filingDate).getTime() || 0;
          return timeB - timeA;
        }
        case 'price-low': return (a.askingPrice || 0) - (b.askingPrice || 0);
        case 'price-high': return (b.askingPrice || 0) - (a.askingPrice || 0);
        case 'citations': return b.forwardCitationsCount - a.forwardCitationsCount;
        default: return 0;
      }
    });

    return result;
  }, [query, filters]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return {
    filters,
    updateFilters,
    filteredPatents,
    loading,
    query,
    setQuery,
    resetFilters: () => setSearchParams(new URLSearchParams())
  };
};
