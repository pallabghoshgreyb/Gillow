import { getPatentById } from '../data/patents';
import { getDomainDetailBySlug, getDomainDetails, slugifyDomainName } from '../data/domainDetails';
import { LOGO_URL, OG_IMAGE_URL, SITE_NAME, SITE_URL } from './siteConfig';

type RouteLocation = {
  pathname: string;
  search: string;
};

export type SeoBreadcrumb = {
  label: string;
  href: string;
};

export type SeoMeta = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: 'website' | 'article';
  breadcrumbs: SeoBreadcrumb[];
  searchActionEnabled: boolean;
};

const DEFAULT_DESCRIPTION =
  'Search millions of patents, explore technology landscapes, analyze competitors, and discover innovation opportunities using AI-powered patent intelligence.';

const trackableSearchParams = new Set(['q', 'pn', 'assignee', 'category', 'sub', 'status', 'type', 'assigneeType', 'minV', 'maxV', 'minC', 'minCit', 'minFam', 'startY', 'endY', 'lit', 'mode', 'in', 'alive', 'jur', 'sort']);

const normalizeSearch = (search: string) => {
  if (!search) return '';
  const params = new URLSearchParams(search);
  Array.from(params.keys()).forEach((key) => {
    if (!trackableSearchParams.has(key)) {
      params.delete(key);
    }
  });
  const normalized = params.toString();
  return normalized ? `?${normalized}` : '';
};

const humanizeSlug = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const shorten = (value: string, length: number) => (value.length > length ? `${value.slice(0, length - 1)}...` : value);

const buildCanonical = (pathname: string, search: string) => `${SITE_URL}${pathname}${normalizeSearch(search)}`;

const buildBreadcrumbs = (pathname: string, label: string): SeoBreadcrumb[] => {
  if (pathname === '/') return [{ label: 'Home', href: `${SITE_URL}/` }];

  if (pathname.startsWith('/domains/')) {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'Landscape Preview', href: `${SITE_URL}/landscape-preview` },
      { label, href: `${SITE_URL}${pathname}` },
    ];
  }

  if (pathname.startsWith('/technology/')) {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'Landscape Preview', href: `${SITE_URL}/landscape-preview` },
      { label, href: `${SITE_URL}${pathname}` },
    ];
  }

  if (pathname.startsWith('/patent/')) {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'PatIndex', href: `${SITE_URL}/browse` },
      { label, href: `${SITE_URL}${pathname}` },
    ];
  }

  if (pathname === '/search' || pathname === '/browse') {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'PatIndex', href: `${SITE_URL}/browse` },
    ];
  }

  if (pathname === '/landscape-preview') {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'Landscape Preview', href: `${SITE_URL}/landscape-preview` },
    ];
  }

  if (pathname === '/saved') {
    return [
      { label: 'Home', href: `${SITE_URL}/` },
      { label: 'Saved', href: `${SITE_URL}/saved` },
    ];
  }

  return [
    { label: 'Home', href: `${SITE_URL}/` },
    { label, href: `${SITE_URL}${pathname}` },
  ];
};

const buildSiteMeta = (pathname: string, search: string, title: string, description: string, robots: string, ogType: 'website' | 'article') => ({
  title,
  description,
  canonical: buildCanonical(pathname, search),
  robots,
  ogType,
  breadcrumbs: buildBreadcrumbs(pathname, title.replace(` | ${SITE_NAME}`, '')),
  searchActionEnabled: pathname !== '/404',
});

