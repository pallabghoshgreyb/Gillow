import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Patent } from '../types';
import { hasText, isKnownNumber } from '../utils/patentDisplay';

type CitationColumnProps = {
  title: string;
  description: string;
  count: number;
  items: string[];
  tone: 'teal' | 'sky';
  direction: 'backward' | 'forward';
};

const uniqueValues = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(hasText)));

const toneClasses = {
  teal: {
    icon: 'bg-teal-50 text-teal-700',
    badge: 'border-teal-200 bg-teal-50 text-teal-700',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700',
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
  },
};

const CitationColumn: React.FC<CitationColumnProps> = ({
  title,
  description,
  count,
  items,
  tone,
  direction,
}) => {
  const values = uniqueValues(items);
  const visibleValues = values.slice(0, 18);
  const remaining = values.length - visibleValues.length;
  const displayCount = isKnownNumber(count) ? count : values.length;
  const Icon = direction === 'backward' ? ArrowDownLeft : ArrowUpRight;
  const classes = toneClasses[tone];

  if (!isKnownNumber(displayCount) && values.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${classes.icon}`}>
            <Icon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {isKnownNumber(displayCount) && (
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold tabular-nums ${classes.badge}`}>
            {displayCount}
          </span>
        )}
      </div>

      {visibleValues.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {visibleValues.map((citation) => (
            <span
              key={citation}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-600"
            >
              {citation}
            </span>
          ))}
          {remaining > 0 && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              +{remaining} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const CitationIntelligenceSection: React.FC<{ patent: Patent }> = ({ patent }) => {
  const backwardCitations = uniqueValues(patent.backwardCitations);
  const forwardCitations = uniqueValues(patent.forwardCitations);
  const hasBackward =
    isKnownNumber(patent.backwardCitationsCount) || backwardCitations.length > 0;
  const hasForward =
    isKnownNumber(patent.forwardCitationsCount) || forwardCitations.length > 0;

  if (!hasBackward && !hasForward) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Citation Intelligence
        </h3>
      </div>

      <div className="grid gap-4 pt-6 lg:grid-cols-2">
        {hasBackward && (
          <CitationColumn
            title="Backward Citations"
            description="Prior art and cited references connected to this patent."
            count={patent.backwardCitationsCount}
            items={backwardCitations}
            tone="teal"
            direction="backward"
          />
        )}

        {hasForward && (
          <CitationColumn
            title="Forward Citations"
            description="Later patents citing this asset in the current dataset."
            count={patent.forwardCitationsCount}
            items={forwardCitations}
            tone="sky"
            direction="forward"
          />
        )}
      </div>
    </section>
  );
};

export default CitationIntelligenceSection;
