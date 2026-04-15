import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Patent } from '../types';

type ExaminationDetailsSectionProps = {
  patent: Patent;
};

const hasText = (value?: string | null) => Boolean(value && value.trim() && value.trim() !== '-');

const patentTypeClasses = (patentType: string) => {
  if (/design/i.test(patentType)) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (/plant/i.test(patentType)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-teal-200 bg-teal-50 text-teal-700';
};

const entityTypeClasses = (entityType: string) => {
  if (/micro/i.test(entityType)) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (/small/i.test(entityType)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
};

const CodePill: React.FC<{ value: string }> = ({ value }) => (
  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 font-mono">
    [{value}]
  </span>
);

const ExaminationDetailsSection: React.FC<ExaminationDetailsSectionProps> = ({ patent }) => {
  const [expanded, setExpanded] = useState(false);

  const details = useMemo(() => {
    const trackOneCodes = patent.trackOneCodes.filter((code) => hasText(code));
    const nonPublicationCodes = patent.nonPublicationCodes.filter((code) => hasText(code));

    return {
      gau: hasText(patent.gau) ? patent.gau : 'Not assigned',
      gauDefinition: hasText(patent.gauDefinition)
        ? patent.gauDefinition
        : 'Definition not disclosed in the current record.',
      patentType: hasText(patent.patentType) ? patent.patentType : 'Utility',
      entityType: hasText(patent.entityType) ? patent.entityType : 'Regular',
      trackOneCodes,
      nonPublicationCodes,
    };
  }, [patent]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
      >
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">Examination Details</h3>
          <p className="text-sm text-slate-500">
            GAU {details.gau} - {details.patentType}
          </p>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-6 py-6 text-sm text-slate-600">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    GAU Code
                  </p>
                  <p className="font-mono text-base font-medium text-slate-900">{details.gau}</p>
                  <p className="max-w-2xl leading-6 text-slate-500">{details.gauDefinition}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Patent Type
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${patentTypeClasses(details.patentType)}`}
                  >
                    {details.patentType}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Entity Type
                  </p>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${entityTypeClasses(details.entityType)}`}
                  >
                    {details.entityType}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Track-One Codes
                  </p>
                  {details.trackOneCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.trackOneCodes.map((code) => (
                        <CodePill key={code} value={code} />
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      None
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Non-Publication Codes
                  </p>
                  {details.nonPublicationCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {details.nonPublicationCodes.map((code) => (
                        <CodePill key={code} value={code} />
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      None
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ExaminationDetailsSection;
