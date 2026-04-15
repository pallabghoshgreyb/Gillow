
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PATENTS } from '../data/patents';
import { Patent } from '../types';
import type { AdvancedSearchField } from '../components/AdvancedSearchModal';

const AVAILABLE_FILING_YEARS = PATENTS
  .map((patent) => new Date(patent.filingDate).getFullYear())
  .filter((year) => !Number.isNaN(year))
  .sort((a, b) => a - b);

const MIN_FILING_YEAR = AVAILABLE_FILING_YEARS[0]?.toString() || '1990';
const MAX_FILING_YEAR = AVAILABLE_FILING_YEARS[AVAILABLE_FILING_YEARS.length - 1]?.toString() || new Date().getFullYear().toString();
const DEFAULT_SEARCH_IN: AdvancedSearchField[] = ['title', 'abstract', 'inventor', 'assignee', 'domain', 'subdomain'];

const getSearchableValues = (patent: Patent, searchIn: AdvancedSearchField[]): string[] => {
  return searchIn.flatMap((field) => {
    switch (field) {
      case 'title':
        return patent.title ? [patent.title] : [];
      case 'abstract':
        return patent.abstract ? [patent.abstract] : [];
      case 'inventor':
        return patent.inventors;
      case 'assignee':
        return patent.currentAssignees.length > 0 ? patent.currentAssignees : [patent.assignee.name];
      case 'domain':
        return patent.domain ? [patent.domain] : [];
      case 'subdomain':
        return patent.subdomain ? [patent.subdomain] : [];
      default:
        return [];
    }
  });
};

export interface FilterState {
  assignees: string[];
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
  booleanMode: 'and' | 'or';
  searchIn: AdvancedSearchField[];
  excludeExpired: boolean;
  jurisdiction: string;
  sortBy: 'relevance' | 'newest' | 'price-low' | 'price-high' | 'citations';
}

export const usePatentFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const query = searchParams.get('q') || '';
  
  const filters = useMemo((): FilterState => {
    return {
      assignees: searchParams.getAll('assignee'),
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
      startYear: searchParams.get('startY') || MIN_FILING_YEAR,
      endYear: searchParams.get('endY') || MAX_FILING_YEAR,
      litigation: (searchParams.get('lit') as any) || 'all',
      booleanMode: searchParams.get('mode') === 'or' ? 'or' : 'and',
      searchIn: (searchParams.getAll('in') as AdvancedSearchField[]).filter(Boolean).length > 0 ? (searchParams.getAll('in') as AdvancedSearchField[]) : DEFAULT_SEARCH_IN,
      excludeExpired: searchParams.get('alive') === '1',
      jurisdiction: searchParams.get('jur') || 'All',
      sortBy: (searchParams.get('sort') as any) || 'relevance',
    };
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const next = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    
    next.assignees.forEach(a => params.append('assignee', a));
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
    if (next.startYear !== MIN_FILING_YEAR) params.set('startY', next.startYear);
    if (next.endYear !== MAX_FILING_YEAR) params.set('endY', next.endYear);
    if (next.litigation !== 'all') params.set('lit', next.litigation);
    if (next.booleanMode !== 'and') params.set('mode', next.booleanMode);
    next.searchIn.forEach((field) => params.append('in', field));
    if (next.excludeExpired) params.set('alive', '1');
    if (next.jurisdiction !== 'All') params.set('jur', next.jurisdiction);
    
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
      const terms = q.split(/\s+/).filter(Boolean);

      result = result.filter((patent) => {
        const searchableValues = [
          patent.id,
          patent.applicationNumber,
          ...getSearchableValues(patent, filters.searchIn),
        ]
          .filter(Boolean)
          .map((value) => value.toLowerCase());

        if (searchableValues.length === 0) return false;

        return filters.booleanMode === 'or'
          ? terms.some((term) => searchableValues.some((value) => value.includes(term)))
          : terms.every((term) => searchableValues.some((value) => value.includes(term)));
      });
    }

    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.domain));
    }

    if (filters.subCategories.length > 0) {
      result = result.filter(p => filters.subCategories.includes(p.subdomain || 'General'));
    }

    if (filters.assignees.length > 0) {
      result = result.filter(p => filters.assignees.includes(p.assignee.name));
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

    if (filters.excludeExpired) {
      result = result.filter((patent) => patent.simpleLegalStatus !== 'Dead' && patent.legalStatus.toLowerCase() !== 'expired');
    }

    if (filters.jurisdiction !== 'All') {
      result = result.filter((patent) => patent.jurisdiction === filters.jurisdiction);
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
