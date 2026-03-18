import { Patent, MapPoint, PatentGeographyData } from '../types';

export const countryMapping: Record<string, { name: string; code: string; coords: [number, number]; region: string }> = {
  'United States of America': { name: 'United States', code: 'US', coords: [37.0902, -95.7129], region: 'North America' },
  'China': { name: 'China', code: 'CN', coords: [35.8617, 104.1954], region: 'Asia' },
  'Europe (EPO)': { name: 'Europe (EPO)', code: 'EP', coords: [50.8503, 4.3517], region: 'Europe' },
  'WIPO': { name: 'WIPO (PCT)', code: 'WO', coords: [46.2044, 6.1432], region: 'International' },
  'Taiwan': { name: 'Taiwan', code: 'TW', coords: [23.6978, 120.9605], region: 'Asia' },
  'Japan': { name: 'Japan', code: 'JP', coords: [36.2048, 138.2529], region: 'Asia' },
  'South Korea': { name: 'South Korea', code: 'KR', coords: [35.9078, 127.7669], region: 'Asia' },
  'Germany': { name: 'Germany', code: 'DE', coords: [51.1657, 10.4515], region: 'Europe' },
  'Australia': { name: 'Australia', code: 'AU', coords: [-25.2744, 133.7751], region: 'Oceania' },
  'Mexico': { name: 'Mexico', code: 'MX', coords: [23.6345, -102.5528], region: 'North America' },
  'Brazil': { name: 'Brazil', code: 'BR', coords: [-14.2350, -51.9253], region: 'South America' }
};

export const getRegionColor = (region: string) => {
  switch (region) {
    case 'North America': return '#3b82f6';
    case 'Asia': return '#ef4444';
    case 'Europe': return '#10b981';
    case 'Oceania': return '#f59e0b';
    case 'South America': return '#8b5cf6';
    case 'International': return '#6366f1';
    default: return '#94a3b8';
  }
};

export const getMarkerSize = (count: number) => {
  if (count >= 16) return 16;
  if (count >= 6) return 12;
  return 8;
};

export const processPatentGeography = (patent: Patent): PatentGeographyData | null => {
  const countries = patent.countries || [];
  if (countries.length === 0) return null;
  
  const countryCounts: Record<string, number> = {};
  countries.forEach((c: string) => {
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  
  const totalMembers = countries.length;
  const mapPoints: MapPoint[] = [];
  const regionalOffices: MapPoint[] = [];
  
  Object.entries(countryCounts).forEach(([country, count]) => {
    const mapping = countryMapping[country];
    if (mapping) {
      const point: MapPoint = {
        country: mapping.name,
        code: mapping.code,
        count,
        percentage: parseFloat(((count / totalMembers) * 100).toFixed(1)),
        coordinates: mapping.coords,
        region: mapping.region,
        isRegionalOffice: ['EP', 'WO'].includes(mapping.code)
      };
      
      if (point.isRegionalOffice) {
        regionalOffices.push(point);
      } else {
        mapPoints.push(point);
      }
    }
  });
  
  return {
    publicationNumber: patent.publicationNumber,
    title: patent.title,
    totalFamilyMembers: totalMembers,
    uniqueJurisdictions: Object.keys(countryCounts).length,
    mapPoints: mapPoints.sort((a, b) => b.count - a.count),
    regionalOffices: regionalOffices.sort((a, b) => b.count - a.count)
  };
};