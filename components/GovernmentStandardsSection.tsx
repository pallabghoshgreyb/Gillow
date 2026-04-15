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

const booleanIndicator = (value: boolean | null | undefined): IndicatorTone => {
  if (value === true) {
    return {
      dot: 'bg-teal-500',
      text: 'text-teal-700',
      label: 'Yes',
    };
  }

  if (value === false) {
    return {
      dot: 'bg-slate-300',
      text: 'text-slate-500',
      label: 'No',
    };
  }

  return {
    dot: 'bg-slate-200',
    text: 'text-slate-400',
    label: 'Not specified',
  };
};

const fitIndicator = (fitValues: string[]): IndicatorTone => {
  if (fitValues.length > 0) {
    return {
      dot: 'bg-teal-500',
      text: 'text-slate-700',
      label: fitValues.join(', '),
    };
  }

  return {
    dot: 'bg-slate-200',
    text: 'text-slate-400',
    label: 'None specified',
  };
};

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
    const governmentInterest = booleanIndicator(patent.flags.governmentInterest);
    const sep = booleanIndicator(patent.flags.sep);
    const fit = fitIndicator(fitValues);

    const shouldHide =
      fitValues.length === 0 &&
      patent.flags.governmentInterest == null &&
      patent.flags.sep == null;

    return {
      governmentInterest,
      sep,
      fit,
      shouldHide,
    };
  }, [patent]);

  if (sectionData.shouldHide) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Government &amp; Standards
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        <StatusRow
          label="Government Interest"
          indicator={sectionData.governmentInterest}
        />

        <StatusRow
          label={
            <>
              Standard Essential
              <br />
              Patent (SEP)
            </>
          }
          indicator={sectionData.sep}
        />

        <StatusRow
          label={
            <>
              Field of Use
              <br />
              (FIT)
            </>
          }
          indicator={sectionData.fit}
        />
      </div>
    </section>
  );
};

export default GovernmentStandardsSection;
