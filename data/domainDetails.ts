import {
  DomainCompany,
  DomainDetail,
  DomainInventor,
  DomainTechnologyArea,
  DomainTrend,
  Patent,
} from '../types';
import { PATENTS } from './patents';

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  'Robotic Surgery':
    'Patent intelligence across robotic surgical platforms, instruments, visualization, localization, controls, implants, and connected clinical workflows.',
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

export const slugifyDomainName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized';

const patentYear = (patent: Patent): number | null => {
  const parsed = new Date(patent.filingDate);
  const year = parsed.getFullYear();
  return Number.isNaN(year) ? null : year;
};

const patentAssignees = (patent: Patent) => {
  const assignees =
    patent.currentAssignees.length > 0
      ? patent.currentAssignees
      : patent.originalAssignees.length > 0
        ? patent.originalAssignees
        : [patent.assignee.name];

  return assignees.map((item) => item.trim()).filter(hasText);
};

const computeGrowth = (patents: Patent[]) => {
  const years = patents
    .map(patentYear)
    .filter((year): year is number => year !== null)
    .sort((left, right) => left - right);

  if (years.length === 0) return 0;

  const latestYear = years[years.length - 1];
  const previousYear = latestYear - 1;
  const latestCount = patents.filter((patent) => patentYear(patent) === latestYear).length;
  const previousCount = patents.filter((patent) => patentYear(patent) === previousYear).length;

  if (previousCount === 0) return latestCount > 0 ? 100 : 0;
  return Math.round(((latestCount - previousCount) / previousCount) * 100);
};

const topNameFromCounts = (counts: Map<string, number>) =>
  Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || '';

const buildTechnologies = (patents: Patent[]): DomainTechnologyArea[] => {
  const grouped = new Map<string, Patent[]>();

  patents.forEach((patent) => {
    const name = hasText(patent.subdomain) ? patent.subdomain.trim() : 'General';
    const current = grouped.get(name) || [];
    current.push(patent);
    grouped.set(name, current);
  });

  return Array.from(grouped.entries())
    .map(([name, items]) => {
      const assigneeCounts = new Map<string, number>();
      items.forEach((patent) => {
        patentAssignees(patent).forEach((assignee) => {
          assigneeCounts.set(assignee, (assigneeCounts.get(assignee) || 0) + 1);
        });
      });

      return {
        slug: slugifyDomainName(name),
        name,
        patentCount: items.length,
        share: patents.length > 0 ? Math.round((items.length / patents.length) * 100) : 0,
        growth: computeGrowth(items),
        topAssignee: topNameFromCounts(assigneeCounts),
      };
    })
    .sort((left, right) => right.patentCount - left.patentCount || left.name.localeCompare(right.name));
};

const buildCompanies = (patents: Patent[]): DomainCompany[] => {
  const grouped = new Map<string, Patent[]>();

  patents.forEach((patent) => {
    patentAssignees(patent).forEach((assignee) => {
      const current = grouped.get(assignee) || [];
      current.push(patent);
      grouped.set(assignee, current);
    });
  });

  return Array.from(grouped.entries())
    .map(([name, items]) => {
      const latestFilingYear = items
        .map(patentYear)
        .filter((year): year is number => year !== null)
        .sort((left, right) => right - left)[0] || null;

      return {
        name,
        patentCount: items.length,
        share: patents.length > 0 ? Math.round((items.length / patents.length) * 100) : 0,
        latestFilingYear,
        patents: items.map((patent) => patent.publicationNumber),
      };
    })
    .sort((left, right) => right.patentCount - left.patentCount || left.name.localeCompare(right.name));
};

const buildInventors = (patents: Patent[]): DomainInventor[] => {
  const grouped = new Map<string, Patent[]>();

  patents.forEach((patent) => {
    patent.inventors.filter(hasText).forEach((inventor) => {
      const current = grouped.get(inventor) || [];
      current.push(patent);
      grouped.set(inventor, current);
    });
  });

  return Array.from(grouped.entries())
    .map(([name, items]) => ({
      name,
      patentCount: items.length,
      patents: items.map((patent) => patent.publicationNumber),
    }))
    .sort((left, right) => right.patentCount - left.patentCount || left.name.localeCompare(right.name));
};