export const getSeoMeta = (location: RouteLocation): SeoMeta => {
  const { pathname, search } = location;
  const params = new URLSearchParams(search);

  if (pathname === '/') {
    return buildSiteMeta(
      pathname,
      search,
      'PatentIndex | AI Patent Search & Technology Landscape Intelligence',
      DEFAULT_DESCRIPTION,
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname === '/search' || pathname === '/browse') {
    const query = params.get('q')?.trim() || '';
    const title = query
      ? `Search Results for "${shorten(query, 45)}" | ${SITE_NAME}`
      : `Patent Search | ${SITE_NAME}`;
    const description = query
      ? `Search patents, inventors, assignees, and technologies for "${shorten(query, 90)}".`
      : 'Search patent publications, inventors, assignees, and technologies across global patent datasets.';
    return buildSiteMeta(
      pathname,
      search,
      title,
      description,
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname === '/landscape-preview') {
    const domain = params.get('domain')?.trim() || '';
    if (domain) {
      return buildSiteMeta(
        pathname,
        search,
        `${shorten(domain, 48)} Patent Landscape | ${SITE_NAME}`,
        `Explore ${domain} patents, subdomains, and innovation patterns with interactive landscape intelligence.`,
        'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
        'website',
      );
    }

    return buildSiteMeta(
      pathname,
      search,
      `Technology Landscape Explorer | ${SITE_NAME}`,
      'Visualize technology domains, discover subdomains, analyze patent density, and explore innovation landscapes.',
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname === '/saved') {
    return buildSiteMeta(
      pathname,
      search,
      `Saved Patents | ${SITE_NAME}`,
      'Review saved patent records, shortlist assets, and manage your research workflow.',
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname.startsWith('/domains/')) {
    const slug = pathname.split('/')[2] || '';
    const domain = getDomainDetailBySlug(slug);
    const label = domain?.name || humanizeSlug(slug);
    const description =
      domain?.description ||
      `Explore ${label} patents, technology trends, filing activity, and key innovators.`;
    return buildSiteMeta(
      pathname,
      search,
      `${label} Patent Landscape | ${SITE_NAME}`,
      description,
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname.startsWith('/technology/')) {
    const techId = pathname.split('/')[2] || '';
    const label = humanizeSlug(techId);
    return buildSiteMeta(
      pathname,
      search,
      `${label} Landscape | ${SITE_NAME}`,
      `Explore patent records and technology signals for ${label}.`,
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'website',
    );
  }

  if (pathname.startsWith('/patent/')) {
    const patentId = pathname.split('/')[2] || '';
    const patent = getPatentById(patentId);
    const title = patent ? `${shorten(patent.title, 72)} | ${SITE_NAME}` : `Patent Details | ${SITE_NAME}`;
    const description = patent
      ? `${patent.publicationNumber} by ${patent.assignee.name}. ${shorten(patent.abstract || DEFAULT_DESCRIPTION, 150)}`
      : 'Review patent publication details, claims, citations, and valuation signals.';
    return buildSiteMeta(
      pathname,
      search,
      title,
      description,
      'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
      'article',
    );
  }

  if (pathname === '/404') {
    return buildSiteMeta(
      pathname,
      search,
      `Page Not Found | ${SITE_NAME}`,
      'The requested page could not be found.',
      'noindex,nofollow',
      'website',
    );
  }

  return buildSiteMeta(
    pathname,
    search,
    SITE_NAME,
    DEFAULT_DESCRIPTION,
    'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    'website',
  );
};

export const buildOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
});

export const buildWebSiteSchema = (meta: SeoMeta) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: meta.description,
  potentialAction: meta.searchActionEnabled
    ? {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      }
    : undefined,
});

export const buildWebApplicationSchema = (meta: SeoMeta) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: meta.canonical,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: meta.description,
});

export const buildBreadcrumbSchema = (breadcrumbs: SeoBreadcrumb[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.label,
    item: crumb.href,
  })),
});

export const getSeoScripts = (location: RouteLocation) => {
  const meta = getSeoMeta(location);
  return [
    buildOrganizationSchema(),
    buildWebSiteSchema(meta),
    buildWebApplicationSchema(meta),
    buildBreadcrumbSchema(meta.breadcrumbs),
  ];
};

export const getPublicRoutes = () => {
  const domains = getDomainDetails();
  const routes = new Set<string>(['/', '/browse', '/search', '/landscape-preview', '/saved']);

  domains.forEach((domain) => {
    routes.add(`/domains/${domain.slug}`);
    routes.add(`/technology/${slugifyDomainName(domain.slug)}`);
    domain.technologies.forEach((technology) => {
      routes.add(`/technology/${slugifyDomainName(`${domain.name}-${technology.name}`)}`);
    });
  });

  return Array.from(routes).sort((left, right) => left.localeCompare(right));
};

export const getDefaultOgImage = () => OG_IMAGE_URL;
