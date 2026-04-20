import { TechNode, Patent, TechLevel, ChartDataPoint } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, DOMAIN_COLORS, PLACEHOLDER_IMAGES } from '../constants';
import { PATENTS, getPatentById } from '../data/patents';

const FAV_KEY = 'GILLOW_FAVORITES';
const SERVER_URL_KEY = 'GILLOW_SERVER_URL';

// Added utility functions for server URL configuration
export const getServerUrl = (): string | null => localStorage.getItem(SERVER_URL_KEY);

export const setServerUrl = (url: string): void => {
    if (url) {
        localStorage.setItem(SERVER_URL_KEY, url);
    } else {
        localStorage.removeItem(SERVER_URL_KEY);
    }
};

const patentYear = (patent: Patent) => {
    const parsed = new Date(patent.filingDate);
    const year = parsed.getFullYear();
    return Number.isNaN(year) ? null : year;
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

    if (previousCount === 0) {
        return latestCount > 0 ? 100 : 0;
    }

    return Math.round(((latestCount - previousCount) / previousCount) * 100);
};

const topAssigneeFor = (patents: Patent[]) => {
    const counts = new Map<string, number>();
    patents.forEach((patent) => {
        const assignees = patent.currentAssignees.length > 0
            ? patent.currentAssignees
            : patent.originalAssignees.length > 0
                ? patent.originalAssignees
                : [patent.assignee.name];

        assignees
            .filter(Boolean)
            .forEach((assignee) => counts.set(assignee, (counts.get(assignee) || 0) + 1));
    });

    const ranked = Array.from(counts.entries()).sort((left, right) =>
        right[1] - left[1] || left[0].localeCompare(right[0])
    );

    return ranked[0]?.[0] || 'Unknown';
};

const buildTrendSeries = (patents: Patent[]): ChartDataPoint[] => {
    const counts = new Map<number, number>();

    patents.forEach((patent) => {
        const year = patentYear(patent);
        if (year === null) return;
        counts.set(year, (counts.get(year) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((left, right) => left[0] - right[0])
        .map(([year, count]) => ({ year, count }));
};

export const api = {
    getTechnologies: async (): Promise<TechNode[]> => {
        const domains = [...new Set(PATENTS.map(p => p.domain || 'Uncategorized'))];
        const nodes: TechNode[] = [];
        
        domains.forEach((domain, i) => {
            const domainPatents = PATENTS.filter(p => p.domain === domain);
            const angle = (i / domains.length) * Math.PI * 2;
            const dist = 600;
            const domainX = (MAP_WIDTH / 2) + Math.cos(angle) * dist;
            const domainY = (MAP_HEIGHT / 2) + Math.sin(angle) * dist;
            
            // 1. Create Domain Node
            const domainNode: TechNode = {
                id: domain.toLowerCase().replace(/\s/g, '-'),
                name: domain,
                domain: domain,
                subdomain: '',
                level: TechLevel.DOMAIN,
                x: domainX,
                y: domainY,
                radius: 120 + (domainPatents.length * 5),
                patentCount: domainPatents.length,
                growth: computeGrowth(domainPatents),
                topAssignee: topAssigneeFor(domainPatents),
                color: DOMAIN_COLORS[domain] || DOMAIN_COLORS.Default,
                imageUrl: PLACEHOLDER_IMAGES[domain] || PLACEHOLDER_IMAGES.Default
            };
            nodes.push(domainNode);

            // 2. Create Subdomain Nodes clustered around the domain
            const subdomains = [...new Set(domainPatents.map(p => p.subdomain || 'General'))];
            subdomains.forEach((sub, j) => {
                const subPatents = domainPatents.filter(p => (p.subdomain || 'General') === sub);
                const subAngle = (j / subdomains.length) * Math.PI * 2;
                const subDist = 250 + (subPatents.length * 10);
                
                nodes.push({
                    id: `${domainNode.id}-${sub.toLowerCase().replace(/\s/g, '-')}`,
                    name: sub,
                    domain: domain,
                    subdomain: sub,
                    level: TechLevel.SUBDOMAIN,
                    x: domainX + Math.cos(subAngle) * subDist,
                    y: domainY + Math.sin(subAngle) * subDist,
                    radius: 40 + (subPatents.length * 8),
                    patentCount: subPatents.length,
                    growth: computeGrowth(subPatents),
                    topAssignee: topAssigneeFor(subPatents),
                    color: domainNode.color,
                    imageUrl: domainNode.imageUrl
                });
            });
        });
        
        return nodes;
    },

    getTechnology: async (id: string): Promise<TechNode | undefined> => {
        const techs = await api.getTechnologies();
        return techs.find(t => t.id === id);
    },

    getPatents: async (techId?: string): Promise<Patent[]> => {
        if (!techId) return PATENTS;
        const tech = await api.getTechnology(techId);
        if (!tech) return [];
        if (tech.level === TechLevel.DOMAIN) {
            return PATENTS.filter(p => p.domain === tech.domain);
        } else {
            return PATENTS.filter(p => p.domain === tech.domain && p.subdomain === tech.subdomain);
        }
    },

    getPatent: async (id: string): Promise<Patent | undefined> => {
        return getPatentById(id);
    },

    getTrends: async (id: string): Promise<ChartDataPoint[]> => {
        const patent = getPatentById(id);
        if (patent && patent.citationTrend && patent.citationTrend.length > 0) {
            return patent.citationTrend.map(ct => ({
                year: ct.year,
                citations: ct.citations,
                value: (patent.valuation.current / 5) * (1 + (ct.year - 2020) * 0.2)
            }));
        }

        const patents = await api.getPatents(id);
        return buildTrendSeries(patents);
    },

    toggleFavorite: (id: string) => {
        const favs = api.getFavorites();
        const index = favs.indexOf(id);
        if (index > -1) favs.splice(index, 1);
        else favs.push(id);
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
        return favs;
    },

    getFavorites: (): string[] => {
        const stored = localStorage.getItem(FAV_KEY);
        return stored ? JSON.parse(stored) : [];
    }
};
