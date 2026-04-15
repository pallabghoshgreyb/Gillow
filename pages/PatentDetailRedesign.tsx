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

const FONT = '"Inter", ui-sans-serif, system-ui, sans-serif';
const EASE = [0.22, 1, 0.36, 1] as const;
const CARD = 'rounded-3xl border border-slate-200 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.03)]';
const INTERACTIVE = `${CARD} transition duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]`;
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

const FAMILY_FALLBACK = [
  { country: 'United States of America', code: 'US', status: 'Granted', note: 'Core grant jurisdiction.' },
  { country: 'Europe (EPO)', code: 'EP', status: 'Published', note: 'Regional prosecution route.' },
  { country: 'WIPO', code: 'WO', status: 'Filed', note: 'International family expansion.' },
  { country: 'Japan', code: 'JP', status: 'Filed', note: 'Strategic robotics market coverage.' },
];

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
type StepState = 'completed' | 'current' | 'upcoming';
type Step = {
  id: string;
  label: string;
  date: string;
  detail: string;
  state: StepState;
  badge?: string;
};
type Claim = { label: string; value: number; hint: string; icon: LucideIcon };
type History = { id: string; title: string; date: string; detail: string; tone: 'done' | 'active' | 'muted' };
type FamilyEntry = { country: string; code: string; status: string; note: string };
type View = {
  title: string;
  number: string;
  assignee: string;
  status: { label: string; tone: Tone };
  valuation: number;
  confidence: number;
  abstractPreview: string;
  abstractRest: string;
  timeline: Step[];
  claims: Claim[];
  classifications: string[];
  strength: number;
  strengthNote: string;
  strengthHighlights: string[];
  dates: Array<{ label: string; value: string }>;
  history: History[];
  family: FamilyEntry[];
  familySummary: string;
};

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');
const uniq = (items: string[]) => Array.from(new Set(items.filter(hasText).map((item) => item.trim())));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDate = (value?: string, fallback = 'Not disclosed') => {
  if (!hasText(value)) return fallback;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return value as string;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMoney = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '$1.4M';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  return `$${(value / 1_000_000).toFixed(1)}M`;
};

const leadAssignee = (patent: Patent) =>
  patent.currentAssignees[0] || patent.originalAssignees[0] || patent.applicants[0] || patent.assignee.name || 'PatentXchange listing';

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
  if (hasText(patent.publicationDate)) return 'publication';
  if (hasText(patent.allowanceDate)) return 'allowance';
  if (patent.rceCount > 0) return 'rce';
  if (patent.officeActionsCount > 0) return 'examination';
  if (hasText(patent.firstActionDate)) return 'first-action';
  return 'filing';
};

