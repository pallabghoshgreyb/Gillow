
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

const VALUATION_SECTION_MAXIMUMS = {
  strategicValue: 10,
  marketValue: 20,
  technologyValue: 25,
  economicValue: 20,
  legalValue: 25,
} as const;

const TOTAL_VALUATION_SECTION_MAXIMUM = Object.values(VALUATION_SECTION_MAXIMUMS)
  .reduce((sum, value) => sum + value, 0);

export const calculateClaimMetrics = (patent: Patent) => {
  const totalClaims = patent.independentClaimsCount + patent.dependentClaimsCount;
  
  // Breadth score based on independent claims
  let claimBreadthScore: 'Narrow' | 'Medium' | 'Broad';
  if (patent.independentClaimsCount >= 4) claimBreadthScore = 'Broad';
  else if (patent.independentClaimsCount >= 2) claimBreadthScore = 'Medium';
  else claimBreadthScore = 'Narrow';
  
  return { totalClaims, claimBreadthScore };
};

// ============================================================================
// MAINTENANCE FEE CALCULATION HELPERS
// ============================================================================

/**
 * Normalize entity type to a standard format (Large, Small, Micro).
 * @param entityType Raw entity type string from input
 * @returns Normalized entity type or null if invalid
 */
export const normalizeEntityType = (entityType: any): 'Large' | 'Small' | 'Micro' | null => {
  if (!entityType) return null;
  const normalized = String(entityType).trim().toLowerCase();
  if (normalized === 'large' || normalized === 'large entity') return 'Large';
  if (normalized === 'small' || normalized === 'small entity') return 'Small';
  if (normalized === 'micro' || normalized === 'micro entity') return 'Micro';
  return null;
};

/**
 * Check if a maintenance fee status indicates the fee is paid.
 * @param value Status value from input ("Paid" or "Not Paid")
 * @returns True only when the normalized value is exactly "paid"
 */
export const isPaid = (value: any): boolean => {
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'paid';
};

export type MaintenanceLifecycleStatus =
  | 'Not Applicable'
  | 'Upcoming'
  | 'Payment Window Open'
  | 'Due Soon'
  | 'Delinquent'
  | 'Lapsed'
  | 'Current'
  | 'Paid';

export type MaintenancePaymentStatus = 'paid' | 'pending' | 'overdue' | 'not_applicable';

export interface MaintenanceStageStatus {
  amount: number;
  dueDate: string | null;
  paymentWindowStartDate: string | null;
  paymentWindowEndDate: string | null;
  status: MaintenancePaymentStatus;
  lifecycleStatus: MaintenanceLifecycleStatus;
  daysUntilDue: number | null;
  daysUntilWindowOpen: number | null;
  daysUntilGraceEnds: number | null;
}

