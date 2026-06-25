import { PATENTS } from '../data/patents';
import { Patent } from '../types';

export interface SubdomainPublicationCount {
  subdomain: string;
  publicationCount: number;
  publicationNumbers: string[];
}

export interface LandscapeStats {
  selectedDomain: string;
  totalSubdomains: number;
  totalUniquePublications: number;
  topSubdomain: string;
  topSubdomainCount: number;
}

const normalizeText = (value?: string | null) => value?.trim() ?? '';

export const getUniqueDomains = (patents: Patent[] = PATENTS) =>
  Array.from(
    new Set(
      patents
        .map((patent) => normalizeText(patent.domain))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

export const getDefaultLandscapeDomain = (domains: string[]) =>
  domains.includes('Robotic Surgery') ? 'Robotic Surgery' : domains[0] || '';

export const getSubdomainPublicationCounts = (
  patents: Patent[] = PATENTS,
  selectedDomain: string,
): SubdomainPublicationCount[] => {
  const domain = normalizeText(selectedDomain);
  if (!domain) return [];

  const grouped = new Map<string, Set<string>>();

  patents.forEach((patent) => {
    if (normalizeText(patent.domain) !== domain) return;

    const subdomain = normalizeText(patent.subdomain);
    const publicationNumber = normalizeText(patent.publicationNumber);

    if (!subdomain || !publicationNumber) return;

    if (!grouped.has(subdomain)) {
      grouped.set(subdomain, new Set());
    }

    grouped.get(subdomain)?.add(publicationNumber);
  });

  return Array.from(grouped.entries())
    .map(([subdomain, publicationNumbers]) => ({
      subdomain,
      publicationCount: publicationNumbers.size,
      publicationNumbers: Array.from(publicationNumbers).sort((left, right) => left.localeCompare(right)),
    }))
    .sort(
      (left, right) =>
        right.publicationCount - left.publicationCount ||
        left.subdomain.localeCompare(right.subdomain),
    );
};

export const getLandscapeStats = (
  selectedDomain: string,
  subdomainCounts: SubdomainPublicationCount[],
): LandscapeStats => {
  const uniquePublications = new Set<string>();

  subdomainCounts.forEach((subdomain) => {
    subdomain.publicationNumbers.forEach((publicationNumber) => {
      uniquePublications.add(publicationNumber);
    });
  });

  const topSubdomain = subdomainCounts[0];

  return {
    selectedDomain,
    totalSubdomains: subdomainCounts.length,
    totalUniquePublications: uniquePublications.size,
    topSubdomain: topSubdomain?.subdomain || 'None',
    topSubdomainCount: topSubdomain?.publicationCount || 0,
  };
};
