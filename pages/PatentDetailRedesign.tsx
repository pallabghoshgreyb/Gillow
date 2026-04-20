import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileSearch2,
  FileText,
  Globe2,
  Link2,
  Scale,
  Share2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Patent } from '../types';
import { api } from '../utils/api';
import { formatCompactCurrency, isKnownNumber } from '../utils/patentDisplay';
import { shareContent } from '../utils/shareUtils';
import OwnershipSection from '../components/OwnershipSection';
import FeeStatusSection from '../components/FeeStatusSection';
import RiskAssessmentSection from '../components/RiskAssessmentSection';
import TechnologyProfileSection from '../components/TechnologyProfileSection';
import GeographicalDistributionSection from '../components/GeographicalDistributionSection';
import ValuationBreakdownSection from '../components/ValuationBreakdownSection';
import ExaminationDetailsSection from '../components/ExaminationDetailsSection';
import ContinuitySection from '../components/ContinuitySection';
import GlobalPatentFamilySection from '../components/GlobalPatentFamilySection';
import GovernmentStandardsSection from '../components/GovernmentStandardsSection';
import QuickJumpNavigation, { type QuickJumpItem } from '../components/QuickJumpNavigation';

const EASE = [0.22, 1, 0.36, 1] as const;
const CARD = 'rounded-3xl border border-slate-200 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.03)]';
const INTERACTIVE = `${CARD} transition duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]`;
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

const QUICK_JUMP_ITEMS: QuickJumpItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'claims', label: 'Claims' },
  { id: 'classification', label: 'Classification' },
  { id: 'strength', label: 'IP Strength' },
  { id: 'prosecution', label: 'Prosecution' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'fees', label: 'Fee Status' },
  { id: 'risk', label: 'Risk' },
  { id: 'market', label: 'Market' },
  { id: 'technology', label: 'Technology' },
  { id: 'geography', label: 'Global Map' },
  { id: 'valuation-breakdown', label: 'Valuation' },
  { id: 'examination', label: 'Examination' },
  { id: 'continuity', label: 'Continuity' },
  { id: 'government', label: 'Government' },
  { id: 'related', label: 'Related' },
];

const COUNTRY_CODES: Record<string, string> = {
  'United States of America': 'US',
  'Europe (EPO)': 'EP',
  WIPO: 'WO',
  Japan: 'JP',
  China: 'CN',
  Australia: 'AU',
  Canada: 'CA',
  Germany: 'DE',
  Spain: 'ES',
  Mexico: 'MX',
  Brazil: 'BR',
  'South Korea': 'KR',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  Malaysia: 'MY',
};