const buildTimeline = (patent: Patent, status: { label: string; tone: Tone }) => {
  const steps: Omit<Step, 'state'>[] = [
    {
      id: 'filing',
      label: 'Filing',
      date: formatDate(patent.filingDate),
      detail: `Application ${hasText(patent.applicationNumber) ? patent.applicationNumber : 'record'} established priority and opened prosecution.`,
    },
    {
      id: 'first-action',
      label: 'First Office Action',
      date: hasText(patent.firstActionDate) ? formatDate(patent.firstActionDate) : 'In review',
      detail: hasText(patent.firstActionDate)
        ? 'The first substantive office action established the initial examination posture.'
        : 'No dated first office action is surfaced in the current record.',
    },
    {
      id: 'examination',
      label: 'Examination',
      date: patent.officeActionsCount > 0 ? 'Active review' : 'Awaiting review',
      detail: patent.officeActionsCount > 0 ? `${patent.officeActionsCount} recorded office action${patent.officeActionsCount === 1 ? '' : 's'} shaped the examination path.` : 'No office action count is surfaced in the current record yet.',
      badge: patent.officeActionsCount > 0 ? `${patent.officeActionsCount} OA` : undefined,
    },
    ...(patent.rceCount > 0
      ? [
          {
            id: 'rce',
            label: 'RCE Filed',
            date: patent.rceCount === 1 ? '1 request' : `${patent.rceCount} requests`,
            detail: `${patent.rceCount} request${patent.rceCount === 1 ? '' : 's'} for continued examination ${patent.rceCount === 1 ? 'was' : 'were'} recorded before final disposition.`,
          },
        ]
      : []),
    {
      id: 'allowance',
      label: 'Allowed',
      date: hasText(patent.allowanceDate) ? formatDate(patent.allowanceDate) : 'Pending',
      detail: hasText(patent.allowanceDate)
        ? 'Allowance indicates the application cleared examination and moved toward issuance.'
        : 'No allowance date is currently surfaced in the prosecution record.',
    },
    {
      id: 'publication',
      label: 'Publication',
      date: formatDate(patent.publicationDate, 'Pending'),
      detail: `Public disclosure under ${patent.publicationNumber || 'the published application'} expanded visibility and citation potential.`,
    },
    {
      id: 'grant',
      label: 'Granted',
      date: status.tone === 'granted' ? formatDate(patent.publicationDate || patent.allowanceDate) : 'Pending',
      detail: status.tone === 'granted' ? 'Rights are active and licensable, with current status aligned to a granted posture.' : 'Disposition is still evolving and should be confirmed during diligence.',
    },
    {
      id: 'expiry',
      label: 'Expiry',
      date: formatDate(patent.estimatedExpirationDate),
      detail: 'Expected term end based on current filing data and standard patent term assumptions.',
    },
  ];
  const current = Math.max(
    0,
    steps.findIndex((step) => step.id === timelineCurrentStepId(patent, status.tone)),
  );

  return steps.map((step, index) => ({
    ...step,
    state: index < current ? 'completed' : index === current ? 'current' : 'upcoming',
  })) as Step[];
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
  const base = countries.length > 0 ? countries : FAMILY_FALLBACK.map((entry) => entry.country);
  return base.slice(0, 6).map((country, index) => ({
    country,
    code: COUNTRY_CODES[country] || FAMILY_FALLBACK[index]?.code || patent.jurisdiction || 'US',
    status: index === 0 ? status.label : index < 3 ? 'Published' : 'Filed',
    note: index === 0 ? `${status.label} in the reference jurisdiction.` : FAMILY_FALLBACK[index]?.note || 'Family member extending territorial coverage.',
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
  return `Technical fit in ${patent.domain || 'medical robotics'} with claim posture suited to comparison and diligence.`;
};

const makeView = (patent: Patent): View => {
  const title = hasText(patent.title) ? patent.title : 'Surgical robotics systems and devices having a sterile restart, and methods thereof';
  const abstract = hasText(patent.abstract)
    ? patent.abstract
    : 'This patent describes a surgical robotics platform designed to recover quickly after a sterile interruption, preserving instrument awareness, procedure continuity, and operator confidence. The disclosure combines robotic motion control, restart sequencing, and clinical workflow safeguards so an operating room team can resume a procedure without repeating every system setup step. The overall result is stronger uptime, lower procedural friction, and a more commercially licensable surgical robotics platform.';
  const status = statusOf(patent);
  const split = splitAbstract(abstract);
  const totalClaims = patent.totalClaims || patent.independentClaimsCount + patent.dependentClaimsCount || 21;
  const strength = clamp(patent.qualityScore || 87, 0, 100);
  const family = buildFamily(patent, status);
  const classifications = uniq([...patent.cpcs, ...patent.ipcs]).slice(0, 6);
  return {
    title,
    number: patent.publicationNumber || 'US11844585B1',
    assignee: leadAssignee(patent),
    status,
    valuation: patent.askingPrice || patent.valuationEstimate || 1_400_000,
    confidence: clamp(Math.round((strength * 0.78) + 20), 72, 98),
    abstractPreview: split.preview,
    abstractRest: split.rest,
    timeline: buildTimeline(patent, status),
    claims: [
      { label: 'Independent claims', value: patent.independentClaimsCount || 1, hint: 'Core coverage', icon: ShieldCheck },
      { label: 'Dependent claims', value: patent.dependentClaimsCount || Math.max(totalClaims - (patent.independentClaimsCount || 1), 0), hint: 'Fallback protection', icon: Link2 },
      { label: 'Total claims', value: totalClaims, hint: 'Overall scope', icon: Scale },
    ],
    classifications: classifications.length > 0 ? classifications : ['A61B34/37', 'A61B34/74', 'B25J9/0084', 'A61B46/10'],
    strength,
    strengthNote: strength >= 85 ? 'High-conviction filing posture with strong claim structure, commercial relevance, and territorial defensibility.' : strength >= 72 ? 'Balanced patent posture with credible licensing value and a prosecution record suited to diligence review.' : 'Promising asset, but legal and commercial diligence should stay tightly coupled before pricing decisions.',
    strengthHighlights: [`${Math.max(patent.familySize || family.length, family.length)} family members`, `${Math.max(patent.forwardCitationsCount, patent.citations, 0)} forward citations`, `${hasText(patent.gau) ? `GAU ${patent.gau}` : 'Utility patent'} review path`],
    dates: [
      { label: 'Filed', value: formatDate(patent.filingDate) },
      { label: 'Published', value: formatDate(patent.publicationDate, 'Pending') },
      { label: status.tone === 'granted' ? 'Granted' : 'Disposition', value: status.tone === 'granted' ? formatDate(patent.allowanceDate || patent.publicationDate) : status.label },
      { label: 'Expires', value: formatDate(patent.estimatedExpirationDate) },
    ],
    history: buildHistory(patent, status),
    family,
    familySummary: `${Math.max(patent.familySize || family.length, family.length)} family member${Math.max(patent.familySize || family.length, family.length) === 1 ? '' : 's'} across ${family.length} jurisdiction${family.length === 1 ? '' : 's'}.`,
  };
};
const PatentDetailRedesign: React.FC = () => {
  const { patentId } = useParams();
  const navigate = useNavigate();
  const [patent, setPatent] = useState<Patent | null>(null);
  const [related, setRelated] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareFeedback, setShareFeedback] = useState('');
  const [showFullAbstract, setShowFullAbstract] = useState(false);
  const [activeStepId, setActiveStepId] = useState('');
  const [mobileStepId, setMobileStepId] = useState('');
  const [activeJumpId, setActiveJumpId] = useState('overview');
  const [availableJumpIds, setAvailableJumpIds] = useState<string[]>([]);
  const view = useMemo(() => (patent ? makeView(patent) : null), [patent]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!patentId) {
        setPatent(null);
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
          setRelated([]);
          setLoading(false);
          return;
        }
        setPatent(current);
        const ranked = allPatents.filter((item) => item.id !== current.id).sort((a, b) => patentScore(current, b) - patentScore(current, a));
        setRelated((ranked.length > 0 ? ranked : allPatents.filter((item) => item.id !== current.id)).slice(0, 3));
      } catch (error) {
        console.error('Failed to load patent detail page', error);
        if (!alive) return;
        setPatent(null);
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
    if (!view?.timeline.length) return;
    const current = view.timeline.find((step) => step.state === 'current') || view.timeline[0];
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

    const sectionNodes = QUICK_JUMP_ITEMS.map((item) => ({
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
  }, [view]);

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

  const activeStep = view.timeline.find((step) => step.id === activeStepId) || view.timeline[0];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: FONT }}>
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
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    <CalendarDays size={14} className="text-slate-400" />
                    Filed {formatDate(patent.filingDate)}
                  </span>
                  <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium', statusClasses(view.status.tone))}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {view.status.label}
                  </span>
                </div>
                <div className="space-y-4">
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">{view.assignee}</p>
                  <h1 className="max-w-[800px] text-[clamp(2.25rem,4vw,2.625rem)] font-semibold tracking-[-0.02em] leading-[1.18] text-slate-900">{view.title}</h1>
                  <p className="max-w-[760px] text-base leading-7 text-slate-600">{view.abstractPreview}</p>
                </div>
              </div>
              <div className="lg:hidden">
                <SidebarCard patent={patent} view={view} shareFeedback={shareFeedback} onDownload={() => window.print()} onShare={() => void handleShare()} />
              </div>
            </motion.div>

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

            <motion.section id="timeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.22, ease: EASE }} className="scroll-mt-28 space-y-5">
              <SectionIntro eyebrow="Patent timeline" title="Compact lifecycle view" description="A quick read on where the patent sits in prosecution and term." />
              <PatentTimeline steps={view.timeline} activeStep={activeStep} activeStepId={activeStepId} mobileStepId={mobileStepId} onDesktopHover={setActiveStepId} onMobileToggle={setMobileStepId} />
            </motion.section>

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

            <RevealBlock id="strength" delay={0.28}>
              <div className="space-y-5">
                <SectionIntro eyebrow="Intellectual property strength" title="Strength assessment" description="A concise read on commercial quality, family breadth, and prosecution posture." />
                <motion.div whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('p-6 sm:p-8', INTERACTIVE)}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.16em] text-teal-700">PatentXchange score</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Licensing-readiness signal</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">{view.strength}</p>
                      <p className="text-sm text-slate-400">out of 100</p>
                    </div>
                  </div>
                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${view.strength}%` }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" />
                  </div>
                  <p className="mt-5 text-base leading-7 text-slate-600">{view.strengthNote}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {view.strengthHighlights.map((item) => (
                      <span key={item} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">{item}</span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </RevealBlock>

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

            <RevealBlock id="ownership" delay={0.32}>
              <OwnershipSection
                currentAssignees={patent.currentAssignees}
                originalAssignees={patent.originalAssignees}
                inventors={patent.inventors}
                applicants={patent.applicants}
              />
            </RevealBlock>

            <RevealBlock id="fees" delay={0.34}>
              <FeeStatusSection patent={patent} />
            </RevealBlock>

            <RevealBlock id="risk" delay={0.36}>
              <RiskAssessmentSection patent={patent} />
            </RevealBlock>

            <RevealBlock id="technology" delay={0.38}>
              <TechnologyProfileSection patent={patent} />
            </RevealBlock>

            <RevealBlock id="geography" delay={0.4}>
              <GeographicalDistributionSection patent={patent} />
            </RevealBlock>

            <RevealBlock id="valuation-breakdown" delay={0.42}>
              <ValuationBreakdownSection patent={patent} valuation={view.valuation} />
            </RevealBlock>

            <RevealBlock id="examination" delay={0.44}>
              <ExaminationDetailsSection patent={patent} />
            </RevealBlock>

            <RevealBlock id="continuity" delay={0.46}>
              <ContinuitySection patent={patent} />
            </RevealBlock>

            <RevealBlock id="government" delay={0.48}>
              <GovernmentStandardsSection patent={patent} />
            </RevealBlock>

            {/* Global Patent Family is intentionally hidden for now and can be restored later.
            <RevealBlock delay={0.46}>
              <GlobalPatentFamilySection patent={patent} />
            </RevealBlock>
            */}
          </div>

          <aside className="mt-10 hidden lg:block lg:mt-0">
            <div className="sticky top-28">
              <SidebarCard patent={patent} view={view} shareFeedback={shareFeedback} onDownload={() => window.print()} onShare={() => void handleShare()} />
              <QuickJumpNavigation activeId={activeJumpId} availableIds={availableJumpIds} items={QUICK_JUMP_ITEMS} onJump={handleQuickJump} />
            </div>
          </aside>
        </div>

        <RevealBlock id="related" delay={0.5} className="mt-14 scroll-mt-28 border-t border-slate-100 pt-10">
          <div className="space-y-6">
            <SectionIntro eyebrow="Related patents" title="Continue browsing" description="Comparable filings and adjacent inventions that keep the user in a discovery flow." />
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {related.map((item) => {
                const itemStatus = statusOf(item);
                return (
                  <Link key={item.id} to={`/patent/${item.id}`} className={cn('min-w-[280px] snap-start md:min-w-0', FOCUS)}>
                    <motion.article whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(15,23,42,0.06)' }} className={cn('flex h-full flex-col p-6', INTERACTIVE)}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{item.domain || 'Medical technology'}</span>
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', statusClasses(itemStatus.tone))}>{itemStatus.label}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold leading-7 tracking-tight text-slate-900">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{relatedSummary(item)}</p>
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

        <div className="mt-8 border-t border-slate-100 pt-5 text-sm text-slate-400">
          PatentXchange editorial view combines structured patent metadata with a calmer, reader-first detail experience for quick diligence.
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

const PatentTimeline = ({
  steps,
  activeStep,
  activeStepId,
  mobileStepId,
  onDesktopHover,
  onMobileToggle,
}: {
  steps: Step[];
  activeStep: Step;
  activeStepId: string;
  mobileStepId: string;
  onDesktopHover: (id: string) => void;
  onMobileToggle: (id: string) => void;
}) => {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.state === 'current'));
  const fillPercent = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;
  return (
    <>
      <div className={cn('hidden p-6 md:block', CARD)}>
        <div className="overflow-x-auto">
          <div className="relative min-w-[880px] px-2 pt-1">
            <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-200" />
            <motion.div initial={{ width: 0 }} animate={{ width: `calc((100% - 3rem) * ${fillPercent / 100})` }} transition={{ duration: 0.7, ease: EASE }} className="absolute left-6 top-5 h-0.5 bg-teal-500" />
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((step) => (
              <button key={step.id} type="button" onMouseEnter={() => onDesktopHover(step.id)} onFocus={() => onDesktopHover(step.id)} className={cn('group relative flex flex-col items-center text-center', FOCUS)}>
                <div className={cn('relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border bg-white transition', step.state === 'completed' ? 'border-teal-500 bg-teal-500 text-white' : step.state === 'current' ? 'border-teal-500 bg-teal-500 text-white shadow-[0_0_0_8px_rgba(20,184,166,0.12)]' : 'border-slate-200 text-slate-300')}>
                  {step.state === 'completed' ? <Check size={16} /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                </div>
                <span className={cn('mt-4 text-sm font-semibold transition', step.id === activeStepId ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900')}>{step.label}</span>
                {step.badge && (
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {step.badge}
                  </span>
                )}
                <span className="mt-1 text-xs text-slate-400">{step.date}</span>
              </button>
            ))}
            </div>
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
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="space-y-3 md:hidden">
        {steps.map((step) => {
          const isOpen = mobileStepId === step.id;
          return (
            <div key={step.id} className={cn('overflow-hidden', CARD)}>
              <button type="button" onClick={() => onMobileToggle(isOpen ? '' : step.id)} className={cn('flex w-full items-center justify-between gap-4 px-5 py-4 text-left', FOCUS)}>
                <div className="flex items-center gap-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border bg-white', step.state === 'completed' ? 'border-teal-500 bg-teal-500 text-white' : step.state === 'current' ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-200 text-slate-300')}>
                    {step.state === 'completed' ? <Check size={16} /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                      {step.badge && (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                          {step.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{step.date}</p>
                  </div>
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} className="text-slate-400" /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} className="overflow-hidden">
                    <div className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{step.detail}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
};

const SidebarCard = ({ patent, view, shareFeedback, onDownload, onShare }: { patent: Patent; view: View; shareFeedback: string; onDownload: () => void; onShare: () => void }) => (
  <div className={cn('p-6 sm:p-7', CARD)}>
    <div className="space-y-6">
      <div className="rounded-[28px] border border-amber-100 bg-amber-50/80 p-6 shadow-[0_16px_36px_rgba(245,158,11,0.12)]">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-600">Indicative valuation</p>
        <p className="mt-3 text-[3rem] font-semibold leading-none tracking-tight text-amber-500 tabular-nums">{formatMoney(view.valuation)}</p>
        <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-500">Confidence score</span><span className="font-semibold tabular-nums text-slate-900">{view.confidence}/100</span></div>
          <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${view.confidence}%` }} /></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Legal status</p><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-medium', statusClasses(view.status.tone))}>{view.status.label}</span></div>
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Assignee</p><p className="max-w-[60%] text-right text-sm font-semibold text-slate-900">{view.assignee}</p></div>
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-500">Family size</p><p className="text-sm font-semibold tabular-nums text-slate-900">{Math.max(patent.familySize, view.family.length)}</p></div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center gap-2"><Clock3 size={16} className="text-teal-600" /><p className="text-sm font-semibold text-slate-900">Key dates</p></div>
        <div className="mt-4 space-y-3">
          {view.dates.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">{item.label}</span><span className="text-sm font-medium text-slate-900">{item.value}</span></div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <button type="button" onClick={onDownload} className={cn('flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-teal-700', FOCUS)}><Download size={16} />Download PDF</button>
        <button type="button" onClick={onShare} className={cn('flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-700', FOCUS)}><Share2 size={16} />Share</button>
      </div>
      <AnimatePresence initial={false}>{shareFeedback ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{shareFeedback}</motion.div> : null}</AnimatePresence>
    </div>
  </div>
);

const Shimmer = ({ className }: { className: string }) => (
  <div className={cn('relative overflow-hidden rounded-3xl bg-white', className)}>
    <motion.div animate={{ x: ['-100%', '140%'] }} transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }} className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white via-slate-100 to-white" />
  </div>
);

const Skeleton = () => (
  <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
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
  <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
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
