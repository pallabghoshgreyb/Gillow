import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Filter,
  Layers,
  Lightbulb,
  Loader2,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import PatentCard from '../components/PatentCard';
import { useGillow } from '../context/GillowContext';
import { DomainDetail as DomainDetailData, Patent } from '../types';
import { api } from '../utils/api';
import {
  domainCompanyForPatent,
  domainYearForPatent,
  getDomainFilterOptions,
} from '../data/domainDetails';
import { hasText } from '../utils/patentDisplay';

type SortMode = 'score' | 'newest' | 'citations' | 'family';

const SELECT_CLASS =
  'rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-[#00bdcd] focus:ring-2 focus:ring-[#00bdcd]/20';

const patentCompanies = (patent: Patent) => {
  const values = [
    ...patent.currentAssignees,
    ...patent.originalAssignees,
    patent.assignee.name,
  ];
  return Array.from(new Set(values.map((value) => value.trim()).filter(hasText)));
};

const patentScore = (patent: Patent) =>
  (patent.totalPatentScore || 0) * 1000 +
  (patent.qualityScore || 0) * 10 +
  (patent.forwardCitationsCount || 0) +
  (patent.familySize || 0);

const latestPatentTime = (patent: Patent) => {
  const parsed = new Date(patent.filingDate || patent.publicationDate);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const matchesQuery = (patent: Patent, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    patent.publicationNumber,
    patent.applicationNumber,
    patent.title,
    patent.abstract,
    patent.subdomain,
    patent.primaryCpc,
    ...patent.cpcs,
    ...patent.ipcs,
    ...patent.inventors,
    ...patentCompanies(patent),
  ]
    .filter(hasText)
    .some((value) => value.toLowerCase().includes(normalized));
};