const buildTrends = (patents: Patent[]): DomainTrend[] => {
  const counts = new Map<number, number>();

  patents.forEach((patent) => {
    const year = patentYear(patent);
    if (year === null) return;
    counts.set(year, (counts.get(year) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((left, right) => left.year - right.year);
};

const buildDescription = (name: string, technologies: DomainTechnologyArea[]) => {
  const override = DOMAIN_DESCRIPTIONS[name];
  if (override) return override;

  const leadingTechnologies = technologies.slice(0, 3).map((item) => item.name);
  if (leadingTechnologies.length > 0) {
    return `Patent intelligence for ${name}, with activity concentrated in ${leadingTechnologies.join(', ')}.`;
  }

  return `Patent intelligence for ${name}, including domain-level activity, major contributors, and related patent records.`;
};

const rankPatent = (patent: Patent) =>
  (patent.totalPatentScore || 0) * 1000 +
  (patent.qualityScore || 0) * 10 +
  (patent.forwardCitationsCount || 0) +
  (patent.familySize || 0);

const buildDomainDetail = (name: string, patents: Patent[]): DomainDetail => {
  const technologies = buildTechnologies(patents);
  const companies = buildCompanies(patents);
  const inventors = buildInventors(patents);
  const trends = buildTrends(patents);
  const years = trends.map((trend) => trend.year);
  const yearRange =
    years.length > 0
      ? `${Math.min(...years)}-${Math.max(...years)}`
      : 'Not available';
  const totalForwardCitations = patents.reduce((sum, patent) => sum + (patent.forwardCitationsCount || 0), 0);
  const sortedPatents = [...patents].sort((left, right) => rankPatent(right) - rankPatent(left));

  return {
    slug: slugifyDomainName(name),
    name,
    description: buildDescription(name, technologies),
    stats: [
      {
        key: 'patents',
        label: 'Patents',
        value: patents.length.toLocaleString(),
        helper: 'Records in this domain',
      },
      {
        key: 'technologies',
        label: 'Solution Areas',
        value: technologies.length.toLocaleString(),
        helper: 'Distinct subdomains',
      },
      {
        key: 'companies',
        label: 'Key Players',
        value: companies.length.toLocaleString(),
        helper: 'Unique assignees',
      },
      {
        key: 'citations',
        label: 'Forward Citations',
        value: totalForwardCitations.toLocaleString(),
        helper: yearRange,
      },
    ],
    technologies,
    companies,
    inventors,
    trends,
    patents: sortedPatents,
  };
};

export const getDomainDetails = (): DomainDetail[] => {
  const grouped = new Map<string, Patent[]>();

  PATENTS.forEach((patent) => {
    const name = hasText(patent.domain) ? patent.domain.trim() : 'Uncategorized';
    const current = grouped.get(name) || [];
    current.push(patent);
    grouped.set(name, current);
  });

  return Array.from(grouped.entries())
    .map(([name, patents]) => buildDomainDetail(name, patents))
    .sort((left, right) => right.patents.length - left.patents.length || left.name.localeCompare(right.name));
};

export const getDomainDetailBySlug = (slug: string): DomainDetail | undefined =>
  getDomainDetails().find((domain) => domain.slug === slugifyDomainName(slug));

export const getDomainFilterOptions = (domain: DomainDetail) => ({
  technologies: domain.technologies.map((technology) => technology.name),
  companies: domain.companies.map((company) => company.name),
  inventors: domain.inventors.map((inventor) => inventor.name),
  years: Array.from(
    new Set(
      domain.patents
        .map(patentYear)
        .filter((year): year is number => year !== null),
    ),
  )
    .sort((left, right) => right - left)
    .map(String),
  statuses: Array.from(new Set(domain.patents.map((patent) => patent.legalStatus).filter(hasText))).sort(),
});

export const domainCompanyForPatent = (patent: Patent) => patentAssignees(patent)[0] || 'Unknown';

export const domainYearForPatent = (patent: Patent) => patentYear(patent);
