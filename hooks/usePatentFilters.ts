import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, PatentSearchResult } from '../utils/api';
import type { AdvancedSearchField } from '../components/AdvancedSearchModal';

const DEFAULT_SEARCH_IN: AdvancedSearchField[] = [
  'publicationNumber',
  'applicationNumber',
  'title',
  'abstract',
  'inventor',
  'assignee',
  'domain',
  'subdomain',
];
const DEFAULT_MAX_VALUATION = 50000000;

const hasDefaultSearchFields = (fields: AdvancedSearchField[]) =>
  fields.length === DEFAULT_SEARCH_IN.length && DEFAULT_SEARCH_IN.every((field) => fields.includes(field));

const positiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
  publicationYearFrom: string;
  publicationYearTo: string;
  litigation: 'all' | 'include' | 'exclude';
  booleanMode: 'and' | 'or';
  searchIn: AdvancedSearchField[];
  excludeExpired: boolean;
  jurisdiction: string;
  sortBy: 'relevance' | 'newest' | 'price-low' | 'price-high' | 'citations';
}

export const usePatentFilters = (pageSize = 20) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlKey = searchParams.toString();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PatentSearchResult>({ patents: [], total: 0 });
  const query = searchParams.get('q') || '';
  const page = positiveInteger(searchParams.get('page'), 1);

  const filters = useMemo((): FilterState => {
    const params = new URLSearchParams(urlKey);
    const searchIn = params.getAll('in') as AdvancedSearchField[];
    return {
      assignees: params.getAll('assignee'),
      categories: params.getAll('category'),
      subCategories: params.getAll('sub'),
      statuses: params.getAll('status'),
      patentTypes: params.getAll('type'),
      assigneeTypes: params.getAll('assigneeType'),
      minValuation: Number(params.get('minV')) || 0,
      maxValuation: params.has('maxV') ? Number(params.get('maxV')) : DEFAULT_MAX_VALUATION,
      minClaims: Number(params.get('minC')) || 0,
      minCitations: Number(params.get('minCit')) || 0,
      minFamilySize: Number(params.get('minFam')) || 0,
      publicationYearFrom: params.get('startY') || '',
      publicationYearTo: params.get('endY') || '',
      litigation: (params.get('lit') as FilterState['litigation']) || 'all',
      booleanMode: params.get('mode') === 'or' ? 'or' : 'and',
      searchIn: searchIn.length > 0 ? searchIn : DEFAULT_SEARCH_IN,
      excludeExpired: params.get('alive') === '1',
      jurisdiction: params.get('jur') || 'All',
      sortBy: (params.get('sort') as FilterState['sortBy']) || 'relevance',
    };
  }, [urlKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const source = new URLSearchParams(urlKey);
      const repeatable = {
        assignee: filters.assignees,
        domain: filters.categories,
        subdomain: filters.subCategories,
        status: filters.statuses,
        type: filters.patentTypes,
        entityType: filters.assigneeTypes,
      };
      Object.entries(repeatable).forEach(([key, values]) => {
        values.filter(Boolean).forEach((value) => params.append(key, value));
      });
      const q = source.get('q');
      if (q) params.set('q', q);
      if (source.get('pn') === '1') params.set('pn', '1');
      if (filters.jurisdiction !== 'All') params.set('jurisdiction', filters.jurisdiction);
      if (filters.publicationYearFrom) params.set('yearFrom', filters.publicationYearFrom);
      if (filters.publicationYearTo) params.set('yearTo', filters.publicationYearTo);
      if (filters.minValuation > 0) params.set('minValuation', String(filters.minValuation));
      if (filters.maxValuation !== DEFAULT_MAX_VALUATION) params.set('maxValuation', String(filters.maxValuation));
      if (filters.minClaims > 0) params.set('minClaims', String(filters.minClaims));
      if (filters.minCitations > 0) params.set('minCitations', String(filters.minCitations));
      if (filters.minFamilySize > 0) params.set('minFamilySize', String(filters.minFamilySize));
      if (filters.excludeExpired) params.set('alive', '1');
      if (filters.litigation !== 'all') params.set('litigation', filters.litigation);
      if (filters.booleanMode !== 'and') params.set('mode', filters.booleanMode);
      if (!hasDefaultSearchFields(filters.searchIn)) {
        filters.searchIn.forEach((field) => params.append('in', field));
      }
      if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      void api.searchPatents(params).then((nextResult) => {
        if (!active) return;
        setResult(nextResult);
        setLoading(false);
        if (Number.isInteger(nextResult.page) && nextResult.page > 0 && nextResult.page !== page) {
          const corrected = new URLSearchParams(urlKey);
          if (nextResult.page === 1) corrected.delete('page');
          else corrected.set('page', String(nextResult.page));
          setSearchParams(corrected, { replace: true });
        }
      });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [urlKey, filters, page, pageSize]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const next = { ...filters, ...newFilters };
    const params = new URLSearchParams(searchParams);
    const repeatable = {
      assignee: next.assignees,
      category: next.categories,
      sub: next.subCategories,
      status: next.statuses,
      type: next.patentTypes,
      assigneeType: next.assigneeTypes,
    };
    Object.entries(repeatable).forEach(([key, values]) => {
      params.delete(key);
      values.filter(Boolean).forEach((value) => params.append(key, value));
    });
    const setOptional = (key: string, value: string | number, enabled: boolean) => {
      params.delete(key);
      if (enabled) params.set(key, String(value));
    };
    setOptional('minV', next.minValuation, next.minValuation > 0);
    setOptional('maxV', next.maxValuation, next.maxValuation !== DEFAULT_MAX_VALUATION);
    setOptional('minC', next.minClaims, next.minClaims > 0);
    setOptional('minCit', next.minCitations, next.minCitations > 0);
    setOptional('minFam', next.minFamilySize, next.minFamilySize > 0);
    setOptional('startY', next.publicationYearFrom, Boolean(next.publicationYearFrom));
    setOptional('endY', next.publicationYearTo, Boolean(next.publicationYearTo));
    setOptional('lit', next.litigation, next.litigation !== 'all');
    setOptional('mode', next.booleanMode, next.booleanMode !== 'and');
    params.delete('in');
    if (!hasDefaultSearchFields(next.searchIn)) next.searchIn.forEach((field) => params.append('in', field));
    setOptional('alive', '1', next.excludeExpired);
    setOptional('jur', next.jurisdiction, next.jurisdiction !== 'All');
    setOptional('sort', next.sortBy, next.sortBy !== 'relevance');
    params.delete('page');
    setSearchParams(params);
  };

  const setQuery = (q: string) => {
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('page');
    setSearchParams(params);
  };

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    const next = Math.max(1, Math.floor(nextPage));
    if (next === 1) params.delete('page');
    else params.set('page', String(next));
    setSearchParams(params);
  };

  return {
    filters,
    updateFilters,
    filteredPatents: result.patents,
    total: result.total,
    page,
    setPage,
    pageSize: result.pageSize || pageSize,
    loading,
    query,
    setQuery,
    resetFilters: () => setSearchParams(new URLSearchParams()),
  };
};
