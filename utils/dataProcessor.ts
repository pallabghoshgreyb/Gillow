
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
  const countryRegionFromCountry: Record<string, string> = {
    'United States of America': 'North America',
    China: 'Asia',
    'Europe (EPO)': 'Europe',
    WIPO: 'International',
    Taiwan: 'Asia',
    Japan: 'Asia',
    'South Korea': 'Asia',
    Germany: 'Europe',
    Australia: 'Oceania',
    Mexico: 'North America',
    Brazil: 'South America',
    Canada: 'North America',
    Spain: 'Europe',
    'Hong Kong': 'Asia',
    Malaysia: 'Asia',
  };

  const isEmptyLike = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    const normalized = String(val).trim();
    return normalized === '' || normalized === '-' || normalized === '—' || normalized === 'nan' || normalized === 'FALSE' || normalized === 'None';
  };

  const hasRealValue = (val: any): boolean => {
    if (isEmptyLike(val)) return false;
    const normalized = String(val).trim();
    const normalizedCurrency = normalized.replace(/[$,]/g, '').trim();
    return normalizedCurrency !== '' && normalizedCurrency !== '-';
  };

  const firstPresentValue = (...values: any[]) => values.find((value) => hasRealValue(value));

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

  const splitCitationList = (val: any): string[] => {
    if (isEmptyLike(val)) return [];
    return String(val)
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s && s !== '0');
  };

  const cleanNumeric = (val: any): number => {
    if (isEmptyLike(val)) return 0;
    return parseInt(String(val).replace(/[$,]/g, '')) || 0;
  };

  const normalizeText = (val: any): string => (isEmptyLike(val) ? '' : String(val).trim());

  const normalizeAbstract = (val: any): string =>
    normalizeText(val)
      .replace(/<img\b[^>]*>/gi, ' ')
      .replace(/<\/?[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizeFtoStatus = (val: any): Patent['ftoStatus'] => {
    if (isEmptyLike(val)) return 'Unknown';
    const normalized = String(val).trim().toLowerCase();
    if (normalized === 'clear') return 'Clear';
    if (normalized === 'blocked') return 'Blocked';
    if (normalized === 'caution' || normalized === 'pending') return 'Caution';
    return 'Unknown';
  };

  const normalizeMaintenanceText = (val: any): string => {
    if (isEmptyLike(val)) return '';
    return String(val).trim();
  };

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

  const regionsFromCountries = (values: string[]): string[] =>
    Array.from(
      new Set(
        values
          .map((value) => countryRegionFromCountry[value])
          .filter((value): value is string => Boolean(value)),
      ),
    );

  const deriveMarketSector = (explicitValue: any, regions: string[]): string => {
    const explicit = normalizeText(explicitValue);
    if (explicit) return explicit;
    if (regions.length === 1) return `${regions[0]} coverage`;
    if (regions.length > 1) return 'Multi-region coverage';
    return '';
  };

  const derivePatentFamilyStrategy = (
    explicitValue: any,
    cipConDivValues: string[],
    countries: string[],
  ): Patent['patentFamilyStrategy'] => {
    const explicit = normalizeText(explicitValue).toLowerCase();
    if (explicit === 'single') return 'Single';
    if (explicit === 'continuation') return 'Continuation';
    if (explicit === 'divisional') return 'Divisional';
    if (explicit === 'cip') return 'CIP';
    if (explicit === 'provisional') return 'Provisional';

    const normalizedSignals = cipConDivValues.map((value) => value.trim().toUpperCase());
    if (normalizedSignals.includes('CIP')) return 'CIP';
    if (normalizedSignals.includes('DIV')) return 'Divisional';
    if (normalizedSignals.includes('CON')) return 'Continuation';
    if (countries.length <= 1) return 'Single';
    return '';
  };

  const pubNum = normalizeText(row['Publication Number']);
  const currentAssignees = splitPipe(row['Current Assignees']);
  const originalAssignees = splitPipe(row['Original Assignees']);
  const forwardCitations = splitCitationList(firstPresentValue(
    row['Forward Citations'],
    row['Forward Citing Patents'],
  ));
  const backwardCitations = splitCitationList(firstPresentValue(
    row['Backward Citations'],
    row['Backward Cited Patents'],
  ));

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
  const marketSector = normalizeText(row['Market Sector']);
  const totalAddressableMarket = cleanNumeric(row['Total Addressable Market USD']);
  const parsedMarketGrowthRate = parseFloat(String(row['Market Growth Rate'] || '0'));
  const marketGrowthRate = Number.isFinite(parsedMarketGrowthRate) ? parsedMarketGrowthRate : 0;
  const keyCompetitors = splitComma(row['Key Competitors']);
  const explicitMarketRegion = splitComma(
    firstPresentValue(row['Market Region'], row['Geographical Distribution'], row['Geo Graphical Distribution']),
  );

  // Risk Assessment
  const infringementRiskScore = cleanNumeric(row['Infringement Risk Score']);
  const ftoStatus = normalizeFtoStatus(row['FTO Status']);
  const keyProductCategories = splitComma(row['Key Product Categories']);
  const riskFactors = splitComma(row['Risk Factors']);

  // Portfolio Context
  const relatedPatents = splitPipe(row['Related Patents']);
  const rawPatentFamilyStrategy = firstPresentValue(
    row['Patent Family Strategy'],
    row['Geographical Distribution'],
    row['Geo Graphical Distribution'],
  );
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
  const derivedRegions = regionsFromCountries(countries);
  const marketRegion = explicitMarketRegion.length > 0 ? explicitMarketRegion : derivedRegions;
  const resolvedMarketSector = deriveMarketSector(row['Market Sector'], marketRegion);
  const patentFamilyStrategy = derivePatentFamilyStrategy(rawPatentFamilyStrategy, cipConDiv, countries);

  const declaredValuation = cleanNumeric(firstPresentValue(
    row['Patent Valuation'],
    row['Patsnap Value'],
    row['Asking Price USD'],
  ));
  const strategicValue = cleanNumeric(row['Strategic value']);
  const marketValue = cleanNumeric(row['Market value']);
  const technologyValue = cleanNumeric(row['Technology value']);
  const economicValue = cleanNumeric(row['Economic value']);
  const legalValue = cleanNumeric(row['Legal value']);
  const valuationEstimate = declaredValuation;
  const askingPriceValue = firstPresentValue(
    row['Asking Price USD'],
    row['Patsnap Value'],
    row['Patent Valuation'],
  );
  const askingPrice = askingPriceValue ? cleanNumeric(askingPriceValue) : undefined;
  const backwardCitationsCount = cleanNumeric(firstPresentValue(
    row['Count of Backward Citation'],
    row['Backward Citations Count'],
  )) || backwardCitations.length;
  const forwardCitationsCount = cleanNumeric(firstPresentValue(
    row['Count of Forward Citation'],
    row['Forward Citations Count'],
  )) || forwardCitations.length;
  const independentClaimsCount = cleanNumeric(row['Independent Claims Count']);
  const dependentClaimsCount = cleanNumeric(row['Dependent Claims Count']);
  const explicitQualityInputs = [
    strategicValue,
    marketValue,
    technologyValue,
    economicValue,
    legalValue,
  ].filter((value) => value > 0);
  const qualityScore = explicitQualityInputs.length > 0
    ? Math.round(explicitQualityInputs.reduce((sum, value) => sum + value, 0) / explicitQualityInputs.length)
    : 0;

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
      totalPending: cleanNumeric(row['Total Pending Fee']),
      year3_5Text: normalizeMaintenanceText(row['3.5 years']),
      year7_5Text: normalizeMaintenanceText(row['7.5 Years']),
      year11_5Text: normalizeMaintenanceText(row['11.5 Years']),
      totalPendingText: normalizeMaintenanceText(row['Total Pending Fee']),
    },
    originalAssignees,
    currentAssignees,
    inventors: splitPipe(row['Inventors']),
    applicants: splitPipe(row['Applicants']),
    domain: normalizeText(row['Domain']),
    subdomain: normalizeText(row['Subdomain']),
    cpcs: splitPipe(row['CPCs']),
    ipcs: splitPipe(row['IPCs']),
    abstract: normalizeAbstract(row['Abstract']),
    legalStatus: normalizeText(row['Legal Status']),
    simpleLegalStatus: normalizeText(row['Simple Legal Status']),
    backwardCitations,
    forwardCitations,
    backwardCitationsCount,
    forwardCitationsCount,
    flags: {
      sep: ['yes', 'true', '1'].includes(String(row['SEP Flag'] || row['SEP'] || '').trim().toLowerCase()),
      opposition: ['true', 'yes', '1'].includes(String(firstPresentValue(row['Oppositions Flag'], row['Opposition Flag']) || '').trim().toLowerCase()),
      ptab: ['true', 'yes', '1'].includes(String(firstPresentValue(row['PTAB Flag'], row['PTAB']) || '').trim().toLowerCase()),
      litigation: ['yes', 'true', '1'].includes(String(row['Litigation Flag'] || row['Litigation'] || '').trim().toLowerCase()),
      governmentInterest: ['yes', 'true', 'government interest'].includes(String(row['Govt. Interest'] || '').trim().toLowerCase())
    },
    countries,
    inpadocFamilyMembers: inpadocMembers,
    familySize: inpadocMembers.length,
    
    askingPrice,
    valuationEstimate,
    qualityScore,
    jurisdiction: pubNum.substring(0, 2),
    licensingStatus,
    previousDeals,
    valuationMetrics: {
        technicalQuality: technologyValue,
        marketBreadth: marketValue,
        enforcementStrength: legalValue,
        strategicValue,
        marketValue,
        technologyValue,
        economicValue,
        legalValue
    },
    technologyReadinessLevel,
    trlDescription,
    commercialApplications,
    marketSector: resolvedMarketSector,
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
    citations: forwardCitationsCount,
    independentClaimsCount,
    dependentClaimsCount,
    totalClaims: independentClaimsCount + dependentClaimsCount,
    valuation: { current: valuationEstimate },
    citationTrend: [],
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
  const normalizeStatus = (value: string): 'paid' | 'pending' | 'overdue' => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return 'pending';
    if (normalized.includes('paid')) return 'paid';
    if (normalized.includes('not due')) return 'pending';
    if (normalized.includes('due soon')) return 'pending';
    if (normalized.includes('unpaid') || normalized.includes('overdue') || normalized.includes('late')) return 'overdue';
    return 'pending';
  };
  
  const getSafeDate = (offsetYears: number) => {
    if (!isValidDate) return new Date();
    return new Date(filingDate.getTime() + (offsetYears * 365.25 * 24 * 60 * 60 * 1000));
  };

  const due3_5 = getSafeDate(3.5);
  const due7_5 = getSafeDate(7.5);
  const due11_5 = getSafeDate(11.5);
  
  const { maintenanceFees } = patent;
  const textStatuses = [
    maintenanceFees.year3_5Text,
    maintenanceFees.year7_5Text,
    maintenanceFees.year11_5Text,
  ].some((value) => value.trim());

  let status3_5: 'paid' | 'pending' | 'overdue' = textStatuses
    ? normalizeStatus(maintenanceFees.year3_5Text)
    : 'pending';
  let status7_5: 'paid' | 'pending' | 'overdue' = textStatuses
    ? normalizeStatus(maintenanceFees.year7_5Text)
    : 'pending';
  let status11_5: 'paid' | 'pending' | 'overdue' = textStatuses
    ? normalizeStatus(maintenanceFees.year11_5Text)
    : 'pending';
  
  if (!textStatuses) {
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
  }
  
  return {
    year_3_5: { amount: maintenanceFees.year3_5, dueDate: due3_5.toISOString().split('T')[0], status: status3_5 },
    year_7_5: { amount: maintenanceFees.year7_5, dueDate: due7_5.toISOString().split('T')[0], status: status7_5 },
    year_11_5: { amount: maintenanceFees.year11_5, dueDate: due11_5.toISOString().split('T')[0], status: status11_5 },
    totalPending: maintenanceFees.totalPending,
    totalPaid: (maintenanceFees.year3_5 + maintenanceFees.year7_5 + maintenanceFees.year11_5) - maintenanceFees.totalPending
  };
};
