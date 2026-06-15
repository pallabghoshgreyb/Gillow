import React, { useMemo } from 'react';
import { Patent } from '../types';
import { formatCompactCurrency, isKnownNumber } from '../utils/patentDisplay';

type ValuationBreakdownSectionProps = {
  patent: Patent;
  valuation: number | null;
};

type MetricCard = {
  label: string;
  score: number | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toMetricScore = (value: number) => (isKnownNumber(value) ? clamp(value, 0, 100) : null);

const computeMetrics = (patent: Patent): MetricCard[] => {
  return [
    { label: 'Strategic', score: toMetricScore(patent.valuationMetrics.strategicValue) },
    { label: 'Market', score: toMetricScore(patent.valuationMetrics.marketValue) },
    { label: 'Technology', score: toMetricScore(patent.valuationMetrics.technologyValue) },
    { label: 'Economic', score: toMetricScore(patent.valuationMetrics.economicValue) },
    { label: 'Legal', score: toMetricScore(patent.valuationMetrics.legalValue) },
  ];
};

const MetricTile = ({ label, score }: MetricCard) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-700">{label}</p>
    {score !== null ? (
      <>
        <p className="mt-3 text-lg font-bold tabular-nums text-slate-900">{score}/100</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-teal-500" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-500">{score}%</p>
      </>
    ) : (
      <>
        <p className="mt-3 text-lg font-bold text-slate-500">Not disclosed</p>
        <p className="mt-3 text-sm text-slate-500">
          No category score is provided in the current dataset.
        </p>
      </>
    )}
  </div>
);

const ValuationBreakdownSection: React.FC<ValuationBreakdownSectionProps> = ({
  patent,
  valuation,
}) => {
  const metrics = useMemo(() => computeMetrics(patent), [patent]);
  const legalMetric = metrics[4];
  const topMetrics = metrics.slice(0, 4);
  const visibleTopMetrics = topMetrics.filter((metric) => metric.score !== null);
  const hasLegalMetric = legalMetric.score !== null;
  const valuationLabel = formatCompactCurrency(valuation);

  if (visibleTopMetrics.length === 0 && !hasLegalMetric) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Valuation Components
        </h3>
        {valuationLabel !== 'Not listed' && (
          <p className="mt-2 text-sm text-slate-600">
            How the {valuationLabel} valuation is calculated
          </p>
        )}
      </div>

      <div className="space-y-4 pt-6">
        {visibleTopMetrics.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTopMetrics.map((metric) => (
              <MetricTile key={metric.label} {...metric} />
            ))}
          </div>
        )}

        {hasLegalMetric && (
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">Legal Value</p>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                {legalMetric.score}/100
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-500">{legalMetric.score}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${legalMetric.score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ValuationBreakdownSection;
