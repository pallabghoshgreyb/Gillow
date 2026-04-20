import React, { useMemo } from 'react';
import { Patent } from '../types';
import { isKnownNumber } from '../utils/patentDisplay';

type RiskAssessmentSectionProps = {
  patent: Patent;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getRiskTone = (score: number) => {
  if (score > 66) {
    return {
      label: 'High',
      fill: 'bg-red-500',
      text: 'text-red-600',
    };
  }

  if (score >= 33) {
    return {
      label: 'Medium',
      fill: 'bg-amber-500',
      text: 'text-amber-600',
    };
  }

  return {
    label: 'Low',
    fill: 'bg-emerald-500',
    text: 'text-emerald-600',
  };
};

const getFtoBadge = (ftoStatus: Patent['ftoStatus']) => {
  if (ftoStatus === 'Clear') {
    return {
      label: 'Clear',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    };
  }

  if (ftoStatus === 'Blocked') {
    return {
      label: 'Blocked',
      className: 'border-red-200 bg-red-50 text-red-700',
      dot: 'bg-red-500',
    };
  }

  if (ftoStatus === 'Caution') {
    return {
      label: 'Caution',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    };
  }

  return {
    label: 'Unknown',
    className: 'border-slate-200 bg-slate-50 text-slate-500',
    dot: 'bg-slate-400',
  };
};

const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({ patent }) => {
  const riskData = useMemo(() => {
    const score = isKnownNumber(patent.infringementRiskScore)
      ? clamp(patent.infringementRiskScore, 0, 100)
      : null;
    const tone = score !== null ? getRiskTone(score) : null;
    const ftoBadge = patent.ftoStatus !== 'Unknown' ? getFtoBadge(patent.ftoStatus) : null;
    const iprValue = patent.iprPgr.length > 0 ? patent.iprPgr.join(', ') : '';

    return {
      score,
      tone,
      ftoBadge,
      iprValue,
      showSignals: Boolean(ftoBadge || iprValue || patent.flags.litigation),
    };
  }, [patent]);

  if (riskData.score === null && !riskData.showSignals) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Risk Assessment
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        {riskData.score !== null && riskData.tone && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900">Infringement Risk</p>
            <div className="flex items-center gap-4">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${riskData.tone.fill}`}
                  style={{ width: `${riskData.score}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={riskData.score}
                  aria-label="Infringement risk score"
                />
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {riskData.score}/100
              </span>
            </div>
            <p className={`text-sm font-medium ${riskData.tone.text}`}>{riskData.tone.label}</p>
          </div>
        )}

        {riskData.showSignals && (
          <div className={riskData.score !== null ? 'border-t border-slate-100 pt-6' : ''}>
            <div className="space-y-4">
            {riskData.ftoBadge && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">FTO Status</p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${riskData.ftoBadge.className}`}
                >
                  <span className={`h-2 w-2 rounded-full ${riskData.ftoBadge.dot}`} />
                  {riskData.ftoBadge.label}
                </span>
              </div>
            )}

            {riskData.iprValue && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">IPR/PGR</p>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500">
                  {riskData.iprValue}
                </span>
              </div>
            )}

            {patent.flags.litigation && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">Litigation</p>
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  History present
                </span>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RiskAssessmentSection;
