import React, { useMemo, useState } from 'react';
import { ChevronDown, Globe2 } from 'lucide-react';
import { Patent } from '../types';

type GlobalPatentFamilySectionProps = {
  patent: Patent;
};

type FamilyStatus = 'Granted' | 'Pending' | 'Abandoned' | 'Expired';

type FamilyMember = {
  code: string;
  country: string;
  publicationNumber: string;
  status: FamilyStatus;
  priorityDate: string;
  flag: string;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  EP: 'Europe',
  WO: 'WIPO',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  DE: 'Germany',
  AU: 'Australia',
  BR: 'Brazil',
  CA: 'Canada',
  ES: 'Spain',
  HK: 'Hong Kong',
  MX: 'Mexico',
  MY: 'Malaysia',
  TW: 'Taiwan',
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EP: '🇪🇺',
  WO: '🌐',
  CN: '🇨🇳',
  JP: '🇯🇵',
  KR: '🇰🇷',
  DE: '🇩🇪',
  AU: '🇦🇺',
  BR: '🇧🇷',
  CA: '🇨🇦',
  ES: '🇪🇸',
  HK: '🇭🇰',
  MX: '🇲🇽',
  MY: '🇲🇾',
  TW: '🇹🇼',
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

const formatDate = (value?: string, fallback = 'Not disclosed') => {
  if (!hasText(value)) return fallback;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return value as string;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const inferStatus = (publicationNumber: string, patent: Patent): FamilyStatus => {
  const normalized = publicationNumber.toUpperCase();
  const currentPublication = patent.publicationNumber.toUpperCase();
  const legalStatus = `${patent.legalStatus || ''} ${patent.simpleLegalStatus || ''}`;

  if (normalized === currentPublication) {
    if (/abandoned/i.test(legalStatus)) return 'Abandoned';
    if (/expired|dead|lapsed/i.test(legalStatus)) return 'Expired';
    if (/granted|issued|alive/i.test(legalStatus)) return 'Granted';
  }

  if (/(?:B\d?|C\d?|T\d?)$/.test(normalized)) return 'Granted';
  if (/expired|lapsed/i.test(legalStatus) && normalized.startsWith(patent.jurisdiction)) return 'Expired';
  if (/abandoned/i.test(legalStatus) && normalized.startsWith(patent.jurisdiction)) return 'Abandoned';
  return 'Pending';
};

const getStatusClasses = (status: FamilyStatus) => {
  if (status === 'Granted') return { dot: 'bg-emerald-500', text: 'text-emerald-700' };
  if (status === 'Abandoned') return { dot: 'bg-red-500', text: 'text-red-700' };
  if (status === 'Expired') return { dot: 'bg-slate-400', text: 'text-slate-500' };
  return { dot: 'bg-amber-500', text: 'text-amber-700' };
};

const parseFamilyMembers = (patent: Patent): FamilyMember[] => {
  const members = patent.inpadocFamilyMembers.filter((member) => hasText(member));

  return members.map((member) => {
    const publicationNumber = member.trim().toUpperCase();
    const code = publicationNumber.slice(0, 2);
    return {
      code,
      country: COUNTRY_NAMES[code] || code,
      publicationNumber,
      status: inferStatus(publicationNumber, patent),
      priorityDate: formatDate(patent.priorityDate),
      flag: COUNTRY_FLAGS[code] || '🏳️',
    };
  });
};

const GlobalPatentFamilySection: React.FC<GlobalPatentFamilySectionProps> = ({ patent }) => {
  const [expanded, setExpanded] = useState(false);

  const family = useMemo(() => parseFamilyMembers(patent), [patent]);
  const visibleOverview = family.slice(0, 5);
  const remainingCount = Math.max(family.length - visibleOverview.length, 0);
  const familyCount = Math.max(family.length, patent.familySize, 1);
  const largestFamilyCount = patent.largestFamilies[0] || String(familyCount);
  const largestFamilyLabel = patent.fit[0] ? `${patent.fit[0]} classification` : 'Family classification';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
              Global Patent Family
            </h3>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {familyCount} members
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{familyCount} members</p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
        >
          {expanded ? 'Collapse' : 'View all'}
          <ChevronDown
            size={16}
            className={`transition ${expanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>
      </div>

      <div className="space-y-6 pt-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Overview
          </p>

          <div className="space-y-2">
            {visibleOverview.map((member) => {
              const statusClasses = getStatusClasses(member.status);
              return (
                <div
                  key={member.publicationNumber}
                  className="flex items-center justify-between gap-4 rounded-lg border border-transparent px-3 py-2 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden="true">
                      {member.flag}
                    </span>
                    <span className="font-medium text-slate-900">{member.code}</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium ${statusClasses.text}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${statusClasses.dot}`} />
                    {member.status}
                  </div>
                </div>
              );
            })}
          </div>

          {!expanded && remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
            >
              + {remainingCount} more
            </button>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Largest Families
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {largestFamilyCount} family members
          </p>
          <p className="mt-1 text-sm text-slate-500">({largestFamilyLabel})</p>
        </div>

        {expanded && (
          <div className="border-t border-slate-100 pt-5">
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
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
                  {family.map((member) => {
                    const statusClasses = getStatusClasses(member.status);
                    return (
                      <tr key={`${member.publicationNumber}-row`}>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="flex items-center gap-3">
                            <span aria-hidden="true">{member.flag}</span>
                            <span>{member.country}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {member.publicationNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 text-sm font-medium ${statusClasses.text}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${statusClasses.dot}`} />
                            {member.status}
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
        )}
      </div>
    </section>
  );
};

export default GlobalPatentFamilySection;
