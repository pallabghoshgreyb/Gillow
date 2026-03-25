
import { Patent, LicensingStatus, PreviousDeal } from '../types';

export const TRL_DESCRIPTIONS: Record<number, string> = {
  1: "Basic principles observed",
  2: "Technology concept formulated",
  3: "Experimental proof of concept",
  4: "Technology validated in lab",
  5: "Technology validated in relevant environment",
  6: "Technology demonstrated in relevant environment",
  7: "System prototype demonstration",
  8: "System complete and qualified",
  9: "Actual system proven in operational environment"
};

export const calculateClaimMetrics = (patent: Patent) => {
  const totalClaims = patent.independentClaimsCount + patent.dependentClaimsCount;
  
  // Breadth score based on independent claims
  let claimBreadthScore: 'Narrow' | 'Medium' | 'Broad';
  if (patent.independentClaimsCount >= 4) claimBreadthScore = 'Broad';
  else if (patent.independentClaimsCount >= 2) claimBreadthScore = 'Medium';
  else claimBreadthScore = 'Narrow';
  
  return { totalClaims, claimBreadthScore };
};

export const parsePatentRow = (row: any): Patent => {
  const familyCountryFromPrefix: Record<string, string> = {
    US: 'United States of America',
    CN: 'China',
    EP: 'Europe (EPO)',
    WO: 'WIPO',
    TW: 'Taiwan',
    JP: 'Japan',
    KR: 'South Korea',
    DE: 'Germany',
    AU: 'Australia',
    MX: 'Mexico',
    BR: 'Brazil',
    CA: 'Canada',
    ES: 'Spain',
    HK: 'Hong Kong',
    MY: 'Malaysia',
  };

  const isEmptyLike = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    const normalized = String(val).trim();
    return normalized === '' || normalized === '-' || normalized === '—' || normalized === 'nan' || normalized === 'FALSE' || normalized === 'None';
  };

  const splitPipe = (val: any): string[] => {
    if (isEmptyLike(val)) return [];
    return String(val).split('|').map(s => s.trim()).filter(s => s);
  };

  const splitFlexible = (val: any): string[] => {
    if (isEmptyLike(val)) return [];
    return String(val)
      .split(/[|,;]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== '-' && s !== '—');
  };

  const splitComma = (val: any): string[] => {
    if (isEmptyLike(val)) return [];
    return String(val).split(',').map(s => s.trim()).filter(s => s);
  };

  const cleanNumeric = (val: any): number => {
    if (isEmptyLike(val)) return 0;
    return parseInt(String(val).replace(/[$,]/g, '')) || 0;
  };

  const normalizeText = (val: any): string => (isEmptyLike(val) ? '' : String(val));

  const formatDateValue = (val: any): string => {
    if (isEmptyLike(val)) return '';
    const raw = String(val).trim();
    if (/^\d{5}$/.test(raw)) {
      const serial = parseInt(raw, 10);
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const converted = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
      return converted.toISOString().split('T')[0];
    }
    return raw;
  };

  const normalizeCountryValue = (value: string): string => {
    const normalized = value.trim();
    return familyCountryFromPrefix[normalized.toUpperCase()] || normalized;
  };

  const pubNum = String(row['Publication Number'] || '');
  const currentAssignees = splitPipe(row['Current Assignees']);
  const originalAssignees = splitPipe(row['Original Assignees']);
  const forwardCitations = splitPipe(row['Forward Citations']);
  const backwardCitations = splitPipe(row['Backward Citations']);

  // Licensing Data
  const licensingStatus = String(row['Licensing Status'] || '') as LicensingStatus;
  const rawDeals = row['Previous Deals JSON'];
  let previousDeals: PreviousDeal[] = [];
  try {
    previousDeals = rawDeals ? JSON.parse(rawDeals) : [];
  } catch (e) {
    previousDeals = [];
  }

  // TRL Data
  const technologyReadinessLevel = cleanNumeric(row['Technology Readiness Level']);
  const trlDescription = technologyReadinessLevel ? (TRL_DESCRIPTIONS[technologyReadinessLevel] || '') : '';
  const commercialApplications = splitPipe(row['Commercial Applications']);

  // Market Data
  const marketSector = normalizeText(row['Domain'] || row['Market Sector']);
  const totalAddressableMarket = cleanNumeric(row['Total Addressable Market USD']);
  const marketGrowthRate = parseFloat(String(row['Market Growth Rate'] || '0'));
  const keyCompetitors = splitComma(row['Key Competitors']);
  const marketRegion = splitComma(row['Market Region']);

  // Risk Assessment
  const infringementRiskScore = cleanNumeric(row['Infringement Risk Score']);
  const ftoStatus = (row['FTO Status'] as any) || 'Unknown';
  const keyProductCategories = splitComma(row['Key Product Categories']);
  const riskFactors = splitComma(row['Risk Factors']);

  // Portfolio Context
  const relatedPatents = splitPipe(row['Related Patents']);
  const patentFamilyStrategy = String(row['Patent Family Strategy'] || '') as Patent['patentFamilyStrategy'];
  const portfolioSegment = String(row['Portfolio Segment'] || '');
  const trackOneCodes = splitFlexible(row['Track-One Codes']);
  const nonPublicationCodes = splitFlexible(row['Non-Publication Codes']);
  const cipConDiv = splitFlexible(row['CIP/CON/DIV']);
  const iprPgr = splitFlexible(row['IPR/PGR']);
  const fit = splitFlexible(row['FIT']);
  const largestFamilies = splitFlexible(row['Largest Families']);

  // Prosecution History
  const officeActionsCount = cleanNumeric(row['Office Actions Count']);
  const firstActionDate = String(row['First Action Date'] || '');
  const allowanceDate = String(row['Allowance Date'] || '');
  const rceCount = cleanNumeric(row['RCE Count']);
  
  // Calculate Duration
  const filingDate = new Date(formatDateValue(row['Filing Date']));
  const grantDate = new Date(formatDateValue(row['Publication Date']));
  let prosecutionDuration = 0;
  if (!isNaN(filingDate.getTime()) && !isNaN(grantDate.getTime())) {
    prosecutionDuration = Math.ceil((grantDate.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const inpadocMembers = splitPipe(row['INPADOC Family Members'] || row['INPADOC Family Members (Beta) - 1']);
  const familyJurisdictions = inpadocMembers
    .map((member) => String(member).trim().toUpperCase().slice(0, 2))
    .map((prefix) => familyCountryFromPrefix[prefix])
    .filter((country): country is string => Boolean(country));
  const explicitCountries = splitPipe(row['Country'] || row['Country Code']).map(normalizeCountryValue);
  const countries = familyJurisdictions.length > 0 ? familyJurisdictions : explicitCountries;

  // Dynamic Valuation Algorithm
  const numericTail = parseInt(pubNum.replace(/\D/g, '').slice(-4)) || 0;
  const techScore = 60 + (forwardCitations.length * 2) + (numericTail % 20) + (technologyReadinessLevel * 2);
  const marketScore = 50 + (countries.length * 4);
  const legalScore = ['true', 'yes', '1'].includes(String(row['Litigation Flag'] || row['Litigation'] || '').trim().toLowerCase()) ? 95 : 70;

  const valuationEstimate = (techScore * 5000) + (marketScore * 10000) + (legalScore * 2000);
  const askingPrice = row['Asking Price USD'] ? cleanNumeric(row['Asking Price USD']) : undefined;
  const independentClaimsCount = cleanNumeric(row['Independent Claims Count']);
  const dependentClaimsCount = cleanNumeric(row['Dependent Claims Count']);

  return {
    id: pubNum,
    publicationNumber: pubNum,
    applicationNumber: normalizeText(row['Application Number']),
    patentType: String(row['Patent Type'] || 'Utility'),
    title: normalizeText(row['Title']),
    entityType: normalizeText(row['Entity Type']),
    gau: normalizeText(row['GAU']),
    gauDefinition: normalizeText(row['GAU - Definiations'] || row['GAU Definitions']),
    filingDate: formatDateValue(row['Filing Date']),
    priorityDate: formatDateValue(row['Priority Date']),
    publicationDate: formatDateValue(row['Publication Date']),
    estimatedExpirationDate: formatDateValue(row['Estimated Expiration Date']),
    maintenanceFees: {
      year3_5: cleanNumeric(row['3.5 years']),
      year7_5: cleanNumeric(row['7.5 Years']),
      year11_5: cleanNumeric(row['11.5 Years']),
      totalPending: cleanNumeric(row['Total Pending Fee'])
    },
    originalAssignees,
    currentAssignees,
    inventors: splitPipe(row['Inventors']),
    applicants: splitPipe(row['Applicants']),
    domain: normalizeText(row['Domain']),
    subdomain: normalizeText(row['Subdomain']),
    cpcs: splitPipe(row['CPCs']),
    ipcs: splitPipe(row['IPCs']),
    abstract: normalizeText(row['Abstract']),
    legalStatus: normalizeText(row['Legal Status']),
    simpleLegalStatus: normalizeText(row['Simple Legal Status']),
    backwardCitations,
    forwardCitations,
    backwardCitationsCount: backwardCitations.length,
    forwardCitationsCount: forwardCitations.length,
    flags: {
      sep: ['yes', 'true', '1'].includes(String(row['SEP Flag'] || row['SEP'] || '').trim().toLowerCase()),
      opposition: String(row['Oppositions Flag'] || '').toUpperCase() === 'TRUE',
      ptab: String(row['PTAB Flag'] || '').toUpperCase() === 'TRUE',
      litigation: ['yes', 'true', '1'].includes(String(row['Litigation Flag'] || row['Litigation'] || '').trim().toLowerCase()),
      governmentInterest: ['yes', 'true', 'government interest'].includes(String(row['Govt. Interest'] || '').trim().toLowerCase())
    },
    countries,
    inpadocFamilyMembers: inpadocMembers,
    familySize: inpadocMembers.length,
    
    askingPrice,
    valuationEstimate,
    qualityScore: Math.round((techScore + marketScore + legalScore) / 3),
    jurisdiction: pubNum.substring(0, 2),
    licensingStatus,
    previousDeals,
    valuationMetrics: {
        technicalQuality: Math.min(techScore, 100),
        marketBreadth: Math.min(marketScore, 100),
        enforcementStrength: Math.min(legalScore, 100)
    },
    technologyReadinessLevel,
    trlDescription,
    commercialApplications,
    marketSector,
    totalAddressableMarket,
    marketGrowthRate,
    keyCompetitors,
    marketRegion,
    infringementRiskScore,
    ftoStatus,
    keyProductCategories,
    riskFactors,
    relatedPatents,
    patentFamilyStrategy,
    portfolioSegment,
    officeActionsCount,
    firstActionDate: formatDateValue(firstActionDate),
    allowanceDate: formatDateValue(allowanceDate),
    rceCount,
    prosecutionDuration,
    trackOneCodes,
    nonPublicationCodes,
    cipConDiv,
    iprPgr,
    fit,
    largestFamilies,

    // Legacy fields
    status: normalizeText(row['Legal Status']),
    citations: forwardCitations.length,
    independentClaimsCount,
    dependentClaimsCount,
    totalClaims: independentClaimsCount + dependentClaimsCount,
    valuation: { current: valuationEstimate },
    citationTrend: [
      { year: 2021, citations: Math.floor(Math.random() * 5) },
      { year: 2022, citations: Math.floor(Math.random() * 10) },
      { year: 2023, citations: Math.floor(Math.random() * 15) },
      { year: 2024, citations: forwardCitations.length },
    ],
    assignee: {
      name: currentAssignees[0] || originalAssignees[0] || 'Unknown',
      type: normalizeText(row['Entity Type']) || 'Company'
    }
  };
};

export const calculateMaintenanceStatus = (patent: Patent) => {
  const filingDate = new Date(patent.filingDate);
  const isValidDate = !isNaN(filingDate.getTime());
  const today = new Date();
  
  const getSafeDate = (offsetYears: number) => {
    if (!isValidDate) return new Date();
    return new Date(filingDate.getTime() + (offsetYears * 365.25 * 24 * 60 * 60 * 1000));
  };

  const due3_5 = getSafeDate(3.5);
  const due7_5 = getSafeDate(7.5);
  const due11_5 = getSafeDate(11.5);
  
  const { maintenanceFees } = patent;
  let status3_5: 'paid' | 'pending' | 'overdue' = 'pending';
  let status7_5: 'paid' | 'pending' | 'overdue' = 'pending';
  let status11_5: 'paid' | 'pending' | 'overdue' = 'pending';
  
  if (maintenanceFees.totalPending === 0) {
    status3_5 = status7_5 = status11_5 = 'paid';
  } else if (maintenanceFees.totalPending <= maintenanceFees.year11_5) {
    status3_5 = status7_5 = 'paid';
    status11_5 = today > due11_5 ? 'overdue' : 'pending';
  } else if (maintenanceFees.totalPending <= (maintenanceFees.year7_5 + maintenanceFees.year11_5)) {
    status3_5 = 'paid';
    status7_5 = today > due7_5 ? 'overdue' : 'pending';
    status11_5 = 'pending';
  } else {
    status3_5 = today > due3_5 ? 'overdue' : 'pending';
    status7_5 = status11_5 = 'pending';
  }
  
  return {
    year_3_5: { amount: maintenanceFees.year3_5, dueDate: due3_5.toISOString().split('T')[0], status: status3_5 },
    year_7_5: { amount: maintenanceFees.year7_5, dueDate: due7_5.toISOString().split('T')[0], status: status7_5 },
    year_11_5: { amount: maintenanceFees.year11_5, dueDate: due11_5.toISOString().split('T')[0], status: status11_5 },
    totalPending: maintenanceFees.totalPending,
    totalPaid: (maintenanceFees.year3_5 + maintenanceFees.year7_5 + maintenanceFees.year11_5) - maintenanceFees.totalPending
  };
};
