import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

type OwnershipSectionProps = {
  currentAssignees?: string[] | string | null;
  originalAssignees?: string[] | string | null;
  inventors?: string[] | string | null;
  applicants?: string[] | string | null;
};

const parseList = (value?: string[] | string | null) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

const CopyButton = ({
  label,
  value,
  copiedKey,
  isCopied,
  onCopied,
}: {
  label: string;
  value: string;
  copiedKey: string;
  isCopied: boolean;
  onCopied: (key: string) => void;
}) => (
  <button
    type="button"
    onClick={() => {
      if (!value) return;
      void copyText(value).then(() => onCopied(copiedKey));
    }}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-teal-200 hover:text-teal-700 ${FOCUS_RING}`}
    aria-label={label}
    title={label}
  >
    {isCopied ? <Check size={15} /> : <Copy size={15} />}
  </button>
);

const InventorChip: React.FC<{ name: string }> = ({ name }) => (
  <motion.div
    whileHover={{ y: -1 }}
    className="group relative inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm"
    title={name}
    tabIndex={0}
  >
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
      {initialsFor(name)}
    </span>
    <span className="max-w-[160px] truncate text-sm font-medium text-slate-600">{name}</span>
    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
      {name}
    </span>
  </motion.div>
);

const OwnershipSection: React.FC<OwnershipSectionProps> = ({
  currentAssignees,
  originalAssignees,
  inventors,
  applicants,
}) => {
  const [showAllInventors, setShowAllInventors] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const currentList = useMemo(() => parseList(currentAssignees), [currentAssignees]);
  const originalList = useMemo(() => parseList(originalAssignees), [originalAssignees]);
  const inventorList = useMemo(() => parseList(inventors), [inventors]);
  const applicantList = useMemo(() => parseList(applicants), [applicants]);

  useEffect(() => {
    if (!copiedField) return;
    const timer = window.setTimeout(() => setCopiedField(''), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedField]);

  const primaryCurrent =
    currentList[0] || originalList[0] || applicantList[0] || 'Ownership not disclosed';
  const primaryOriginal = originalList[0] || 'Not disclosed';
  const applicantText = applicantList.length > 0 ? applicantList.join(', ') : 'Not disclosed';
  const visibleInventors = inventorList.slice(0, 3);
  const extraInventors = inventorList.slice(3);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Ownership
        </h3>
      </div>

      <div className="space-y-6 pt-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Current Assignee
          </p>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-medium text-slate-900">{primaryCurrent}</p>
              {currentList.length > 1 && (
                <p className="mt-1 text-sm text-slate-400">
                  +{currentList.length - 1} additional assignee
                  {currentList.length > 2 ? 's' : ''}
                </p>
              )}
            </div>
            <CopyButton
              label="Copy current assignee"
              value={primaryCurrent}
              copiedKey="current"
              isCopied={copiedField === 'current'}
              onCopied={setCopiedField}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Original Assignee
          </p>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 text-sm leading-6 text-slate-600">{primaryOriginal}</p>
            <CopyButton
              label="Copy original assignee"
              value={primaryOriginal}
              copiedKey="original"
              isCopied={copiedField === 'original'}
              onCopied={setCopiedField}
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Inventors
          </p>
          {inventorList.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3">
                {visibleInventors.map((inventor) => (
                  <InventorChip key={inventor} name={inventor} />
                ))}
              </div>

              <AnimatePresence initial={false}>
                {showAllInventors && extraInventors.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-3 pt-3">
                      {extraInventors.map((inventor) => (
                        <InventorChip key={inventor} name={inventor} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {extraInventors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllInventors((value) => !value)}
                  className={`text-sm font-medium text-slate-500 transition hover:text-teal-700 ${FOCUS_RING}`}
                >
                  {showAllInventors
                    ? 'Show fewer inventors'
                    : `Show all inventors (+${extraInventors.length} more)`}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Inventor list not disclosed.</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Applicants
          </p>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 text-sm leading-6 text-slate-600">{applicantText}</p>
            <CopyButton
              label="Copy applicants"
              value={applicantText}
              copiedKey="applicants"
              isCopied={copiedField === 'applicants'}
              onCopied={setCopiedField}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnershipSection;
