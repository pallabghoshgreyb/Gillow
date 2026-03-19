import { TechNode, Patent, TechLevel, ChartDataPoint } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, DOMAIN_COLORS, PLACEHOLDER_IMAGES, TECH_CATEGORIES } from '../constants';
import { PATENTS, getPatentById, searchPatents } from '../data/patents';

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
                growth: Math.floor(Math.random() * 25) + 5,
                topAssignee: domainPatents[0]?.assignee.name || 'Unknown',
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
                    growth: Math.floor(Math.random() * 20) + 10,
                    topAssignee: subPatents[0]?.assignee.name || 'Unknown',
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
        
        const baseVal = patent?.valuation.current || 1000000;
        return [2021, 2022, 2023, 2024].map((year, i) => ({
            year,
            citations: Math.floor(Math.random() * 20),
            count: Math.floor(Math.random() * 10),
            value: Math.floor(baseVal * (0.8 + (i * 0.1)))
        }));
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