type Tone = 'granted' | 'pending' | 'expired';
type ContinuityTone = 'granted' | 'pending' | 'abandoned' | 'expired';
type StepState = 'completed' | 'current' | 'upcoming';
type Step = {
  id: string;
  label: string;
  date: string;
  detail: string;
  state: StepState;
  badge?: string;
  trackCodes: string[];
};
type ContinuityMiniStep = { label: string; state: 'done' | 'current' | 'upcoming' };
type ContinuityApp = {
  relation: string;
  publicationNumber: string;
  filingDate: string;
  statusLabel: string;
  tone: ContinuityTone;
  trackCodes: string[];
  miniTimeline: ContinuityMiniStep[];
};
type Lifecycle = {
  title: string;
  description: string;
  steps: Step[];
  trackCodes: string[];
  continuityApps: ContinuityApp[];
};
type Claim = { label: string; value: number; hint: string; icon: LucideIcon };
type History = { id: string; title: string; date: string; detail: string; tone: 'done' | 'active' | 'muted' };
type FamilyEntry = { country: string; code: string; status: string; note: string };
type View = {
  title: string;
  number: string;
  assignee: string;
  status: { label: string; tone: Tone };
  valuation: number | null;
  abstractPreview: string;
  abstractRest: string;
  timeline: Lifecycle;
  claims: Claim[];
  classifications: string[];
  strength: number | null;
  strengthNote: string;
  strengthHighlights: string[];
  dates: Array<{ label: string; value: string }>;
  history: History[];
  family: FamilyEntry[];
  familySummary: string;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');
const hasItems = (items?: string[] | null) => Array.isArray(items) && items.some(hasText);
const uniq = (items: string[]) => Array.from(new Set(items.filter(hasText).map((item) => item.trim())));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDate = (value?: string, fallback = '') => {
  if (!hasText(value)) return fallback;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return value as string;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeUpper = (value: string) => value.trim().toUpperCase();

const uniqUpper = (items: string[]) =>
  Array.from(new Set(items.filter(hasText).map((item) => normalizeUpper(item))));

const leadAssignee = (patent: Patent) =>
  patent.currentAssignees[0] || patent.originalAssignees[0] || patent.assignee.name || '';

const statusOf = (patent: Patent) => {
  const status = `${patent.legalStatus || ''} ${patent.simpleLegalStatus || ''}`;
  if (/expired|dead|lapsed/i.test(status)) return { label: 'Expired', tone: 'expired' as Tone };
  if (/granted|issued|alive/i.test(status)) return { label: 'Granted', tone: 'granted' as Tone };
  return { label: 'Pending', tone: 'pending' as Tone };
};

const statusClasses = (tone: Tone) => {
  if (tone === 'granted') return 'border-teal-200 bg-teal-50 text-teal-700';
  if (tone === 'expired') return 'border-slate-200 bg-slate-100 text-slate-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const continuityStatusOf = (
  publicationNumber: string,
  matchedPatent?: Patent,
): { label: string; tone: ContinuityTone } => {
  const legalStatus = matchedPatent
    ? `${matchedPatent.legalStatus || ''} ${matchedPatent.simpleLegalStatus || ''}`
    : '';
  const normalized = normalizeUpper(publicationNumber);

  if (/abandoned/i.test(legalStatus)) return { label: 'Abandoned', tone: 'abandoned' };
  if (/expired|dead|lapsed/i.test(legalStatus)) return { label: 'Expired', tone: 'expired' };
  if (/granted|issued|alive/i.test(legalStatus)) return { label: 'Granted', tone: 'granted' };
  if (/(?:B\d?|C\d?|T\d?)$/.test(normalized)) return { label: 'Granted', tone: 'granted' };
  if (/(?:A\d?)$/.test(normalized)) return { label: 'Pending', tone: 'pending' };
  return { label: 'Expired', tone: 'expired' };
};

const buildMiniTimeline = (
  tone: ContinuityTone,
  matchedPatent?: Patent,
): ContinuityMiniStep[] => {
  if (tone === 'abandoned') {
    return [
      { label: 'Filing', state: 'done' },
      { label: 'Examination', state: 'done' },
      { label: 'Abandon', state: 'current' },
    ];
  }

  if (tone === 'expired') {
    return [
      { label: 'Filing', state: 'done' },
      { label: 'Grant', state: 'done' },
      { label: 'Expired', state: 'current' },
    ];
  }

  if (tone === 'granted') {
    return [
      { label: 'Filing', state: 'done' },
      { label: 'Examination', state: 'done' },
      ...(hasText(matchedPatent?.allowanceDate)
        ? [{ label: 'Allowance', state: 'done' as const }]
        : []),
      { label: 'Grant', state: 'current' },
    ];
  }

  return [
    { label: 'Filing', state: 'done' },
    { label: 'Examination', state: 'current' },
    { label: 'Grant', state: 'upcoming' },
  ];
};

const groupTrackCodesByStep = (patent: Patent) => {
  const buckets: Record<string, string[]> = {
    filing: [],
    'first-action': [],
    examination: [],
    rce: [],
    allowance: [],
    grant: [],
  };

  uniqUpper(patent.trackOneCodes).forEach((code) => {
    if (/^(T1ON|T1OFF|MPDPH|PDPH)/.test(code)) {
      buckets.filing.push(code);
      return;
    }

    if (code === 'TK1R') {
      if (patent.rceCount > 0) buckets.rce.push(code);
      else buckets.allowance.push(code);
      return;
    }

    if (/^T1GR/.test(code)) {
      buckets.grant.push(code);
      return;
    }

    if (/^(MPD|PDT)/.test(code)) {
      if (hasText(patent.firstActionDate)) buckets['first-action'].push(code);
      else buckets.examination.push(code);
      return;
    }

    buckets.examination.push(code);
  });

  return buckets;
};

const splitAbstract = (text: string) => {
  const value = text.trim();
  if (value.length <= 260) return { preview: value, rest: '' };
  const parts = value.match(/[^.!?]+[.!?]+/g);
  if (parts && parts.length > 1) {
    const preview = parts.slice(0, 2).join(' ').trim();
    const rest = parts.slice(2).join(' ').trim();
    if (preview.length >= 160) return { preview, rest };
  }
  return { preview: `${value.slice(0, 260).trimEnd()}...`, rest: value.slice(260).trimStart() };
};

const timelineCurrentStepId = (patent: Patent, tone: Tone) => {
  if (tone === 'expired') return 'expiry';
  if (tone === 'granted') return 'grant';
  if (patent.rceCount > 0) return 'rce';
  if (hasText(patent.allowanceDate)) return 'allowance';
  if (patent.officeActionsCount > 0) return 'examination';
  if (hasText(patent.firstActionDate)) return 'first-action';
  return 'filing';
};

const buildContinuityApps = (patent: Patent, catalog: Patent[]) => {
  const relationTokens = patent.cipConDiv
    .filter(hasText)
    .map((value) => normalizeUpper(value));
  const currentPublication = normalizeUpper(patent.publicationNumber);
  const candidateMembers = uniqUpper(patent.inpadocFamilyMembers)
    .filter((member) => member !== currentPublication)
    .sort((left, right) => {
      const leftPatent = catalog.find(
        (item) => normalizeUpper(item.publicationNumber) === left,
      );
      const rightPatent = catalog.find(
        (item) => normalizeUpper(item.publicationNumber) === right,
      );
      const leftPriority = left.startsWith(normalizeUpper(patent.jurisdiction || ''))
        ? 0
        : 1;
      const rightPriority = right.startsWith(normalizeUpper(patent.jurisdiction || ''))
        ? 0
        : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      const leftDate = leftPatent?.filingDate ? new Date(leftPatent.filingDate).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = rightPatent?.filingDate ? new Date(rightPatent.filingDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (leftDate !== rightDate) return leftDate - rightDate;
      return left.localeCompare(right);
    });

  return relationTokens
    .map((relation, index) => {
      const publicationNumber = candidateMembers[index];
      if (!publicationNumber) return null;
      const matchedPatent = catalog.find(
        (item) => normalizeUpper(item.publicationNumber) === publicationNumber,
      );
      const status = continuityStatusOf(publicationNumber, matchedPatent);
      const fallbackTrackCodes = uniqUpper(patent.trackOneCodes).slice(index, index + 2);
      const trackCodes =
        matchedPatent && matchedPatent.trackOneCodes.length > 0
          ? uniqUpper(matchedPatent.trackOneCodes)
          : fallbackTrackCodes.length > 0
            ? fallbackTrackCodes
            : uniqUpper(patent.trackOneCodes).slice(0, 2);

      return {
        relation,
        publicationNumber,
        filingDate: matchedPatent
          ? formatDate(matchedPatent.filingDate)
          : formatDate(patent.filingDate),
        statusLabel: status.label,
        tone: status.tone,
        trackCodes,
        miniTimeline: buildMiniTimeline(status.tone, matchedPatent),
      } satisfies ContinuityApp;
    })
    .filter((app): app is ContinuityApp => Boolean(app));
};

const buildTimeline = (
  patent: Patent,
  status: { label: string; tone: Tone },
  catalog: Patent[],
): Lifecycle => {
  const trackByStep = groupTrackCodesByStep(patent);
  const steps: Omit<Step, 'state'>[] = [
    {
      id: 'filing',
      label: 'Filing',
      date: formatDate(patent.filingDate),
      detail: `Application ${hasText(patent.applicationNumber) ? patent.applicationNumber : 'record'} established priority and opened prosecution.`,
      trackCodes: trackByStep.filing,
    },
    {
      id: 'first-action',
      label: '1st Action',
      date: hasText(patent.firstActionDate) ? formatDate(patent.firstActionDate) : 'In review',
      detail: hasText(patent.firstActionDate)
        ? 'The first substantive office action established the initial examination posture.'
        : 'No dated first office action is surfaced in the current record.',
      trackCodes: trackByStep['first-action'],
    },
    {
      id: 'examination',
      label: 'Examination',
      date: patent.officeActionsCount > 0 ? `${patent.officeActionsCount} office actions` : 'Awaiting review',
      detail:
        patent.officeActionsCount > 0
          ? `${patent.officeActionsCount} recorded office action${patent.officeActionsCount === 1 ? '' : 's'} shaped the examination path.`
          : 'No office action count is surfaced in the current record yet.',
      badge: patent.officeActionsCount > 0 ? `${patent.officeActionsCount} OA` : undefined,
      trackCodes: trackByStep.examination,
    },
    ...(patent.rceCount > 0
      ? [
          {
            id: 'rce',
            label: 'RCE Filed',
            date: patent.rceCount === 1 ? '1 request' : `${patent.rceCount} requests`,
            detail: `${patent.rceCount} request${patent.rceCount === 1 ? '' : 's'} for continued examination ${patent.rceCount === 1 ? 'was' : 'were'} recorded before final disposition.`,
            trackCodes: trackByStep.rce,
          },
        ]
      : []),
    {
      id: 'allowance',
      label: 'Allowance',
      date: hasText(patent.allowanceDate) ? formatDate(patent.allowanceDate) : 'Pending',
      detail: hasText(patent.allowanceDate)
        ? 'Allowance indicates the application cleared examination and moved toward issuance.'
        : 'No allowance date is currently surfaced in the prosecution record.',
      trackCodes: trackByStep.allowance,
    },
    {
      id: 'grant',
      label: 'Grant',
      date:
        status.tone === 'granted'
          ? formatDate(patent.publicationDate || patent.allowanceDate)
          : status.tone === 'expired'
            ? formatDate(patent.publicationDate || patent.allowanceDate, 'Historical')
            : 'Pending',
      detail:
        status.tone === 'granted'
          ? 'Rights are active and licensable, with current status aligned to a granted posture.'
          : status.tone === 'expired'
            ? 'The granted term has concluded based on the surfaced legal status.'
            : 'Disposition is still evolving and should be confirmed during diligence.',
      trackCodes: trackByStep.grant,
    },
    {
      id: 'expiry',
      label: 'Expiry',
      date: formatDate(patent.estimatedExpirationDate),
      detail: 'Expected term end based on current filing data and standard patent term assumptions.',
      trackCodes: [],
    },
  ];
  const current = Math.max(
    0,
    steps.findIndex((step) => step.id === timelineCurrentStepId(patent, status.tone)),
  );

  return {
    title: 'Patent lifecycle',
    description: 'Application prosecution with continuity family.',
    steps: steps.map((step, index) => ({
      ...step,
      state: index < current ? 'completed' : index === current ? 'current' : 'upcoming',
    })) as Step[],
    trackCodes: uniqUpper(patent.trackOneCodes),
    continuityApps: buildContinuityApps(patent, catalog),
  };
};

const buildHistory = (patent: Patent, status: { label: string; tone: Tone }): History[] => [
  {
    id: 'filed',
    title: 'Application filed',
    date: formatDate(patent.filingDate),
    detail: `Priority claim anchored the asset in ${formatDate(patent.priorityDate, 'the initial filing window')}.`,
    tone: 'done',
  },
  {
    id: 'exam',
    title: hasText(patent.firstActionDate) ? 'First examination event' : 'Examination posture',
    date: hasText(patent.firstActionDate) ? formatDate(patent.firstActionDate) : 'Awaiting detail',
    detail: patent.officeActionsCount > 0 ? `${patent.officeActionsCount} office action${patent.officeActionsCount === 1 ? '' : 's'} recorded, indicating an active prosecution history.` : 'The current dataset does not surface a dated office action yet.',
    tone: hasText(patent.firstActionDate) ? 'done' : 'active',
  },
  {
    id: 'publication',
    title: 'Publication',
    date: formatDate(patent.publicationDate),
    detail: `${patent.publicationNumber} entered the public record and became citeable in the technical landscape.`,
    tone: hasText(patent.publicationDate) ? 'done' : 'active',
  },
  {
    id: 'grant',
    title: status.tone === 'granted' ? 'Grant / issuance' : status.tone === 'expired' ? 'Term concluded' : 'Grant posture',
    date: status.tone === 'granted' ? formatDate(patent.allowanceDate || patent.publicationDate) : status.tone === 'expired' ? formatDate(patent.estimatedExpirationDate) : 'Pending',
    detail: status.tone === 'granted' ? 'The file reflects an issued posture suitable for licensing and enforcement review.' : status.tone === 'expired' ? 'Patent term appears concluded based on the surfaced legal status.' : 'Final grant outcome should be confirmed with the latest official prosecution record.',
    tone: status.tone === 'granted' ? 'done' : status.tone === 'expired' ? 'muted' : 'active',
  },
];

const buildFamily = (patent: Patent, status: { label: string; tone: Tone }) => {
  const countries = uniq(patent.countries);
  return countries.slice(0, 6).map((country, index) => ({
    country,
    code: COUNTRY_CODES[country] || patent.jurisdiction || 'US',
    status: index === 0 ? status.label : 'Recorded',
    note:
      index === 0
        ? `${status.label} in the reference jurisdiction.`
        : 'Family member recorded in the current dataset.',
  }));
};

const patentScore = (current: Patent, candidate: Patent) => {
  let score = 0;
  if (candidate.domain === current.domain) score += 4;
  if (candidate.subdomain && candidate.subdomain === current.subdomain) score += 3;
  if (leadAssignee(candidate).toLowerCase() === leadAssignee(current).toLowerCase()) score += 2;
  score += Math.min(candidate.familySize, 4);
  score += Math.min(candidate.forwardCitationsCount, 4);
  return score;
};

const relatedSummary = (patent: Patent) => {
  if (hasText(patent.abstract)) return patent.abstract.length > 140 ? `${patent.abstract.slice(0, 140).trimEnd()}...` : patent.abstract;
  return '';
};

const makeView = (patent: Patent, catalog: Patent[]): View => {
  const title = hasText(patent.title) ? patent.title : patent.publicationNumber;
  const abstract = hasText(patent.abstract) ? patent.abstract : '';
  const status = statusOf(patent);
  const split = splitAbstract(abstract);
  const totalClaims = patent.totalClaims || patent.independentClaimsCount + patent.dependentClaimsCount;
  const strength = isKnownNumber(patent.qualityScore)
    ? clamp(patent.qualityScore, 0, 100)
    : null;
  const family = buildFamily(patent, status);
  const classifications = uniq([...patent.cpcs, ...patent.ipcs]).slice(0, 6);
  const valuation = isKnownNumber(patent.askingPrice)
    ? patent.askingPrice
    : isKnownNumber(patent.valuationEstimate)
      ? patent.valuationEstimate
      : null;
  return {
    title,
    number: patent.publicationNumber,
    assignee: leadAssignee(patent),
    status,
    valuation,
    abstractPreview: split.preview,
    abstractRest: split.rest,
    timeline: buildTimeline(patent, status, catalog),
    claims: [
      { label: 'Independent claims', value: patent.independentClaimsCount, hint: 'Core coverage', icon: ShieldCheck },
      { label: 'Dependent claims', value: patent.dependentClaimsCount, hint: 'Fallback protection', icon: Link2 },
      { label: 'Total claims', value: totalClaims, hint: 'Overall scope', icon: Scale },
    ],
    classifications,
    strength,
    strengthNote: strength !== null
      ? strength >= 85
        ? 'High disclosed quality score with strong commercial and legal weighting in the imported dataset.'
        : strength >= 72
          ? 'Balanced disclosed quality score across the valuation components in the imported dataset.'
          : 'Lower disclosed quality score. Commercial and legal diligence should stay tightly coupled before pricing decisions.'
      : '',
    strengthHighlights: [
      Math.max(patent.familySize || family.length, family.length) > 0
        ? `${Math.max(patent.familySize || family.length, family.length)} family members`
        : '',
      Math.max(patent.forwardCitationsCount, patent.citations, 0) > 0
        ? `${Math.max(patent.forwardCitationsCount, patent.citations, 0)} forward citations`
        : '',
      hasText(patent.gau) ? `GAU ${patent.gau}` : '',
    ].filter(hasText),
    dates: [
      hasText(patent.filingDate) ? { label: 'Filed', value: formatDate(patent.filingDate) } : null,
      hasText(patent.publicationDate) ? { label: 'Published', value: formatDate(patent.publicationDate) } : null,
      status.tone === 'granted' && hasText(patent.allowanceDate || patent.publicationDate)
        ? {
            label: 'Granted',
            value: formatDate(patent.allowanceDate || patent.publicationDate),
          }
        : hasText(status.label)
          ? { label: 'Disposition', value: status.label }
          : null,
      hasText(patent.estimatedExpirationDate)
        ? { label: 'Expires', value: formatDate(patent.estimatedExpirationDate) }
        : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item)),
    history: buildHistory(patent, status),
    family,
    familySummary: family.length > 0
      ? `${Math.max(patent.familySize || family.length, family.length)} family member${Math.max(patent.familySize || family.length, family.length) === 1 ? '' : 's'} across ${family.length} jurisdiction${family.length === 1 ? '' : 's'}.`
      : 'No family jurisdictions are disclosed in the current dataset.',
  };
};
const PatentDetailRedesign: React.FC = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const [patent, setPatent] = useState<Patent | null>(null);
  const [catalog, setCatalog] = useState<Patent[]>([]);
  const [related, setRelated] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareFeedback, setShareFeedback] = useState('');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [activeStepId, setActiveStepId] = useState('');
  const [mobileStepId, setMobileStepId] = useState('');
  const [activeJumpId, setActiveJumpId] = useState('overview');
  const [availableJumpIds, setAvailableJumpIds] = useState<string[]>([]);
  const view = useMemo(() => (patent ? makeView(patent, catalog) : null), [patent, catalog]);
  const visibleQuickJumpItems = useMemo(() => {
    if (!patent || !view) {
      return QUICK_JUMP_ITEMS.filter((item) => item.id === 'overview');
    }

    const hasClaimsSection =
      patent.totalClaims > 0 ||
      patent.independentClaimsCount > 0 ||
      patent.dependentClaimsCount > 0;
    const hasClassificationSection = view.classifications.length > 0;
    const hasStrengthSection =
      view.strength !== null ||
      Object.values(patent.valuationMetrics).some((value) => isKnownNumber(value));
    const hasProsecutionSection =
      hasText(patent.firstActionDate) ||
      hasText(patent.allowanceDate) ||
      isKnownNumber(patent.prosecutionDuration) ||
      isKnownNumber(patent.officeActionsCount) ||
      isKnownNumber(patent.rceCount);
    const hasOwnershipSection =
      hasItems(patent.currentAssignees) ||
      hasItems(patent.originalAssignees) ||
      hasItems(patent.inventors);
    const hasFeeSection =
      hasText(patent.maintenanceFees.year3_5Text) ||
      hasText(patent.maintenanceFees.year7_5Text) ||
      hasText(patent.maintenanceFees.year11_5Text) ||
      hasText(patent.maintenanceFees.totalPendingText) ||
      isKnownNumber(patent.maintenanceFees.year3_5) ||
      isKnownNumber(patent.maintenanceFees.year7_5) ||
      isKnownNumber(patent.maintenanceFees.year11_5) ||
      isKnownNumber(patent.maintenanceFees.totalPending);
    const hasRiskSection =
      isKnownNumber(patent.infringementRiskScore) ||
      patent.ftoStatus !== 'Unknown' ||
      hasItems(patent.iprPgr) ||
      patent.flags.litigation;
    const hasTechnologySection =
      hasText(patent.domain) ||
      hasText(patent.subdomain) ||
      isKnownNumber(patent.technologyReadinessLevel);
    const hasGeographySection =
      hasItems(patent.countries) ||
      hasItems(patent.inpadocFamilyMembers);
    const hasValuationBreakdownSection = Object.values(patent.valuationMetrics).some((value) =>
      isKnownNumber(value),
    );
    const hasExaminationSection =
      hasText(patent.gau) ||
      hasText(patent.gauDefinition) ||
      hasText(patent.patentType) ||
      hasText(patent.entityType) ||
      hasItems(patent.trackOneCodes) ||
      hasItems(patent.nonPublicationCodes);
    const hasGovernmentSection =
      patent.flags.governmentInterest ||
      patent.flags.sep ||
      hasItems(patent.fit);
    const hasRelatedSection = related.length > 0;
    const visibleIds = new Set([
      'overview',
      'timeline',
      ...(hasClaimsSection ? ['claims'] : []),
      ...(hasClassificationSection ? ['classification'] : []),
      ...(hasStrengthSection ? ['strength'] : []),
      ...(hasProsecutionSection ? ['prosecution'] : []),
      ...(hasOwnershipSection ? ['ownership'] : []),
      ...(hasFeeSection ? ['fees'] : []),
      ...(hasRiskSection ? ['risk'] : []),
      ...(hasTechnologySection ? ['technology'] : []),
      ...(hasGeographySection ? ['geography'] : []),
      ...(hasValuationBreakdownSection ? ['valuation-breakdown'] : []),
      ...(hasExaminationSection ? ['examination'] : []),
      ...(hasGovernmentSection ? ['government'] : []),
      ...(hasRelatedSection ? ['related'] : []),
    ]);

    return QUICK_JUMP_ITEMS.filter((item) => visibleIds.has(item.id));
  }, [patent, related, view]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!patentId) {
        setPatent(null);
        setCatalog([]);
        setRelated([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      window.scrollTo({ top: 0, behavior: 'auto' });
      try {
        const [current, allPatents] = await Promise.all([api.getPatent(patentId), api.getPatents()]);
        if (!alive) return;
        if (!current) {
          setPatent(null);
          setCatalog(allPatents);
          setRelated([]);
          setLoading(false);
          return;
        }
        setPatent(current);
        setCatalog(allPatents);
        const ranked = allPatents.filter((item) => item.id !== current.id).sort((a, b) => patentScore(current, b) - patentScore(current, a));
        setRelated((ranked.length > 0 ? ranked : allPatents.filter((item) => item.id !== current.id)).slice(0, 3));
      } catch (error) {
        console.error('Failed to load patent detail page', error);
        if (!alive) return;
        setPatent(null);
        setCatalog([]);
        setRelated([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [patentId]);

  useEffect(() => {
    if (!view?.timeline.steps.length) return;
    const current =
      view.timeline.steps.find((step) => step.state === 'current') ||
      view.timeline.steps[0];
    setActiveStepId(current.id);
    setMobileStepId(current.id);
  }, [view]);

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(''), 2500);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  useEffect(() => {
    if (!view) return;

    const sectionNodes = visibleQuickJumpItems.map((item) => ({
      id: item.id,
      element: document.getElementById(item.id),
    }))
      .filter(
        (entry): entry is { id: string; element: HTMLElement } => Boolean(entry.element),
      )
      .sort((left, right) => left.element.offsetTop - right.element.offsetTop);

    const visibleEntries = new Map<string, IntersectionObserverEntry>();
    const availableIds = sectionNodes.map((entry) => entry.id);
    setAvailableJumpIds(availableIds);

    const updateFromScrollPosition = () => {
      const threshold = window.scrollY + 120;
      let currentId = availableIds[0] || 'overview';

      sectionNodes.forEach((entry) => {
        if (entry.element.offsetTop <= threshold) {
          currentId = entry.id;
        }
      });

      setActiveJumpId(currentId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleEntries.set(entry.target.id, entry);
        });

        const intersecting = Array.from(visibleEntries.values())
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top - 110) -
              Math.abs(right.boundingClientRect.top - 110),
          );

        if (intersecting.length > 0) {
          setActiveJumpId(intersecting[0].target.id);
          return;
        }

        updateFromScrollPosition();
      },
      {
        rootMargin: '-100px 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 1],
      },
    );

    sectionNodes.forEach((entry) => observer.observe(entry.element));
    updateFromScrollPosition();

    window.addEventListener('scroll', updateFromScrollPosition, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateFromScrollPosition);
    };
  }, [view, visibleQuickJumpItems]);

  const handleShare = async () => {
    if (!view) return;
    try {
      const result = await shareContent({ title: view.number, text: `${view.title} - ${view.assignee}`, url: window.location.href });
      setShareFeedback(result === 'copied' ? 'Link copied.' : 'Patent shared.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareFeedback('Share unavailable right now.');
    }
  };

  const handleQuickJump = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveJumpId(id);
  };

  if (loading) return <Skeleton />;
  if (!patent || !view) return <NotFound onBack={() => navigate('/browse')} />;

  const activeStep =
    view.timeline.steps.find((step) => step.id === activeStepId) ||
    view.timeline.steps[0];
  const hasAbstractSection = hasText(view.abstractPreview);
  const hasClaimsSection =
    patent.totalClaims > 0 ||
    patent.independentClaimsCount > 0 ||
    patent.dependentClaimsCount > 0;
  const hasClassificationSection = view.classifications.length > 0;
  const hasStrengthSection =
    view.strength !== null ||
    Object.values(patent.valuationMetrics).some((value) => isKnownNumber(value));
  const hasProsecutionSection =
    hasText(patent.firstActionDate) ||
    hasText(patent.allowanceDate) ||
    isKnownNumber(patent.prosecutionDuration) ||
    isKnownNumber(patent.officeActionsCount) ||
    isKnownNumber(patent.rceCount);
  const hasOwnershipSection =
    hasItems(patent.currentAssignees) ||
    hasItems(patent.originalAssignees) ||
    hasItems(patent.inventors);
  const hasFeeSection =
    hasText(patent.maintenanceFees.year3_5Text) ||
    hasText(patent.maintenanceFees.year7_5Text) ||
    hasText(patent.maintenanceFees.year11_5Text) ||
    hasText(patent.maintenanceFees.totalPendingText) ||
    isKnownNumber(patent.maintenanceFees.year3_5) ||
    isKnownNumber(patent.maintenanceFees.year7_5) ||
    isKnownNumber(patent.maintenanceFees.year11_5) ||
    isKnownNumber(patent.maintenanceFees.totalPending);
  const hasRiskSection =
    isKnownNumber(patent.infringementRiskScore) ||
    patent.ftoStatus !== 'Unknown' ||
    hasItems(patent.iprPgr) ||
    patent.flags.litigation;
  const hasTechnologySection =
    hasText(patent.domain) ||
    hasText(patent.subdomain) ||
    isKnownNumber(patent.technologyReadinessLevel);
  const hasGeographySection =
    hasItems(patent.countries) ||
    hasItems(patent.inpadocFamilyMembers);
  const hasValuationBreakdownSection = Object.values(patent.valuationMetrics).some((value) =>
    isKnownNumber(value),
  );
  const hasExaminationSection =
    hasText(patent.gau) ||
    hasText(patent.gauDefinition) ||
    hasText(patent.patentType) ||
    hasText(patent.entityType) ||
    hasItems(patent.trackOneCodes) ||
    hasItems(patent.nonPublicationCodes);
  const hasGovernmentSection =
    patent.flags.governmentInterest ||
    patent.flags.sep ||
    hasItems(patent.fit);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-[1320px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)] lg:gap-12 xl:gap-16">
          <div className="space-y-12">
            <motion.div id="overview" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="scroll-mt-28 space-y-8">
              <Link to="/browse" className={cn('inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}>
                <ArrowLeft size={16} />
                Back to patent listings
              </Link>
              <div className="space-y-6 border-b border-slate-100 pb-10">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600">
                    <FileText size={14} className="text-teal-600" />
                    {view.number}
                  </span>
                  {hasText(patent.filingDate) && (
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <CalendarDays size={14} className="text-slate-400" />
                      Filed {formatDate(patent.filingDate)}
                    </span>
                  )}
                  <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium', statusClasses(view.status.tone))}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {view.status.label}
                  </span>
                </div>
                <div className="space-y-4">
                  {hasText(view.assignee) && (
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">{view.assignee}</p>
                  )}
                  <h1 className="max-w-[800px] text-[clamp(2.25rem,4vw,2.625rem)] font-semibold tracking-[-0.02em] leading-[1.18] text-slate-900">{view.title}</h1>
                  {hasAbstractSection && (
                    <p className="max-w-[760px] text-base leading-7 text-slate-600">{view.abstractPreview}</p>
                  )}
                </div>
              </div>
              <div className="lg:hidden">
                <SidebarCard patent={patent} view={view} shareFeedback={shareFeedback} onDownload={() => window.print()} onShare={() => void handleShare()} />
              </div>
            </motion.div>

            {hasAbstractSection && (
              <RevealBlock delay={0.2}>
                <div className="space-y-5">
                  <SectionIntro eyebrow="Abstract" title="Core invention summary" description="Written for fast executive review first and technical review second." />
                  <motion.div whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('p-6 sm:p-8', INTERACTIVE)}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Abstract</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Editorial excerpt from the underlying patent record.</p>
                      </div>
                      <button type="button" onClick={() => setShowFullAbstract((value) => !value)} className={cn('inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}>
                        {showFullAbstract ? 'Show less' : 'Read full abstract'}
                        <motion.span animate={{ rotate: showFullAbstract ? 180 : 0 }} transition={{ duration: 0.25 }}>
                          <ChevronDown size={16} />
                        </motion.span>
                      </button>
                    </div>
                    <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                      <p>{view.abstractPreview}</p>
                      <AnimatePresence initial={false}>
                        {showFullAbstract && view.abstractRest && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                            <p className="pt-1">{view.abstractRest}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              </RevealBlock>
            )}

            <motion.section id="timeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.22, ease: EASE }} className="scroll-mt-28 space-y-5">
              <SectionIntro eyebrow="Patent lifecycle" title={view.timeline.title} description={view.timeline.description} />
              <PatentTimeline timeline={view.timeline} activeStep={activeStep} activeStepId={activeStepId} mobileStepId={mobileStepId} onDesktopHover={setActiveStepId} onMobileToggle={setMobileStepId} />
            </motion.section>

            {hasClaimsSection && (
              <RevealBlock id="claims" delay={0.24}>
                <div className="space-y-5">
                  <SectionIntro eyebrow="Claims & scope" title="Claim architecture" description="A minimal snapshot of breadth, fallback protection, and overall scope." />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {view.claims.map((claim) => (
                      <motion.div key={claim.label} whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('flex items-center gap-4 px-5 py-4', INTERACTIVE)}>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-teal-600">
                          <claim.icon size={20} />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold tabular-nums text-slate-900">{claim.value}</p>
                          <p className="text-sm font-medium text-slate-500">{claim.label}</p>
                          <p className="text-xs text-slate-400">{claim.hint}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </RevealBlock>
            )}

            {hasClassificationSection && (
              <RevealBlock id="classification" delay={0.26}>
                <div className="space-y-5">
                  <SectionIntro eyebrow="Technology classification" title="IPC and CPC coding" description="Classification tags that situate the patent in search, diligence, and comparables." />
                  <div className={cn('p-6 sm:p-8 bg-slate-50/60', CARD)}>
                    <div className="flex flex-wrap gap-3">
                      {view.classifications.map((tag) => (
                        <motion.span key={tag} whileHover={{ y: -2 }} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealBlock>
            )}

            {hasStrengthSection && (
              <RevealBlock id="strength" delay={0.28}>
                <div className="space-y-5">
                  <SectionIntro eyebrow="Intellectual property strength" title="Strength assessment" description="A concise read on commercial quality, family breadth, and prosecution posture." />
                  <motion.div whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('p-6 sm:p-8', INTERACTIVE)}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-700">Dataset quality score</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Valuation component summary</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
                          {view.strength !== null ? view.strength : 'N/A'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {view.strength !== null ? 'out of 100' : 'not scored'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${view.strength || 0}%` }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" />
                    </div>
                    {view.strengthNote && (
                      <p className="mt-5 text-base leading-7 text-slate-600">{view.strengthNote}</p>
                    )}
                    {view.strengthHighlights.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {view.strengthHighlights.map((item) => (
                          <span key={item} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">{item}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </RevealBlock>
            )}

            {hasProsecutionSection && (
              <RevealBlock id="prosecution" delay={0.3}>
                <div className="space-y-5">
                  <SectionIntro eyebrow="Prosecution history" title="Readable file history" description="An editorial pass over the major recorded events surfaced from the prosecution record." />
                  <div className={cn('overflow-hidden', CARD)}>
                    <div className="space-y-px bg-slate-100">
                      {view.history.map((item, index) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.45, delay: index * 0.08, ease: EASE }} className={cn('grid gap-4 px-6 py-5 sm:grid-cols-[160px_minmax(0,1fr)_120px] sm:px-8', index % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                          <div className="text-sm font-medium text-slate-500">{item.date}</div>
                          <div>
                            <p className="text-base font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                          </div>
                          <div className="sm:text-right">
                            <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', item.tone === 'done' ? 'border-teal-200 bg-teal-50 text-teal-700' : item.tone === 'active' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600')}>
                              {item.tone === 'done' ? 'Recorded' : item.tone === 'active' ? 'Open' : 'Historical'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealBlock>
            )}

            {hasOwnershipSection && (
              <RevealBlock id="ownership" delay={0.32}>
                <OwnershipSection
                  currentAssignees={patent.currentAssignees}
                  originalAssignees={patent.originalAssignees}
                  inventors={patent.inventors}
                />
              </RevealBlock>
            )}

            {hasFeeSection && (
              <RevealBlock id="fees" delay={0.34}>
                <FeeStatusSection patent={patent} />
              </RevealBlock>
            )}

            {hasRiskSection && (
              <RevealBlock id="risk" delay={0.36}>
                <RiskAssessmentSection patent={patent} />
              </RevealBlock>
            )}

            {hasTechnologySection && (
              <RevealBlock id="technology" delay={0.38}>
                <TechnologyProfileSection patent={patent} />
              </RevealBlock>
            )}

            {hasGeographySection && (
              <RevealBlock id="geography" delay={0.4}>
                <GeographicalDistributionSection patent={patent} />
              </RevealBlock>
            )}

            {hasValuationBreakdownSection && (
              <RevealBlock id="valuation-breakdown" delay={0.42}>
                <ValuationBreakdownSection patent={patent} valuation={view.valuation} />
              </RevealBlock>
            )}

            {hasExaminationSection && (
              <RevealBlock id="examination" delay={0.44}>
                <ExaminationDetailsSection patent={patent} />
              </RevealBlock>
            )}

            {/* Continuity block removed per request */}
            {false && (
              <RevealBlock id="continuity" delay={0.46}>
                <ContinuitySection patent={patent} />
              </RevealBlock>
            )}

            {hasGovernmentSection && (
              <RevealBlock id="government" delay={0.48}>
                <GovernmentStandardsSection patent={patent} />
              </RevealBlock>
            )}

            {/* Global Patent Family is intentionally hidden for now and can be restored later.
            <RevealBlock delay={0.46}>
              <GlobalPatentFamilySection patent={patent} />
            </RevealBlock>
            */}
          </div>

          <aside className="mt-10 hidden lg:block lg:mt-0">
            <div className="sticky top-28">
              <SidebarCard patent={patent} view={view} shareFeedback={shareFeedback} onDownload={() => window.print()} onShare={() => void handleShare()} />
              <QuickJumpNavigation activeId={activeJumpId} availableIds={availableJumpIds} items={visibleQuickJumpItems} onJump={handleQuickJump} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <RevealBlock id="related" delay={0.5} className="mt-14 scroll-mt-28 border-t border-slate-100 pt-10">
            <div className="space-y-6">
              <SectionIntro eyebrow="Related patents" title="Continue browsing" description="Comparable filings and adjacent inventions that keep the user in a discovery flow." />
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                {related.map((item) => {
                  const itemStatus = statusOf(item);
                  const summary = relatedSummary(item);
                  return (
                    <Link key={item.id} to={`/patent/${item.id}`} className={cn('min-w-[280px] snap-start md:min-w-0', FOCUS)}>
                      <motion.article whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('flex h-full flex-col p-6', INTERACTIVE)}>
                        <div className="flex items-center justify-between gap-3">
                          {hasText(item.domain) && (
                            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{item.domain}</span>
                          )}
                          <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', statusClasses(itemStatus.tone))}>{itemStatus.label}</span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold leading-7 tracking-tight text-slate-900">{item.title}</h3>
                        {hasText(summary) && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p>
                        )}
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                          <span>{item.publicationNumber}</span>
                          <span className="inline-flex items-center gap-1 font-medium text-teal-700">View patent<ArrowUpRight size={16} /></span>
                        </div>
                      </motion.article>
                    </Link>
                  );
                })}
              </div>
            </div>
          </RevealBlock>
        )}

        <div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-400">
          PatentIntent editorial view combines structured patent metadata with a calmer, reader-first detail experience for quick diligence.
        </div>
      </main>
    </div>
  );
};

const RevealBlock = ({ children, delay = 0, className, id }: { children: React.ReactNode; delay?: number; className?: string; id?: string }) => (
  <motion.section id={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay, ease: EASE }} className={cn(id && 'scroll-mt-28', className)}>
    {children}
  </motion.section>
);

const SectionIntro = ({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>
    <h2 className="text-[1.75rem] font-semibold tracking-tight text-slate-900">{title}</h2>
    <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
  </div>
);

const relationClasses = (relation: string) => {
  if (relation.startsWith('CIP')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (relation.startsWith('CON')) return 'border-teal-200 bg-teal-50 text-teal-700';
  if (relation.startsWith('DIV')) return 'border-slate-200 bg-slate-50 text-slate-700';
  if (relation.startsWith('PRO')) return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const continuityStatusClasses = (tone: ContinuityTone) => {
  if (tone === 'granted') return 'bg-teal-500';
  if (tone === 'pending') return 'bg-amber-500';
  if (tone === 'abandoned') return 'bg-red-500';
  return 'bg-slate-400';
};

const CONTINUITY_TOOLTIP =
  'Detailed patent page coming soon. This family member is not linked yet.';

const TrackOneBadge: React.FC<{ code: string }> = ({ code }) => {
  const colors: Record<string, string> = {
    T1ON: 'bg-blue-50 text-blue-700 border-blue-200',
    T1GR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MPDTG: 'bg-amber-50 text-amber-700 border-amber-200',
    PDTG: 'bg-orange-50 text-orange-700 border-orange-200',
    TK1R: 'bg-red-50 text-red-700 border-red-200',
    T1OFF: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${colors[code] || colors.T1OFF}`}
    >
      {code}
    </span>
  );
};

const PatentTimeline = ({
  timeline,
  activeStep,
  activeStepId,
  mobileStepId,
  onDesktopHover,
  onMobileToggle,
}: {
  timeline: Lifecycle;
  activeStep: Step;
  activeStepId: string;
  mobileStepId: string;
  onDesktopHover: (id: string) => void;
  onMobileToggle: (id: string) => void;
}) => {
  const { steps, trackCodes, continuityApps } = timeline;
  const currentIndex = Math.max(0, steps.findIndex((step) => step.state === 'current'));
  const fillPercent = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;
  const [continuityExpanded, setContinuityExpanded] = useState(continuityApps.length < 4);

  useEffect(() => {
    setContinuityExpanded(continuityApps.length < 4);
  }, [continuityApps.length, timeline.title]);

  const visibleContinuityApps = continuityExpanded
    ? continuityApps
    : continuityApps.slice(0, 3);

  return (
    <>
      <div className={cn('hidden p-6 md:block', CARD)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Primary application
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {steps[0]?.date}
            </p>
          </div>
          {trackCodes.length > 0 ? (
            <div className="flex max-w-[46%] flex-wrap justify-end gap-2">
              {trackCodes.map((code) => (
                <TrackOneBadge key={code} code={code} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative px-1 pt-8 lg:px-2">
          <div className="absolute left-5 right-5 top-5 h-0.5 bg-slate-200" />
          <motion.div initial={{ width: 0 }} animate={{ width: `calc((100% - 2.5rem) * ${fillPercent / 100})` }} transition={{ duration: 0.7, ease: EASE }} className="absolute left-5 top-5 h-0.5 bg-teal-500" />
          <div className="grid gap-2 lg:gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                title={step.trackCodes.length > 0 ? `Track-One: ${step.trackCodes.join(', ')}` : undefined}
                onMouseEnter={() => onDesktopHover(step.id)}
                onFocus={() => onDesktopHover(step.id)}
                className={cn('group relative flex min-w-0 flex-col items-center text-center', FOCUS)}
              >
                <div
                  className={cn(
                    'relative z-[1] flex h-9 w-9 items-center justify-center rounded-full border bg-white transition lg:h-10 lg:w-10',
                    step.state === 'completed'
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : step.state === 'current'
                        ? 'border-teal-500 bg-teal-500 text-white shadow-[0_0_0_8px_rgba(20,184,166,0.12)]'
                        : 'border-slate-200 text-slate-300',
                  )}
                >
                  {step.state === 'completed' ? (
                    <Check size={16} />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-3 break-words text-[13px] font-semibold leading-4 transition lg:text-sm',
                    step.id === activeStepId
                      ? 'text-slate-900'
                      : 'text-slate-500 group-hover:text-slate-900',
                  )}
                >
                  {step.label}
                </span>
                {step.badge && (
                  <span className="mt-2 inline-flex max-w-full rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 lg:px-2.5 lg:text-[11px]">
                    {step.badge}
                  </span>
                )}
                <span className="mt-1 break-words text-[11px] leading-4 text-slate-400 lg:text-xs">
                  {step.date}
                </span>
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={activeStep.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-slate-900">{activeStep.label}</p>
                {activeStep.badge && (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {activeStep.badge}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{activeStep.date}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeStep.detail}</p>
            {activeStep.trackCodes.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeStep.trackCodes.map((code) => (
                  <TrackOneBadge key={`${activeStep.id}-${code}`} code={code} />
                ))}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {continuityApps.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Continuity applications
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Continuations, divisionals, and CIPs branching from the family.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Detail pages for these family members will unlock once their records are added.
                </p>
              </div>
              {continuityApps.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setContinuityExpanded((value) => !value)}
                  className={cn('rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}
                >
                  {continuityExpanded ? 'Collapse' : `Show all ${continuityApps.length}`}
                </button>
              ) : null}
            </div>

            <div className="relative mt-5 space-y-4 pl-7">
              <div className="absolute bottom-0 left-3 top-2 w-px bg-slate-200" />
              {visibleContinuityApps.map((app) => (
                <div
                  key={`${app.relation}-${app.publicationNumber}`}
                  title={CONTINUITY_TOOLTIP}
                  aria-label={`${app.publicationNumber}. ${CONTINUITY_TOOLTIP}`}
                  tabIndex={0}
                  className={cn('group relative block w-full cursor-help rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]', FOCUS)}
                >
                  <span className="absolute left-[-20px] top-6 h-px w-5 bg-slate-200" />
                  <span className="pointer-events-none absolute right-4 top-[-0.65rem] rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    Detail page coming soon
                  </span>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold font-mono', relationClasses(app.relation))}>
                          {app.relation}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {app.publicationNumber}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Filed {app.filingDate}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{app.statusLabel}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    {app.miniTimeline.map((step, index) => (
                      <React.Fragment key={`${app.publicationNumber}-${step.label}`}>
                        <span
                          className={cn(
                            'inline-flex h-3 w-3 rounded-full',
                            step.state === 'done'
                              ? continuityStatusClasses(app.tone)
                              : step.state === 'current'
                                ? continuityStatusClasses(app.tone)
                                : 'bg-slate-200',
                          )}
                        />
                        <span className="text-xs font-medium text-slate-500">{step.label}</span>
                        {index < app.miniTimeline.length - 1 ? (
                          <span className="h-px flex-1 bg-slate-200" />
                        ) : null}
                      </React.Fragment>
                    ))}
                  </div>

                  {app.trackCodes.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {app.trackCodes.map((code) => (
                        <TrackOneBadge key={`${app.publicationNumber}-${code}`} code={code} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        <div className={cn('overflow-hidden p-5', CARD)}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Primary application
          </p>
          <div className="mt-4 space-y-4">
            {steps.map((step) => {
              const isOpen = mobileStepId === step.id;
              return (
                <div key={step.id} className="rounded-2xl border border-slate-200 bg-white">
                  <button type="button" onClick={() => onMobileToggle(isOpen ? '' : step.id)} className={cn('flex w-full items-center justify-between gap-4 px-4 py-4 text-left', FOCUS)}>
                    <div className="flex items-center gap-4">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border bg-white', step.state === 'completed' ? 'border-teal-500 bg-teal-500 text-white' : step.state === 'current' ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-200 text-slate-300')}>
                        {step.state === 'completed' ? <Check size={16} /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                          {step.badge ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              {step.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-400">{step.date}</p>
                      </div>
                    </div>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} className="overflow-hidden">
                        <div className="border-t border-slate-100 px-4 py-4">
                          <p className="text-sm leading-6 text-slate-600">{step.detail}</p>
                          {step.trackCodes.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {step.trackCodes.map((code) => (
                                <TrackOneBadge key={`${step.id}-mobile-${code}`} code={code} />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {trackCodes.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {trackCodes.map((code) => (
                <TrackOneBadge key={`mobile-track-${code}`} code={code} />
              ))}
            </div>
          ) : null}
        </div>

        {continuityApps.length > 0 ? (
          <div className={cn('overflow-hidden p-5', CARD)}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Continuity applications
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Swipe through related continuations and divisionals.
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Detailed family-member pages are not linked yet.
                </p>
              </div>
              {continuityApps.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setContinuityExpanded((value) => !value)}
                  className={cn('rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}
                >
                  {continuityExpanded ? 'Less' : 'More'}
                </button>
              ) : null}
            </div>

            <div className="-mx-5 mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
              {visibleContinuityApps.map((app) => (
                <div
                  key={`mobile-${app.relation}-${app.publicationNumber}`}
                  title={CONTINUITY_TOOLTIP}
                  aria-label={`${app.publicationNumber}. ${CONTINUITY_TOOLTIP}`}
                  tabIndex={0}
                  className={cn('group min-w-[260px] snap-start cursor-help rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-slate-300', FOCUS)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold font-mono', relationClasses(app.relation))}>
                      {app.relation}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {app.publicationNumber}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Filed {app.filingDate}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', continuityStatusClasses(app.tone))} />
                    <span className="text-sm font-medium text-slate-700">{app.statusLabel}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {app.trackCodes.map((code) => (
                      <TrackOneBadge key={`mobile-${app.publicationNumber}-${code}`} code={code} />
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">
                    Detail page coming soon
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

const SidebarCard = ({ patent, view, shareFeedback, onDownload, onShare }: { patent: Patent; view: View; shareFeedback: string; onDownload: () => void; onShare: () => void }) => {
  const familyCount = Math.max(patent.familySize, view.family.length);
  const hasValuation = isKnownNumber(view.valuation);
  const hasStrength = view.strength !== null;

  return (
    <div className={cn('p-6 sm:p-7', CARD)}>
      <div className="space-y-6">
        {(hasValuation || hasStrength) && (
          <div className="rounded-[28px] border border-amber-100 bg-amber-50/80 p-6 shadow-[0_16px_36px_rgba(245,158,11,0.12)]">
            {hasValuation && (
              <>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-600">Indicative valuation</p>
                <p className="mt-3 text-[3rem] font-semibold leading-none tracking-tight text-amber-500 tabular-nums">{formatCompactCurrency(view.valuation)}</p>
              </>
            )}
            {hasStrength && (
              <div className={cn('rounded-2xl border border-white/80 bg-white/80 px-4 py-3', hasValuation ? 'mt-5' : '')}>
                <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-500">Quality score</span><span className="font-semibold tabular-nums text-slate-900">{`${view.strength}/100`}</span></div>
                <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${view.strength || 0}%` }} /></div>
              </div>
            )}
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Legal status</p><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', statusClasses(view.status.tone))}>{view.status.label}</span></div>
          {hasText(view.assignee) && <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Assignee</p><p className="max-w-[60%] text-right text-sm font-semibold text-slate-900">{view.assignee}</p></div>}
          {familyCount > 0 && <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Family size</p><p className="text-sm font-semibold tabular-nums text-slate-900">{familyCount}</p></div>}
        </div>
        {view.dates.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-2"><Clock3 size={16} className="text-teal-600" /><p className="text-sm font-semibold text-slate-900">Key dates</p></div>
            <div className="mt-4 space-y-3">
              {view.dates.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">{item.label}</span><span className="text-sm font-medium text-slate-900">{item.value}</span></div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          <button type="button" onClick={onDownload} className={cn('flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700', FOCUS)}><Download size={16} />Download PDF</button>
          <button type="button" onClick={onShare} className={cn('flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}><Share2 size={16} />Share</button>
        </div>
        <AnimatePresence initial={false}>{shareFeedback ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{shareFeedback}</motion.div> : null}</AnimatePresence>
      </div>
    </div>
  );
};

const Shimmer = ({ className }: { className: string }) => (
  <div className={cn('relative overflow-hidden rounded-3xl bg-white', className)}>
    <motion.div animate={{ x: ['-100%', '140%'] }} transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }} className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white via-slate-100 to-white" />
  </div>
);

const Skeleton = () => (
  <div className="min-h-screen bg-white">
    <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
      <div className="lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.75fr)] lg:gap-12 xl:gap-16">
        <div className="space-y-16">
          <div className="space-y-8"><Shimmer className="h-10 w-52" /><div className="space-y-4 border-b border-slate-100 pb-10"><div className="flex gap-3"><Shimmer className="h-8 w-32" /><Shimmer className="h-8 w-36" /><Shimmer className="h-8 w-24" /></div><Shimmer className="h-24 w-full max-w-4xl" /><Shimmer className="h-24 w-full max-w-3xl" /></div></div>
          <Shimmer className="h-56 w-full" />
          <Shimmer className="h-72 w-full" />
          <div className="grid gap-3 sm:grid-cols-3"><Shimmer className="h-28 w-full" /><Shimmer className="h-28 w-full" /><Shimmer className="h-28 w-full" /></div>
          <Shimmer className="h-48 w-full" />
          <Shimmer className="h-[360px] w-full" />
          <Shimmer className="h-[320px] w-full" />
        </div>
        <div className="mt-10 hidden lg:block lg:mt-0"><Shimmer className="h-[520px] w-full" /></div>
      </div>
    </main>
  </div>
);

const NotFound = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen bg-white">
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className={cn('w-full p-8 text-center sm:p-10', CARD)}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-teal-600"><FileSearch2 size={24} /></div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">Patent not found</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">The selected record could not be loaded. Try returning to the marketplace and opening a different patent detail page.</p>
        <button type="button" onClick={onBack} className={cn('mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}><ArrowLeft size={16} />Back to marketplace</button>
      </div>
    </main>
  </div>
);

export default PatentDetailRedesign;
