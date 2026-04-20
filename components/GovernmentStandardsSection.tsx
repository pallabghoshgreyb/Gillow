import React, { useMemo } from 'react';
import { Patent } from '../types';

type GovernmentStandardsSectionProps = {
  patent: Patent;
};

type IndicatorTone = {
  dot: string;
  text: string;
  label: string;
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

const positiveIndicator = (label = 'Yes'): IndicatorTone => ({
  dot: 'bg-teal-500',
  text: 'text-teal-700',
  label,
});

const fitIndicator = (fitValues: string[]): IndicatorTone => ({
  dot: 'bg-teal-500',
  text: 'text-slate-700',
  label: fitValues.join(', '),
});

const StatusRow = ({
  label,
  indicator,
}: {
  label: React.ReactNode;
  indicator: IndicatorTone;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-medium leading-6 text-slate-900">{label}</p>
    <div className={`inline-flex items-center gap-2 text-sm font-medium ${indicator.text}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${indicator.dot}`} />
      {indicator.label}
    </div>
  </div>
);

const GovernmentStandardsSection: React.FC<GovernmentStandardsSectionProps> = ({ patent }) => {
  const sectionData = useMemo(() => {
    const fitValues = patent.fit.filter((value) => hasText(value));
    const rows: Array<{ label: React.ReactNode; indicator: IndicatorTone }> = [];

    if (patent.flags.governmentInterest) {
      rows.push({
        label: 'Government Interest',
        indicator: positiveIndicator(),
      });
    }

    if (patent.flags.sep) {
      rows.push({
        label: (
          <>
            Standard Essential
            <br />
            Patent (SEP)
          </>
        ),
        indicator: positiveIndicator(),
      });
    }

    if (fitValues.length > 0) {
      rows.push({
        label: (
          <>
            Field of Use
            <br />
            (FIT)
          </>
        ),
        indicator: fitIndicator(fitValues),
      });
    }

    return {
      rows,
    };
  }, [patent]);

  if (sectionData.rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Government &amp; Standards
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        {sectionData.rows.map((row, index) => (
          <StatusRow
            key={index}
            label={row.label}
            indicator={row.indicator}
          />
        ))}
      </div>
    </section>
  );
};

export default GovernmentStandardsSection;
