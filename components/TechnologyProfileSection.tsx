import React, { useMemo } from 'react';
import { Patent } from '../types';
import { isKnownNumber } from '../utils/patentDisplay';

type TechnologyProfileSectionProps = {
  patent: Patent;
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getTrlStage = (level: number | null) => {
  if (!level) {
    return { label: 'Not disclosed in current dataset', text: 'text-slate-500' };
  }

  if (level >= 9) {
    return { label: 'Proven in operation', text: 'text-emerald-600' };
  }

  if (level >= 7) {
    return { label: 'System complete', text: 'text-teal-600' };
  }

  if (level >= 4) {
    return { label: 'Development/Validation', text: 'text-slate-600' };
  }

  return { label: 'Concept/Early stage', text: 'text-slate-500' };
};

const TechnologyProfileSection: React.FC<TechnologyProfileSectionProps> = ({ patent }) => {
  const profile = useMemo(() => {
    const level = isKnownNumber(patent.technologyReadinessLevel)
      ? clamp(patent.technologyReadinessLevel, 1, 9)
      : null;
    return {
      domain: hasText(patent.domain) ? patent.domain : '',
      subdomain: hasText(patent.subdomain) ? patent.subdomain : '',
      level,
      stage: getTrlStage(level),
    };
  }, [patent]);

  if (!profile.domain && !profile.subdomain && profile.level === null) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Technology Profile
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        {profile.domain && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Domain
            </p>
            <p className="text-lg font-medium leading-7 text-slate-900">{profile.domain}</p>
          </div>
        )}

        {profile.subdomain && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Subdomain
            </p>
            <p className="text-sm leading-6 text-slate-600">{profile.subdomain}</p>
          </div>
        )}

        {profile.level && (
          <div
            className={
              profile.domain || profile.subdomain
                ? 'border-t border-slate-100 pt-6'
                : ''
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Technology Readiness Level
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="grid flex-1 grid-cols-9 gap-2">
                {Array.from({ length: 9 }, (_, index) => {
                  const segment = index + 1;
                  const isFilled = profile.level ? segment <= profile.level : false;
                  const isCurrent = profile.level === segment;
                  return (
                    <div
                      key={segment}
                      className={[
                        'h-3 rounded-full transition',
                        isFilled ? 'bg-teal-500' : 'bg-slate-200',
                        isCurrent ? 'ring-2 ring-teal-200 ring-offset-2 ring-offset-white' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {profile.level}/9
              </span>
            </div>

            <p className={`mt-3 text-sm font-medium ${profile.stage.text}`}>{profile.stage.label}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TechnologyProfileSection;
