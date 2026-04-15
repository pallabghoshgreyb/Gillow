import React, { useMemo } from 'react';
import { Patent } from '../types';
import { formatCompactCurrency } from '../utils/patentDisplay';

type ValuationBreakdownSectionProps = {
  patent: Patent;
  valuation: number;
};

type MetricCard = {
  label: string;
  score: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const computeMetrics = (patent: Patent): MetricCard[] => {
  const granted = /granted|issued|alive/i.test(
    `${patent.legalStatus || ''} ${patent.simpleLegalStatus || ''}`,
  );
  const territoryCount = Math.max(patent.familySize, patent.countries.length, 1);
  const strategic = clamp(
    patent.valuationMetrics.strategicValue ||
      Math.round(
      (granted ? 22 : 12) +
        Math.min(territoryCount, 6) * 6 +
        Math.min(patent.trackOneCodes.length, 3) * 4 +
        (patent.currentAssignees.length > 0 ? 6 : 0),
      ),
    20,
    100,
  );
  const market = clamp(
    patent.valuationMetrics.marketValue ||
      patent.valuationMetrics.marketBreadth ||
      Math.round(Math.max(patent.marketGrowthRate, 10) * 3.2),
    18,
    100,
  );
  const technology = clamp(
    patent.valuationMetrics.technologyValue ||
      Math.round(
      ((patent.technologyReadinessLevel || 5) / 9) * 65 +
        Math.min(patent.independentClaimsCount * 6, 18),
      ),
    18,
    100,
  );
  const economic = clamp(
    patent.valuationMetrics.economicValue ||
      (patent.totalAddressableMarket > 0
      ? Math.round(
          Math.min(patent.totalAddressableMarket / 25_000_000, 70) +
            Math.max(patent.marketGrowthRate, 0),
        )
      : 33 + Math.min(territoryCount, 4) * 4),
    15,
    100,
  );
  const legal = clamp(
    patent.valuationMetrics.legalValue ||
      patent.valuationMetrics.enforcementStrength ||
      (granted ? 70 : 54),
    10,
    100,
  );

  return [
    { label: 'Strategic', score: strategic },
    { label: 'Market', score: market },
    { label: 'Technology', score: technology },
    { label: 'Economic', score: economic },
    { label: 'Legal', score: legal },
  ];
};

const MetricTile = ({ label, score }: MetricCard) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-700">{label}</p>
    <p className="mt-3 text-lg font-bold tabular-nums text-slate-900">{score}/100</p>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-teal-500" style={{ width: `${score}%` }} />
    </div>
    <p className="mt-3 text-sm text-slate-500">{score}%</p>
  </div>
);

const ValuationBreakdownSection: React.FC<ValuationBreakdownSectionProps> = ({
  patent,
  valuation,
}) => {
  const metrics = useMemo(() => computeMetrics(patent), [patent]);
  const legalMetric = metrics[4];
  const topMetrics = metrics.slice(0, 4);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Valuation Components
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          How the {formatCompactCurrency(valuation)} valuation is calculated
        </p>
      </div>

      <div className="space-y-4 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric) => (
            <MetricTile key={metric.label} {...metric} />
          ))}
        </div>

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
      </div>
    </section>
  );
};

export default ValuationBreakdownSection;