const EmptyState = ({ title, text }: { title: string; text: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
      <Lightbulb size={20} />
    </div>
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{text}</p>
  </div>
);

const FilterSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="flex min-w-0 flex-col gap-1">
    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={SELECT_CLASS}>
      <option value="all">All</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const DomainDetail: React.FC = () => {
  const { domainSlug } = useParams();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useGillow();
  const [domain, setDomain] = useState<DomainDetailData | null>(null);
  const [allDomains, setAllDomains] = useState<DomainDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedInventor, setSelectedInventor] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('score');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'auto' });

      if (!domainSlug) {
        setDomain(null);
        setAllDomains(await api.getDomains());
        setLoading(false);
        return;
      }

      try {
        const [nextDomain, domains] = await Promise.all([
          api.getDomain(domainSlug),
          api.getDomains(),
        ]);
        if (!active) return;
        setDomain(nextDomain || null);
        setAllDomains(domains);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [domainSlug]);

  useEffect(() => {
    setVisibleCount(12);
  }, [query, selectedCompany, selectedInventor, selectedStatus, selectedTechnology, selectedYear, sortBy]);

  const filterOptions = useMemo(
    () =>
      domain
        ? getDomainFilterOptions(domain)
        : { technologies: [], companies: [], inventors: [], years: [], statuses: [] },
    [domain],
  );

  const filteredPatents = useMemo(() => {
    if (!domain) return [];

    return domain.patents
      .filter((patent) => {
        if (!matchesQuery(patent, query)) return false;
        if (selectedTechnology !== 'all' && (patent.subdomain || 'General') !== selectedTechnology) return false;
        if (selectedCompany !== 'all' && !patentCompanies(patent).includes(selectedCompany)) return false;
        if (selectedInventor !== 'all' && !patent.inventors.includes(selectedInventor)) return false;
        if (selectedYear !== 'all' && String(domainYearForPatent(patent) || '') !== selectedYear) return false;
        if (selectedStatus !== 'all' && patent.legalStatus !== selectedStatus) return false;
        return true;
      })
      .sort((left, right) => {
        if (sortBy === 'newest') return latestPatentTime(right) - latestPatentTime(left);
        if (sortBy === 'citations') return right.forwardCitationsCount - left.forwardCitationsCount;
        if (sortBy === 'family') return right.familySize - left.familySize;
        return patentScore(right) - patentScore(left);
      });
  }, [domain, query, selectedCompany, selectedInventor, selectedStatus, selectedTechnology, selectedYear, sortBy]);

  const activeFilterCount = [
    query.trim(),
    selectedTechnology !== 'all',
    selectedCompany !== 'all',
    selectedInventor !== 'all',
    selectedYear !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  const trendSlice = useMemo(() => (domain ? domain.trends.slice(-12) : []), [domain]);
  const maxTrendCount = Math.max(...trendSlice.map((trend) => trend.count), 1);
  const visiblePatents = filteredPatents.slice(0, visibleCount);

  const resetFilters = () => {
    setQuery('');
    setSelectedTechnology('all');
    setSelectedCompany('all');
    setSelectedInventor('all');
    setSelectedYear('all');
    setSelectedStatus('all');
    setSortBy('score');
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-[#00bdcd]" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-[80vh] bg-white px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-[#00bdcd]">
            <Search size={28} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Domain not found</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500">
            We could not match that domain URL to the current patent dataset.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft size={16} /> Back to Home
            </button>
            <Link
              to="/#domains"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
            >
              View domains <ArrowRight size={16} />
            </Link>
          </div>

          {allDomains.length > 0 && (
            <div className="mt-12 grid gap-3 sm:grid-cols-2">
              {allDomains.map((item) => (
                <Link
                  key={item.slug}
                  to={`/domains/${item.slug}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#00bdcd] hover:bg-white"
                >
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.patents.length.toLocaleString()} patents</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
            >
              <ArrowLeft size={16} />
              Home
            </Link>
            <Link
              to="/#domains"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
            >
              Domain list
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#00bdcd]">
                <Layers size={13} />
                Domain Detail
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl">
                {domain.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
                {domain.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {domain.stats.map((stat) => (
                <div key={stat.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
                  {stat.helper && <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Solution Areas</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Major technology clusters</h2>
            </div>

            {domain.technologies.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {domain.technologies.slice(0, 8).map((technology) => {
                  const isActive = selectedTechnology === technology.name;
                  return (
                    <button
                      key={technology.slug}
                      type="button"
                      onClick={() => setSelectedTechnology(isActive ? 'all' : technology.name)}
                      aria-pressed={isActive}
                      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#00bdcd] ${
                        isActive ? 'border-[#00bdcd] ring-2 ring-[#00bdcd]/15' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{technology.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {technology.patentCount.toLocaleString()} patents - {technology.share}% of domain
                          </p>
                        </div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#00bdcd]">
                          {technology.growth >= 0 ? '+' : ''}
                          {technology.growth}%
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#00bdcd]" style={{ width: `${Math.max(6, technology.share)}%` }} />
                      </div>
                      {technology.topAssignee && (
                        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Building2 size={13} className="text-slate-400" />
                          {technology.topAssignee}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No solution areas yet" text="Subdomain data is not available for this domain in the current dataset." />
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Key Players</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Companies</h2>
                </div>
                <Building2 size={20} className="text-[#00bdcd]" />
              </div>
              {domain.companies.length > 0 ? (
                <div className="space-y-3">
                  {domain.companies.slice(0, 8).map((company, index) => (
                    <button
                      key={company.name}
                      type="button"
                      onClick={() => setSelectedCompany(company.name)}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-[#00bdcd] hover:bg-white"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">{company.name}</span>
                          <span className="text-xs text-slate-500">
                            {company.share}% share{company.latestFilingYear ? ` - latest ${company.latestFilingYear}` : ''}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-slate-500">{company.patentCount}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No company data" text="Assignee information is not available for this domain yet." />
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Contributors</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Inventors</h2>
                </div>
                <Users size={20} className="text-[#00bdcd]" />
              </div>
              {domain.inventors.length > 0 ? (
                <div className="space-y-3">
                  {domain.inventors.slice(0, 8).map((inventor) => (
                    <button
                      key={inventor.name}
                      type="button"
                      onClick={() => setSelectedInventor(inventor.name)}
                      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-[#00bdcd] hover:bg-white"
                    >
                      <span className="truncate text-sm font-semibold text-slate-800">{inventor.name}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-500 shadow-sm">
                        {inventor.patentCount}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No inventor data" text="Inventor names are not available for this domain yet." />
              )}
            </section>
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Year-wise Activity</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Filing trend</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              <TrendingUp size={16} className="text-[#00bdcd]" />
              {domain.patents.length.toLocaleString()} total records
            </div>
          </div>

          {trendSlice.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-[720px] items-end gap-3">
                {trendSlice.map((trend) => {
                  const height = Math.max(14, Math.round((trend.count / maxTrendCount) * 170));
                  return (
                    <div key={trend.year} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-44 w-full items-end rounded-xl bg-slate-50 px-2">
                        <div
                          className="w-full rounded-t-xl bg-[#00bdcd] transition"
                          style={{ height: `${height}px` }}
                          title={`${trend.count} filing${trend.count === 1 ? '' : 's'} in ${trend.year}`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold tabular-nums text-slate-900">{trend.count}</p>
                        <p className="text-xs text-slate-400">{trend.year}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState title="No trend data" text="Filing dates are not available for this domain yet." />
          )}
        </section>

        <section className="space-y-6" id="domain-patents">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#00bdcd]">Related Documents</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Patents in this domain</h2>
            </div>
            <div className="text-sm font-medium text-slate-500">
              Showing <span className="text-slate-900">{visiblePatents.length}</span> of{' '}
              <span className="text-slate-900">{filteredPatents.length}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.2fr)_repeat(5,minmax(150px,1fr))_150px]">
              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Search</span>
                <span className="relative">
                  <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Title, patent number, inventor..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#00bdcd] focus:ring-2 focus:ring-[#00bdcd]/20"
                  />
                </span>
              </label>

              <FilterSelect label="Area" value={selectedTechnology} options={filterOptions.technologies} onChange={setSelectedTechnology} />
              <FilterSelect label="Company" value={selectedCompany} options={filterOptions.companies} onChange={setSelectedCompany} />
              <FilterSelect label="Inventor" value={selectedInventor} options={filterOptions.inventors} onChange={setSelectedInventor} />
              <FilterSelect label="Year" value={selectedYear} options={filterOptions.years} onChange={setSelectedYear} />
              <FilterSelect label="Status" value={selectedStatus} options={filterOptions.statuses} onChange={setSelectedStatus} />

              <label className="flex min-w-0 flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)} className={SELECT_CLASS}>
                  <option value="score">Strength</option>
                  <option value="newest">Newest</option>
                  <option value="citations">Citations</option>
                  <option value="family">Family Size</option>
                </select>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  <Filter size={12} />
                  {activeFilterCount} active
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#00bdcd] hover:text-[#00bdcd]"
                >
                  <X size={12} />
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {visiblePatents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {visiblePatents.map((patent) => (
                  <PatentCard
                    key={patent.publicationNumber}
                    patent={patent}
                    href={`/patent/${patent.publicationNumber}`}
                    isFavorite={favorites.includes(patent.id)}
                    onToggleFavorite={() => toggleFavorite(patent.id)}
                  />
                ))}
              </div>

              {visibleCount < filteredPatents.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 12)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
                  >
                    Load more patents <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No patents match these filters" text="Adjust the search or filters to see related patent records for this domain." />
          )}
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <FileText size={20} className="mt-1 text-[#00bdcd]" />
            <div>
              <p className="font-semibold text-slate-900">Patent records</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Records link back to the live patent detail page for legal status, claims, citations, and valuation details.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 size={20} className="mt-1 text-[#00bdcd]" />
            <div>
              <p className="font-semibold text-slate-900">Data-driven sections</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Empty data is hidden or shown with fallbacks, so future domain fields can be added without duplicate pages.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays size={20} className="mt-1 text-[#00bdcd]" />
            <div>
              <p className="font-semibold text-slate-900">Activity context</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Year-wise activity is based on available filing dates in the current dataset.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DomainDetail;
