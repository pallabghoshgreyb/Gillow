import React, { useMemo } from 'react';
import { Patent } from '../types';

type ContinuitySectionProps = {
  patent: Patent;
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

const normalizeRelation = (value: string) => value.trim().toUpperCase();

const relationClasses = (relation: string) => {
  if (relation.startsWith('CIP')) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (relation.startsWith('CON')) return 'border-teal-200 bg-teal-50 text-teal-700';
  if (relation.startsWith('DIV')) return 'border-slate-200 bg-slate-50 text-slate-700';
  if (relation.startsWith('PRO')) return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const RelationPill: React.FC<{ value: string }> = ({ value }) => (
  <span
    className={`inline-flex rounded-md border px-3 py-1 text-xs font-medium font-mono ${relationClasses(value)}`}
  >
    {value}
  </span>
);

const FlowNode = ({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) => (
  <span
    className={`inline-flex rounded-md border px-3 py-1.5 text-sm font-medium ${
      active
        ? 'border-teal-200 bg-teal-50 text-teal-700'
        : 'border-slate-200 bg-white text-slate-700'
    }`}
  >
    {label}
  </span>
);

const ContinuitySection: React.FC<ContinuitySectionProps> = ({ patent }) => {
  const relations = useMemo(
    () => patent.cipConDiv.map(normalizeRelation).filter((value) => hasText(value)),
    [patent.cipConDiv],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Continuity
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Application Family Tree
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FlowNode label="Parent App" />
            {relations.map((relation, index) => (
              <React.Fragment key={`${relation}-${index}`}>
                <span className="text-sm text-slate-300">→</span>
                <RelationPill value={relation} />
              </React.Fragment>
            ))}
            <span className="text-sm text-slate-300">→</span>
            <FlowNode label="This Patent" active />
          </div>
          {relations.length === 0 && (
            <p className="text-sm text-slate-500">
              No continuation relationships are disclosed in the current record.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              CIP/CON/DIV
            </p>
            {relations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {relations.map((relation, index) => (
                  <RelationPill key={`${relation}-row-${index}`} value={relation} />
                ))}
              </div>
            ) : (
              <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                None
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContinuitySection;
