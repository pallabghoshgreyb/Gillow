
export enum TechLevel {
  DOMAIN = 'DOMAIN',
  SUBDOMAIN = 'SUBDOMAIN',
}

export type LicensingStatus = '' | 'Available' | 'Exclusive License' | 'Non-Exclusive License' | 'Sold' | 'Under Negotiation' | 'Not Available';

export interface PreviousDeal {
  licensee: string;
  date: string;
  value?: number;
  type: 'Exclusive' | 'Non-Exclusive' | 'Assignment';
}

export interface TechNode {
  id: string;
  name: string;
  level: TechLevel;
  domain: string;
  subdomain: string;
  x: number; 
  y: number; 
  radius: number;
  patentCount: number;
  growth: number;
  topAssignee: string;
  color: string;
  imageUrl: string;
}

export interface MaintenanceFees {
  year3_5: number;
  year7_5: number;
  year11_5: number;
  totalPending: number;
}

export interface PatentFlags {
  sep: boolean;
  opposition: boolean;
  ptab: boolean;
  litigation: boolean;
  governmentInterest: boolean;
}

export interface Patent {
  // IDENTIFIERS
  publicationNumber: string; 
  applicationNumber: string;
  patentType: string;
  title: string;
  
  // ENTITY & CLASSIFICATION
  entityType: string;
  gau: string;
  gauDefinition: string;
  
  // DATES
  filingDate: string;
  priorityDate: string;
  publicationDate: string;
  estimatedExpirationDate: string;
  
  // MAINTENANCE FEES
  maintenanceFees: MaintenanceFees;
  
  // PARTIES
  originalAssignees: string[];
  currentAssignees: string[];
  inventors: string[];
  applicants: string[];
  
  // TECHNOLOGY
  domain: string;
  subdomain: string;
  cpcs: string[];
  ipcs: string[];
  
  // CONTENT
  abstract: string;
  
  // LEGAL STATUS
  legalStatus: string;
  simpleLegalStatus: string;
  
  // CITATIONS
  backwardCitations: string[];
  forwardCitations: string[];
  backwardCitationsCount: number;
  forwardCitationsCount: number;
  
  // FLAGS
  flags: PatentFlags;
  
  // FAMILY
  countries: string[];
  inpadocFamilyMembers: string[];
  familySize: number;

  // MARKETPLACE EXTENSIONS
  id: string; 
  askingPrice?: number;
  valuationEstimate: number;
  qualityScore: number;
  jurisdiction: string; 
  licensingStatus: LicensingStatus;
  previousDeals: PreviousDeal[];

  // VALUATION COMPONENTS
  valuationMetrics: {
    technicalQuality: number;
    marketBreadth: number;
    enforcementStrength: number;
    strategicValue: number;
    marketValue: number;
    technologyValue: number;
    economicValue: number;
    legalValue: number;
  };

  // TRL
  technologyReadinessLevel: number;
  trlDescription: string;
  commercialApplications: string[];

  // MARKET DATA
  marketSector: string;
  totalAddressableMarket: number;
  marketGrowthRate: number;
  keyCompetitors: string[];
  marketRegion: string[];

  // RISK ASSESSMENT
  infringementRiskScore: number;
  ftoStatus: 'Clear' | 'Caution' | 'Blocked' | 'Unknown';
  keyProductCategories: string[];
  riskFactors: string[];

  // PORTFOLIO CONTEXT
  relatedPatents: string[];
  patentFamilyStrategy: '' | 'Single' | 'Continuation' | 'Divisional' | 'CIP' | 'Provisional';
  portfolioSegment: string;

  // PROSECUTION HISTORY
  officeActionsCount: number;
  firstActionDate: string;
  allowanceDate: string;
  rceCount: number;
  prosecutionDuration: number;

  // PROCEDURAL & STRATEGIC SIGNALS
  trackOneCodes: string[];
  nonPublicationCodes: string[];
  cipConDiv: string[];
  iprPgr: string[];
  fit: string[];
  largestFamilies: string[];

  // COMPONENT COMPATIBILITY
  assignee: {
    name: string;
    type: string;
  };
  status: string;
  citations: number;
  valuation: {
    current: number;
  };
  citationTrend: {
    year: number;
    citations: number;
  }[];

  // CLAIMS ANALYSIS
  independentClaimsCount: number;
  dependentClaimsCount: number;
  totalClaims: number;
}

export interface ChartDataPoint {
  year: number;
  count?: number;
  value?: number;
  citations?: number;
}

export interface MapPoint {
  country: string;
  code: string;
  count: number;
  percentage: number;
  coordinates: [number, number];
  region: string;
  isRegionalOffice: boolean;
}

export interface PatentGeographyData {
  publicationNumber: string;
  title: string;
  totalFamilyMembers: number;
  uniqueJurisdictions: number;
  mapPoints: MapPoint[];
  regionalOffices: MapPoint[];
}
