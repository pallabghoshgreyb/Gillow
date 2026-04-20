import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Globe2 } from 'lucide-react';
import { Patent } from '../types';
import GeographicalDistributionMap from './GeographicalDistributionMap';

type GeographicalDistributionSectionProps = {
  patent: Patent;
};

type JurisdictionStatus = 'granted' | 'pending' | 'abandoned' | 'expired';

type FamilyMember = {
  code: string;
  country: string;
  publicationNumber: string;
  priorityDate: string;
  status: JurisdictionStatus;
  statusLabel: string;
};

type CountryGroup = {
  code: string;
  country: string;
  count: number;
  status: JurisdictionStatus;
  statusLabel: string;
  members: FamilyMember[];
};

const EASE = [0.22, 1, 0.36, 1] as const;
const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

const STATUS_ORDER: Record<JurisdictionStatus, number> = {
  granted: 0,
  pending: 1,
  abandoned: 2,
  expired: 3,
};

const COUNTRY_NAMES: Record<string, string> = {
  AU: 'Australia',
  BR: 'Brazil',
  CA: 'Canada',
  CN: 'China',
  DE: 'Germany',
  EP: 'Europe (EPO)',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  HK: 'Hong Kong',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  MX: 'Mexico',
  MY: 'Malaysia',
  SG: 'Singapore',
  TW: 'Taiwan',
  US: 'United States',
  WO: 'WIPO',
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

const formatDate = (value?: string, fallback = '') => {
  if (!hasText(value)) return fallback;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return value as string;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const normalizeMembers = (patent: Patent) => {
  const source = patent.inpadocFamilyMembers.length > 0
    ? patent.inpadocFamilyMembers
    : [patent.publicationNumber];

  return source
    .flatMap((member) => String(member).split('|'))
    .map((member) => member.trim().toUpperCase())
    .filter(Boolean);
};

const resolveLegalStatus = (
  patent: Patent,
): { status: JurisdictionStatus; label: string } => {
  const legalStatus = `${patent.legalStatus || ''} ${patent.simpleLegalStatus || ''}`.trim();
  const label = hasText(patent.legalStatus)
    ? patent.legalStatus.trim()
    : hasText(patent.simpleLegalStatus)
      ? patent.simpleLegalStatus.trim()
      : 'Pending';

  if (/abandoned/i.test(legalStatus)) {
    return { status: 'abandoned', label };
  }

  if (/expired|dead|lapsed/i.test(legalStatus)) {
    return { status: 'expired', label };
  }

  if (/granted|issued|alive/i.test(legalStatus)) {
    return { status: 'granted', label };
  }

  return { status: 'pending', label };
};

const statusMeta = (status: JurisdictionStatus) => {
  if (status === 'granted') {
    return {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
      pulse: 'rgba(16, 185, 129, 0.2)',
    };
  }

  if (status === 'pending') {
    return {
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
      pulse: 'rgba(245, 158, 11, 0.2)',
    };
  }

  if (status === 'abandoned') {
    return {
      badge: 'border-red-200 bg-red-50 text-red-700',
      dot: 'bg-red-500',
      pulse: 'rgba(239, 68, 68, 0.2)',
    };
  }

  return {
    badge: 'border-slate-200 bg-slate-50 text-slate-500',
    dot: 'bg-slate-400',
    pulse: 'rgba(148, 163, 184, 0.18)',
  };
};

const countryName = (code: string) => COUNTRY_NAMES[code] || code;

const JurisdictionMark = ({ code, selected }: { code: string; selected: boolean }) => (
  <div
    className={cn(
      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold shadow-sm transition',
      selected
        ? 'border-teal-300 bg-teal-50 text-teal-700'
        : 'border-slate-200 bg-white text-slate-700',
    )}
    aria-hidden="true"
  >
    {code === 'WO' ? <Globe2 size={18} /> : code}
  </div>
);

const buildGroups = (patent: Patent): CountryGroup[] => {
  const grouped = new Map<string, FamilyMember[]>();
  const members = normalizeMembers(patent);
  const resolvedStatus = resolveLegalStatus(patent);

  members.forEach((publicationNumber) => {
    const code = publicationNumber.slice(0, 2);
    if (!/^[A-Z]{2}$/.test(code)) return;

    const next: FamilyMember = {
      code,
      country: countryName(code),
      publicationNumber,
      priorityDate: formatDate(patent.priorityDate),
      status: resolvedStatus.status,
      statusLabel: resolvedStatus.label,
    };

    const current = grouped.get(code) || [];
    current.push(next);
    grouped.set(code, current);
  });

  return Array.from(grouped.entries())
    .map(([code, membersForCountry]) => {
      const sortedMembers = [...membersForCountry].sort((left, right) =>
        left.publicationNumber.localeCompare(right.publicationNumber),
      );
      const status: JurisdictionStatus = sortedMembers.some(
        (member) => member.status === 'granted',
      )
        ? 'granted'
        : sortedMembers.some((member) => member.status === 'pending')
          ? 'pending'
          : sortedMembers.some((member) => member.status === 'recorded')
            ? 'recorded'
          : 'expired';

      return {
        code,
        country: countryName(code),
        count: sortedMembers.length,
        status,
        statusLabel:
          sortedMembers.find((member) => member.status === status)?.statusLabel ||
          sortedMembers[0]?.statusLabel ||
          '',
        members: sortedMembers,
      };
    })
    .sort((left, right) => {
      const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
      if (statusDelta !== 0) return statusDelta;
      const countDelta = right.count - left.count;
      if (countDelta !== 0) return countDelta;
      return left.country.localeCompare(right.country);
    });
};

const GeographicalDistributionSection: React.FC<GeographicalDistributionSectionProps> = ({
  patent,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const countryRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const groups = useMemo(() => buildGroups(patent), [patent]);
  const tableRows = useMemo(
    () =>
      groups.flatMap((group) =>
        group.members.map((member) => ({ ...member })),
      ),
    [groups],
  );
  const jurisdictionCount = groups.length;
  const totalMembers = tableRows.length;

  if (groups.length === 0) {
    return null;
  }

  const focusCountry = (code: string) => {
    setSelectedCode(code);
    const target = countryRefs.current[code];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    window.setTimeout(() => target.focus(), 180);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
            Geographical Distribution
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Patent family coverage across {jurisdictionCount} jurisdiction
            {jurisdictionCount === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          {expanded ? 'Hide table' : 'View all'}
          <ChevronDown
            size={16}
            className={`transition ${expanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      </div>

      <div className="space-y-6 pt-6">
        <GeographicalDistributionMap groups={groups} onSelect={focusCountry} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Jurisdictions
            </p>
            <p className="text-sm text-slate-500">{totalMembers} total family members</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {groups.map((group) => {
              const meta = statusMeta(group.status);
              const isSelected = selectedCode === group.code;

              return (
                <motion.button
                  key={group.code}
                  ref={(node) => {
                    countryRefs.current[group.code] = node;
                  }}
                  type="button"
                  onClick={() =>
                    setSelectedCode((current) => (current === group.code ? null : group.code))
                  }
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className={[
                    'flex min-h-[192px] flex-col rounded-2xl border bg-gradient-to-b from-white to-slate-50/70 p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 sm:p-5',
                    isSelected
                      ? 'border-teal-300 shadow-[0_14px_32px_rgba(13,148,136,0.14)]'
                      : 'border-slate-200 hover:border-teal-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <JurisdictionMark code={group.code} selected={isSelected} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Jurisdiction
                        </p>
                        <p className="mt-2 text-lg font-semibold leading-6 text-slate-900">
                          {group.country}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {group.count} patent{group.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {group.count}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${meta.badge}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {group.statusLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                      {isSelected ? 'Hide details' : 'View details'}
                      <ArrowRight
                        size={14}
                        className={cn('transition', isSelected && 'rotate-90')}
                      />
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-4 space-y-2 md:hidden">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Family members
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.members.map((member) => (
                          <span
                            key={member.publicationNumber}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600"
                          >
                            {member.publicationNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: EASE }}
                        className="hidden overflow-hidden md:block"
                      >
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Family members
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.members.map((member) => (
                              <span
                                key={member.publicationNumber}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600"
                              >
                                {member.publicationNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-200">
                <div className="max-h-[360px] overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Country</th>
                        <th className="px-4 py-3 font-semibold">Publication Number</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Priority Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tableRows.map((member, index) => {
                        const meta = statusMeta(member.status);
                        const isSelected = selectedCode === member.code;

                        return (
                          <tr
                            key={`${member.publicationNumber}-${index}`}
                            className={isSelected ? 'bg-teal-50/40' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                          >
                            <td className="px-4 py-3 text-slate-700">
                              <div className="flex items-center gap-3">
                                <JurisdictionMark code={member.code} selected={isSelected} />
                                <div>
                                  <p className="font-medium text-slate-900">{member.country}</p>
                                  <p className="text-xs text-slate-400">{member.code}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {member.publicationNumber}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badge}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                {member.statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{member.priorityDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default GeographicalDistributionSection;
