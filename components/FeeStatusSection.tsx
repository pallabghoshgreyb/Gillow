import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Patent } from '../types';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

type FeeRow = {
  label: string;
  dueDate: Date | null;
  shortDate: string;
  exactDate: string;
  statusLabel: 'Not Due' | 'Due Soon' | 'Overdue';
  tone: 'notDue' | 'dueSoon' | 'overdue';
};

type FeeBaseRow = {
  label: string;
  key: 'year3_5' | 'year7_5' | 'year11_5';
  dueDate: Date | null;
};

type FeeStatusSectionProps = {
  patent: Patent;
};

const formatShortDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unavailable';

const formatExactDate = (date: Date | null) =>
  date
    ? date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Exact due date unavailable';

const addYears = (date: Date, years: number) =>
  new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);

const getDueDates = (filingDate: string) => {
  const filedAt = new Date(filingDate);
  if (Number.isNaN(filedAt.getTime())) {
    return {
      year3_5: null,
      year7_5: null,
      year11_5: null,
    };
  }

  return {
    year3_5: addYears(filedAt, 3.5),
    year7_5: addYears(filedAt, 7.5),
    year11_5: addYears(filedAt, 11.5),
  };
};

const getBaseStatuses = (patent: Patent) => {
  const { maintenanceFees } = patent;
  const dueDates = getDueDates(patent.filingDate);
  const now = new Date();

  let year3_5: 'paid' | 'pending' | 'overdue' = 'pending';
  let year7_5: 'paid' | 'pending' | 'overdue' = 'pending';
  let year11_5: 'paid' | 'pending' | 'overdue' = 'pending';

  if (maintenanceFees.totalPending === 0) {
    year3_5 = 'paid';
    year7_5 = 'paid';
    year11_5 = 'paid';
  } else if (maintenanceFees.totalPending <= maintenanceFees.year11_5) {
    year3_5 = 'paid';
    year7_5 = 'paid';
    year11_5 =
      dueDates.year11_5 && now > dueDates.year11_5 ? 'overdue' : 'pending';
  } else if (
    maintenanceFees.totalPending <=
    maintenanceFees.year7_5 + maintenanceFees.year11_5
  ) {
    year3_5 = 'paid';
    year7_5 = dueDates.year7_5 && now > dueDates.year7_5 ? 'overdue' : 'pending';
    year11_5 = 'pending';
  } else {
    year3_5 = dueDates.year3_5 && now > dueDates.year3_5 ? 'overdue' : 'pending';
    year7_5 = 'pending';
    year11_5 = 'pending';
  }

  return {
    dueDates,
    base: { year3_5, year7_5, year11_5 },
  };
};

const mapDisplayStatus = (
  baseStatus: 'paid' | 'pending' | 'overdue',
  dueDate: Date | null,
) => {
  if (baseStatus === 'overdue') {
    return { statusLabel: 'Overdue' as const, tone: 'overdue' as const };
  }

  if (baseStatus === 'pending' && dueDate) {
    const now = new Date();
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (dueDate >= now && dueDate <= sixMonthsFromNow) {
      return { statusLabel: 'Due Soon' as const, tone: 'dueSoon' as const };
    }
  }

  return { statusLabel: 'Not Due' as const, tone: 'notDue' as const };
};

const toneClasses = (tone: FeeRow['tone']) => {
  if (tone === 'overdue') {
    return {
      dot: 'bg-red-500',
      text: 'text-red-600',
      row: 'hover:border-red-200 hover:bg-red-50/40',
    };
  }

  if (tone === 'dueSoon') {
    return {
      dot: 'bg-amber-500',
      text: 'text-amber-600',
      row: 'hover:border-amber-200 hover:bg-amber-50/40',
    };
  }

  return {
    dot: 'bg-emerald-500',
    text: 'text-slate-600',
    row: 'hover:border-slate-200 hover:bg-slate-50',
  };
};

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US')}`;

const FeeStatusSection: React.FC<FeeStatusSectionProps> = ({ patent }) => {
  const feeData = useMemo(() => {
    const { dueDates, base } = getBaseStatuses(patent);

    const baseRows: FeeBaseRow[] = [
      { label: '3.5 Year', dueDate: dueDates.year3_5, key: 'year3_5' },
      { label: '7.5 Year', dueDate: dueDates.year7_5, key: 'year7_5' },
      { label: '11.5 Year', dueDate: dueDates.year11_5, key: 'year11_5' },
    ];

    const rows: FeeRow[] = baseRows.map((row) => {
      const display = mapDisplayStatus(base[row.key], row.dueDate);
      return {
        label: row.label,
        dueDate: row.dueDate,
        shortDate: formatShortDate(row.dueDate),
        exactDate: formatExactDate(row.dueDate),
        statusLabel: display.statusLabel,
        tone: display.tone,
      };
    });

    return {
      rows,
      totalPending: patent.maintenanceFees.totalPending,
      overdueCount: rows.filter((row) => row.tone === 'overdue').length,
    };
  }, [patent]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Maintenance Fees
        </h3>
      </div>

      {feeData.overdueCount > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Action required</p>
            <p className="mt-1 text-red-600">
              {feeData.overdueCount} maintenance fee
              {feeData.overdueCount > 1 ? 's are' : ' is'} overdue.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {feeData.rows.map((row) => {
          const styles = toneClasses(row.tone);
          return (
            <div
              key={row.label}
              className={`
                group relative rounded-lg border border-transparent px-3 py-3 transition
                ${styles.row} ${FOCUS_RING}
              `}
              title={`Exact due date: ${row.exactDate}`}
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{row.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{row.shortDate}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                    <span className={`text-sm font-medium ${styles.text}`}>
                      {row.statusLabel}
                    </span>
                    {row.tone === 'overdue' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-3 top-full z-10 mt-2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Exact due date: {row.exactDate}
              </div>
            </div>
          );
        })}
      </div>

      {feeData.totalPending > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-amber-600">
            Total Pending: {formatCurrency(feeData.totalPending)}
          </p>
        </div>
      )}
    </section>
  );
};

export default FeeStatusSection;
