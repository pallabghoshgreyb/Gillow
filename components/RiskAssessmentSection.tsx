import React, { useMemo } from 'react';
import { Patent } from '../types';

type RiskAssessmentSectionProps = {
  patent: Patent;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getRiskScore = (patent: Patent) => {
  if (patent.infringementRiskScore > 0) {
    return clamp(patent.infringementRiskScore, 0, 100);
  }

  if (patent.ftoStatus === 'Blocked') return 78;
  if (patent.ftoStatus === 'Caution') return 52;
  if (patent.flags.litigation) return 68;
  return 45;
};

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

  return {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  };
};

const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({ patent }) => {
  const riskData = useMemo(() => {
    const score = getRiskScore(patent);
    const tone = getRiskTone(score);
    const ftoBadge = getFtoBadge(patent.ftoStatus);
    const iprValue = patent.iprPgr.length > 0 ? patent.iprPgr.join(', ') : 'None';
    const litigationValue = patent.flags.litigation ? 'History present' : 'No history';

    return {
      score,
      tone,
      ftoBadge,
      iprValue,
      litigationValue,
      showIpr: patent.iprPgr.length > 0 || patent.iprPgr.length === 0,
      showLitigation: typeof patent.flags.litigation === 'boolean',
    };
  }, [patent]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Risk Assessment
        </h3>
      </div>

      <div className="space-y-6 pt-6">
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

        <div className="border-t border-slate-100 pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-900">FTO Status</p>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${riskData.ftoBadge.className}`}
              >
                <span className={`h-2 w-2 rounded-full ${riskData.ftoBadge.dot}`} />
                {riskData.ftoBadge.label}
              </span>
            </div>

            {riskData.showIpr && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">IPR/PGR</p>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500">
                  {riskData.iprValue}
                </span>
              </div>
            )}

            {riskData.showLitigation && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-900">Litigation</p>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                    patent.flags.litigation
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {riskData.litigationValue}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskAssessmentSection;