export interface MaintenanceStatusSummary {
  isApplicable: boolean;
  scheduleBasis: 'grant' | 'not_applicable';
  anchorDate: string | null;
  overallStatus: MaintenanceLifecycleStatus;
  nextEventLabel: string;
  nextEventDate: string | null;
  daysUntilNextEvent: number | null;
  paymentWindowOpen: boolean;
  year_3_5: MaintenanceStageStatus;
  year_7_5: MaintenanceStageStatus;
  year_11_5: MaintenanceStageStatus;
  totalPending: number;
  totalPaid: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PAYMENT_WINDOW_MONTHS = 6;
const PAYMENT_GRACE_MONTHS = 6;
const DUE_SOON_DAYS = 90;

const parseDateOnly = (value?: string | null): Date | null => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00Z`)
    : new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatIsoDate = (date: Date | null): string | null =>
  date ? date.toISOString().split('T')[0] : null;

const addCalendarMonths = (date: Date, months: number): Date => {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
};

const addMaintenanceDueDate = (anchor: Date, years: number): Date => {
  const next = new Date(anchor.getTime());
  next.setFullYear(next.getFullYear() + years);
  next.setMonth(next.getMonth() + 6);
  return next;
};

const diffDays = (future: Date, current: Date) =>
  Math.ceil((future.getTime() - current.getTime()) / DAY_MS);

export const isMaintenanceApplicablePatentType = (patentType: any): boolean => {
  const normalized = String(patentType || '').trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('application')) return false;
  if (normalized.includes('design') || normalized.includes('plant')) return false;
  if (normalized.includes('reissue')) return true;
  return normalized.includes('grant') || normalized.includes('issue') || normalized.includes('utility');
};

const getMaintenanceAnchorDate = (patent: Patent): Date | null => {
  if (!isMaintenanceApplicablePatentType(patent.patentType)) return null;

  const candidateDate = parseDateOnly(
    patent.originalGrantDate || patent.grantDate || patent.publicationDate || patent.allowanceDate,
  );

  return candidateDate;
};

const classifyMaintenanceStage = (
  amount: number,
  dueDate: Date | null,
  today: Date,
  isApplicable: boolean,
  rawStatus: string,
): MaintenanceStageStatus => {
  const paymentWindowStartDate = dueDate ? addCalendarMonths(dueDate, -PAYMENT_WINDOW_MONTHS) : null;
  const paymentWindowEndDate = dueDate ? addCalendarMonths(dueDate, PAYMENT_GRACE_MONTHS) : null;

  if (!isApplicable) {
    return {
      amount,
      dueDate: formatIsoDate(dueDate),
      paymentWindowStartDate: formatIsoDate(paymentWindowStartDate),
      paymentWindowEndDate: formatIsoDate(paymentWindowEndDate),
      status: 'not_applicable',
      lifecycleStatus: 'Not Applicable',
      daysUntilDue: null,
      daysUntilWindowOpen: null,
      daysUntilGraceEnds: null,
    };
  }

  const paid = isPaid(rawStatus);
  const daysUntilDue = dueDate ? diffDays(dueDate, today) : null;
  const daysUntilWindowOpen = paymentWindowStartDate ? diffDays(paymentWindowStartDate, today) : null;
  const daysUntilGraceEnds = paymentWindowEndDate ? diffDays(paymentWindowEndDate, today) : null;

  let lifecycleStatus: MaintenanceLifecycleStatus = 'Upcoming';
  let paymentState: MaintenancePaymentStatus = 'pending';

  if (paid) {
    lifecycleStatus = 'Paid';
    paymentState = 'paid';
  } else if (!dueDate) {
    lifecycleStatus = 'Upcoming';
    paymentState = 'pending';
  } else if (paymentWindowStartDate && today < paymentWindowStartDate) {
    lifecycleStatus = 'Upcoming';
    paymentState = 'pending';
  } else if (daysUntilDue !== null && daysUntilDue > DUE_SOON_DAYS) {
    lifecycleStatus = 'Payment Window Open';
    paymentState = 'pending';
  } else if (daysUntilDue !== null && daysUntilDue >= 0) {
    lifecycleStatus = 'Due Soon';
    paymentState = 'pending';
  } else if (daysUntilGraceEnds !== null && daysUntilGraceEnds >= 0) {
    lifecycleStatus = 'Delinquent';
    paymentState = 'overdue';
  } else {
    lifecycleStatus = 'Lapsed';
    paymentState = 'overdue';
  }

  return {
    amount,
    dueDate: formatIsoDate(dueDate),
    paymentWindowStartDate: formatIsoDate(paymentWindowStartDate),
    paymentWindowEndDate: formatIsoDate(paymentWindowEndDate),
    status: paymentState,
    lifecycleStatus,
    daysUntilDue,
    daysUntilWindowOpen,
    daysUntilGraceEnds,
  };
};

/**
 * Get the maintenance fee amount for a given entity type and stage.
 * @param entityType Normalized entity type (Large, Small, Micro)
 * @param stage Stage key: '3.5' | '7.5' | '11.5'
 * @returns Fee amount in USD or 0 if invalid
 */
export const getFeeAmount = (
  entityType: 'Large' | 'Small' | 'Micro' | null,
  stage: '3.5' | '7.5' | '11.5',
): number => {
  const feeStructure: Record<string, Record<string, number>> = {
    Large: { '3.5': 2150, '7.5': 4040, '11.5': 8280 },
    Small: { '3.5': 860, '7.5': 1616, '11.5': 3312 },
    Micro: { '3.5': 430, '7.5': 808, '11.5': 1656 },
  };
  if (!entityType || !feeStructure[entityType]) return 0;
  return feeStructure[entityType][stage] || 0;
};

/**
 * Calculate total pending maintenance fees for a patent record.
 * @param record Patent record with entity type and three maintenance fee status columns
 * @returns Calculated total pending fee amount (0 if all paid; null if invalid entity type)
 */
export const calculateTotalPendingFee = (record: any): number | null => {
  const entityType = normalizeEntityType(record['Entity Type']);
  if (!entityType) {
    return null; // Invalid or missing entity type
  }

  if (!isMaintenanceApplicablePatentType(record['Patent Type'])) {
    return 0;
  }

  const stages: Array<'3.5' | '7.5' | '11.5'> = ['3.5', '7.5', '11.5'];
  let totalFee = 0;

  stages.forEach((stage) => {
    const columnName = stage === '3.5' ? '3.5 years' : stage === '7.5' ? '7.5 Years' : '11.5 Years';
    const statusValue = record[columnName];
    const paid = isPaid(statusValue);

    if (!paid) {
      const feeAmount = getFeeAmount(entityType, stage);
      totalFee += feeAmount;
    }
  });

  return totalFee;
};

// ============================================================================
// END MAINTENANCE FEE CALCULATION
// ============================================================================

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
    const normalizedLower = normalized.toLowerCase();
    return normalized === ''
      || normalized === '-'
      || normalized === '—'
      || normalizedLower === 'nan'
      || normalizedLower === 'false'
      || normalizedLower === 'none';
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
    return String(val).split('|').map(s => s.trim()).filter(s => !isEmptyLike(s));
  };

  const splitPatentNumbers = (val: any): string[] =>
    Array.from(new Set(splitPipe(val).map((value) => value.trim().toUpperCase()).filter((value) => !isEmptyLike(value))));

  const splitFlexible = (val: any): string[] => {
    if (isEmptyLike(val)) return [];
    return String(val)
      .split(/[|,;]+/)
      .map((s) => s.trim())
      .filter((s) => !isEmptyLike(s));
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
      .filter((s) => !isEmptyLike(s) && s !== '0');
  };

  const cleanNumeric = (val: any): number => {
    if (isEmptyLike(val)) return 0;
    return parseInt(String(val).replace(/[$,]/g, '')) || 0;
  };

  const cleanValuationScore = (val: any): number => {
    if (isEmptyLike(val)) return 0;
    const parsed = Number.parseFloat(String(val).replace(/[$,%\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeValuationSectionScore = (val: any, maximum: number): number => {
    if (!hasRealValue(val) || maximum <= 0) return 0;
    const rawScore = Math.min(maximum, Math.max(0, cleanValuationScore(val)));
    return Math.round((rawScore / maximum) * 100);
  };

  const boundedValuationSectionScore = (val: any, maximum: number): number => {
    if (!hasRealValue(val) || maximum <= 0) return 0;
    return Math.min(maximum, Math.max(0, cleanValuationScore(val)));
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
    if (/^\d{13}$/.test(raw)) {
      const converted = new Date(Number(raw));
      return Number.isNaN(converted.getTime()) ? raw : converted.toISOString().split('T')[0];
    }
    if (/^\d{10}$/.test(raw)) {
      const converted = new Date(Number(raw) * 1000);
      return Number.isNaN(converted.getTime()) ? raw : converted.toISOString().split('T')[0];
    }
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
  const primaryCpc = normalizeText(row['CPCs (2)']);
  const forwardCitations = splitCitationList(firstPresentValue(
    row['Forward Citations'],
    row['Forward Citing Patents'],
    row['Forward Citing Patents or Forward Citations'],
  ));
  const backwardCitations = splitCitationList(firstPresentValue(
    row['Backward Citations'],
    row['Backward Cited Patents'],
    row['Backward Cited Patents or Backward Citations'],
  ));

  // Licensing Data
  const licensingStatus = normalizeText(row['Licensing Status']) as LicensingStatus;
  const rawDeals = normalizeText(row['Previous Deals JSON']);
  let previousDeals: PreviousDeal[] = [];
  try {
    const parsedDeals = rawDeals ? JSON.parse(rawDeals) : [];
    previousDeals = Array.isArray(parsedDeals) ? parsedDeals : [];
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
    firstPresentValue(
      row['Market Region'],
      row['Geographical Distribution'],
      row['Geo Graphical Distribution'],
      row['Market Region or Geographical Distribution or Geo Graphical Distribution'],
    ),
  );

  // Risk Assessment
  const infringementRiskScore = cleanNumeric(row['Infringement Risk Score']);
  const ftoStatus = normalizeFtoStatus(row['FTO Status']);
  const keyProductCategories = splitComma(row['Key Product Categories']);
  const riskFactors = splitComma(row['Risk Factors']);

  // Portfolio Context
  const relatedPatents = splitPipe(row['Related Patents']);
  const rawPatentFamilyStrategy = row['Patent Family Strategy'];
  const portfolioSegment = String(row['Portfolio Segment'] || '');
  const trackOneCodes = splitFlexible(row['Track-One Codes']);
  const nonPublicationCodes = splitFlexible(row['Non-Publication Codes']);
  const continuityPatentNumbers = {
    cip: splitPatentNumbers(row['CIP Patent Numbers']),
    con: splitPatentNumbers(row['CON Patent Numbers']),
    div: splitPatentNumbers(row['DIV Patent Numbers']),
  };
  const explicitContinuityRelations = [
    ...continuityPatentNumbers.cip.map(() => 'CIP'),
    ...continuityPatentNumbers.con.map(() => 'CON'),
    ...continuityPatentNumbers.div.map(() => 'DIV'),
  ];
  const cipConDiv = splitFlexible(row['CIP/CON/DIV']);
  const continuitySignals = cipConDiv.length > 0 ? cipConDiv : explicitContinuityRelations;
  const iprPgr = splitFlexible(row['IPR/PGR']);
  const fit = String(row['Patent Type'] || '').trim().toLowerCase() === 'granted'
    ? []
    : splitFlexible(row['FIT']);
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
  const explicitCountries = splitPipe(firstPresentValue(
    row['Country'],
    row['Country Code'],
    row['Country Code or Country'],
  )).map(normalizeCountryValue);
  const countries = familyJurisdictions.length > 0 ? familyJurisdictions : explicitCountries;
  const derivedRegions = regionsFromCountries(countries);
  const marketRegion = explicitMarketRegion.length > 0 ? explicitMarketRegion : derivedRegions;
  const patentFamilyStrategy = derivePatentFamilyStrategy(rawPatentFamilyStrategy, continuitySignals, countries);

  const declaredValuation = cleanNumeric(firstPresentValue(
    row['Patent Valuation'],
    row['Patsnap Value'],
    row['Asking Price USD'],
  ));
  const rawStrategicValue = boundedValuationSectionScore(
    row['Strategic value'],
    VALUATION_SECTION_MAXIMUMS.strategicValue,
  );
  const rawMarketValue = boundedValuationSectionScore(
    row['Market value'],
    VALUATION_SECTION_MAXIMUMS.marketValue,
  );
  const rawTechnologyValue = boundedValuationSectionScore(
    row['Technology value'],
    VALUATION_SECTION_MAXIMUMS.technologyValue,
  );
  const rawEconomicValue = boundedValuationSectionScore(
    row['Economic value'],
    VALUATION_SECTION_MAXIMUMS.economicValue,
  );
  const rawLegalValue = boundedValuationSectionScore(
    row['Legal value'],
    VALUATION_SECTION_MAXIMUMS.legalValue,
  );
  const strategicValue = normalizeValuationSectionScore(
    row['Strategic value'],
    VALUATION_SECTION_MAXIMUMS.strategicValue,
  );
  const marketValue = normalizeValuationSectionScore(
    row['Market value'],
    VALUATION_SECTION_MAXIMUMS.marketValue,
  );
  const technologyValue = normalizeValuationSectionScore(
    row['Technology value'],
    VALUATION_SECTION_MAXIMUMS.technologyValue,
  );
  const economicValue = normalizeValuationSectionScore(
    row['Economic value'],
    VALUATION_SECTION_MAXIMUMS.economicValue,
  );
  const legalValue = normalizeValuationSectionScore(
    row['Legal value'],
    VALUATION_SECTION_MAXIMUMS.legalValue,
  );
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
    row['Count of Backward Citation or Backward Citations Count'],
  )) || backwardCitations.length;
  const forwardCitationsCount = cleanNumeric(firstPresentValue(
    row['Count of Forward Citation'],
    row['Forward Citations Count'],
    row['Count of Forward Citation or Forward Citations Count'],
  )) || forwardCitations.length;
  const independentClaimsCount = cleanNumeric(row['Independent Claims Count']);
  const dependentClaimsCount = cleanNumeric(row['Dependent Claims Count']);
  const totalPatentScore = cleanValuationScore(row['Total Patent Score']);
  const qualityScore = Math.round(
    ((rawStrategicValue + rawMarketValue + rawTechnologyValue + rawEconomicValue + rawLegalValue) /
      TOTAL_VALUATION_SECTION_MAXIMUM) * 100,
  );
  const totalPendingFee = calculateTotalPendingFee(row) ?? 0;

  return {
    id: pubNum,
    publicationNumber: pubNum,
    applicationNumber: normalizeText(firstPresentValue(row['Application Number.1'], row['Application Number'])),
    patentType: normalizeText(row['Patent Type']),
    title: normalizeText(row['Title']),
    entityType: normalizeText(row['Entity Type']),
    gau: normalizeText(row['GAU']),
    gauDefinition: normalizeText(firstPresentValue(
      row['GAU - Definiations'],
      row['GAU Definitions'],
      row['GAU - Definiations or GAU Definitions'],
    )),
    filingDate: formatDateValue(row['Filing Date']),
    priorityDate: formatDateValue(row['Priority Date']),
    publicationDate: formatDateValue(row['Publication Date']),
    grantDate: formatDateValue(firstPresentValue(row['Grant Date'], row['Issue Date'], row['Publication Date'])),
    originalGrantDate: formatDateValue(firstPresentValue(row['Original Grant Date'], row['Original Issue Date'])),
    estimatedExpirationDate: formatDateValue(row['Estimated Expiration Date']),
    maintenanceFees: {
      year3_5: cleanNumeric(row['3.5 years']),
      year7_5: cleanNumeric(row['7.5 Years']),
      year11_5: cleanNumeric(row['11.5 Years']),
      totalPending: totalPendingFee,
      year3_5Text: normalizeMaintenanceText(row['3.5 years']),
      year7_5Text: normalizeMaintenanceText(row['7.5 Years']),
      year11_5Text: normalizeMaintenanceText(row['11.5 Years']),
      totalPendingText: '',
    },
    originalAssignees,
    currentAssignees,
    inventors: splitPipe(row['Inventors']),
    applicants: splitPipe(row['Applicants']),
    domain: normalizeText(row['Domain']),
    subdomain: normalizeText(row['Subdomain']),
    cpcs: splitPipe(row['CPCs']),
    primaryCpc,
    ipcs: splitPipe(row['IPCs']),
    abstract: normalizeAbstract(row['Abstract']),
    legalStatus: normalizeText(row['Legal Status']),
    simpleLegalStatus: normalizeText(row['Simple Legal Status']),
    backwardCitations,
    forwardCitations,
    backwardCitationsCount,
    forwardCitationsCount,
    flags: {
      sep: ['yes', 'true', '1'].includes(String(firstPresentValue(row['SEP Flag'], row['SEP'], row['SEP or SEP Flag']) || '').trim().toLowerCase()),
      opposition: ['true', 'yes', '1'].includes(String(firstPresentValue(row['Oppositions Flag'], row['Opposition Flag'], row['Opposition Flag or Oppositions Flag']) || '').trim().toLowerCase()),
      ptab: ['true', 'yes', '1'].includes(String(firstPresentValue(row['PTAB Flag'], row['PTAB'], row['PTAB Flag or PTAB']) || '').trim().toLowerCase()),
      litigation: ['yes', 'true', '1'].includes(String(firstPresentValue(row['Litigation Flag'], row['Litigation'], row['Litigation or Litigation Flag']) || '').trim().toLowerCase()),
      governmentInterest: ['yes', 'true', 'government interest'].includes(String(row['Govt. Interest'] || '').trim().toLowerCase())
    },
    countries,
    inpadocFamilyMembers: inpadocMembers,
    familySize: inpadocMembers.length,
    
    askingPrice,
    valuationEstimate,
    qualityScore,
    totalPatentScore,
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
    cipConDiv: continuitySignals,
    continuityPatentNumbers,
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

export const calculateMaintenanceStatus = (patent: Patent): MaintenanceStatusSummary => {
  const today = new Date();
  const maintenanceFees = patent.maintenanceFees;
  const entityType = normalizeEntityType(patent.entityType);
  const isApplicable = isMaintenanceApplicablePatentType(patent.patentType);
  const anchorDate = getMaintenanceAnchorDate(patent);
  const rawStatuses = [
    maintenanceFees.year3_5Text,
    maintenanceFees.year7_5Text,
    maintenanceFees.year11_5Text,
  ].map((value) => String(value || '').trim());
  const hasExplicitStatuses = rawStatuses.some((value) => value.length > 0);
  const stageAmounts = {
    year3_5: getFeeAmount(entityType, '3.5'),
    year7_5: getFeeAmount(entityType, '7.5'),
    year11_5: getFeeAmount(entityType, '11.5'),
  };
  const totalScheduled = stageAmounts.year3_5 + stageAmounts.year7_5 + stageAmounts.year11_5;

  const inferPaidStates = () => {
    if (!hasExplicitStatuses) {
      if (maintenanceFees.totalPending === 0) {
        return { year3_5: true, year7_5: true, year11_5: true };
      }

      if (maintenanceFees.totalPending <= maintenanceFees.year11_5) {
        return { year3_5: true, year7_5: true, year11_5: false };
      }

      if (maintenanceFees.totalPending <= (maintenanceFees.year7_5 + maintenanceFees.year11_5)) {
        return { year3_5: true, year7_5: false, year11_5: false };
      }

      return { year3_5: false, year7_5: false, year11_5: false };
    }

    return {
      year3_5: isPaid(maintenanceFees.year3_5Text),
      year7_5: isPaid(maintenanceFees.year7_5Text),
      year11_5: isPaid(maintenanceFees.year11_5Text),
    };
  };

  const paidState = inferPaidStates();

  const stageWithStatus = (
    key: keyof typeof paidState,
    amount: number,
    dueDate: Date | null,
  ): MaintenanceStageStatus => {
    const rawStatus = paidState[key] ? 'Paid' : 'Not Paid';
    return classifyMaintenanceStage(amount, dueDate, today, isApplicable, rawStatus);
  };

  const due3_5 = anchorDate ? addMaintenanceDueDate(anchorDate, 3) : null;
  const due7_5 = anchorDate ? addMaintenanceDueDate(anchorDate, 7) : null;
  const due11_5 = anchorDate ? addMaintenanceDueDate(anchorDate, 11) : null;

  const year_3_5 = stageWithStatus('year3_5', stageAmounts.year3_5, due3_5);
  const year_7_5 = stageWithStatus('year7_5', stageAmounts.year7_5, due7_5);
  const year_11_5 = stageWithStatus('year11_5', stageAmounts.year11_5, due11_5);

  const orderedStages: Array<{ key: keyof MaintenanceStatusSummary; stage: MaintenanceStageStatus }> = [
    { key: 'year_3_5', stage: year_3_5 },
    { key: 'year_7_5', stage: year_7_5 },
    { key: 'year_11_5', stage: year_11_5 },
  ];

  const nextUnpaidStage = orderedStages.find(({ stage }) => stage.status !== 'paid');

  const getOverallStatus = (): MaintenanceLifecycleStatus => {
    if (!isApplicable) return 'Not Applicable';
    if (!anchorDate) return 'Upcoming';
    if (!nextUnpaidStage) return 'Current';
    return nextUnpaidStage.stage.lifecycleStatus;
  };

  const getNextEvent = (): { label: string; date: Date | null } => {
    if (!isApplicable) {
      return { label: 'Maintenance fees do not apply', date: null };
    }

    if (!anchorDate) {
      return { label: 'Grant date unavailable', date: null };
    }

    if (!nextUnpaidStage) {
      return { label: 'All maintenance fees paid', date: null };
    }

    const dueDate = parseDateOnly(nextUnpaidStage.stage.dueDate);
    if (!dueDate) {
      return { label: 'Maintenance schedule unavailable', date: null };
    }

    const windowStart = addCalendarMonths(dueDate, -PAYMENT_WINDOW_MONTHS);
    const graceEnd = addCalendarMonths(dueDate, PAYMENT_GRACE_MONTHS);

    if (today < windowStart) {
      return { label: 'Payment window opens', date: windowStart };
    }
    if (today < dueDate) {
      return { label: 'Payment due', date: dueDate };
    }
    if (today <= graceEnd) {
      return { label: 'Grace period ends', date: graceEnd };
    }

    return { label: 'Lapsed on', date: graceEnd };
  };

  const nextEvent = getNextEvent();
  const nextEventDate = formatIsoDate(nextEvent.date);
  const daysUntilNextEvent = nextEvent.date ? diffDays(nextEvent.date, today) : null;
  const overallStatus = getOverallStatus();

  return {
    isApplicable,
    scheduleBasis: isApplicable ? 'grant' : 'not_applicable',
    anchorDate: formatIsoDate(anchorDate),
    overallStatus,
    nextEventLabel: nextEvent.label,
    nextEventDate,
    daysUntilNextEvent,
    paymentWindowOpen: overallStatus === 'Payment Window Open' || overallStatus === 'Due Soon' || overallStatus === 'Delinquent',
    year_3_5,
    year_7_5,
    year_11_5,
    totalPending: isApplicable ? maintenanceFees.totalPending : 0,
    totalPaid: isApplicable ? totalScheduled - maintenanceFees.totalPending : 0,
  };
};

// ============================================================================
// TEST EXAMPLES FOR MAINTENANCE FEE CALCULATION
// ============================================================================
// These examples demonstrate the auto-calculation for all entity types.
//
// Example 1: Small Entity - All fees not paid
// Input:
//   { "Entity Type": "Small", "3.5 years": "Not Paid", "7.5 Years": "Not Paid", "11.5 Years": "Not Paid" }
// Expected Total Pending Fee: 860 + 1616 + 3312 = 5788
//
// Example 2: Large Entity - First fee paid, rest not paid
// Input:
//   { "Entity Type": "Large", "3.5 years": "Paid", "7.5 Years": "Not Paid", "11.5 Years": "Not Paid" }
// Expected Total Pending Fee: 0 + 4040 + 8280 = 12320
//
// Example 3: Micro Entity - Only 7.5 year fee paid
// Input:
//   { "Entity Type": "Micro", "3.5 years": "Not Paid", "7.5 Years": "Paid", "11.5 Years": "Not Paid" }
// Expected Total Pending Fee: 430 + 0 + 1656 = 2086
//
// Example 4: Invalid Entity Type
// Input:
//   { "Entity Type": "", "3.5 years": "Not Paid", "7.5 Years": "Not Paid", "11.5 Years": "Not Paid" }
// Expected Total Pending Fee: null (and a warning should be logged)
//
// ============================================================================
