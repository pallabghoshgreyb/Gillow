import React, { useMemo } from 'react';
import { AlertTriangle, BadgeCheck } from 'lucide-react';
import { Patent } from '../types';
import { calculateMaintenanceStatus, type MaintenanceLifecycleStatus } from '../utils/dataProcessor';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

type FeeRow = {
  label: string;
  amount: number;
  dueDate: Date | null;
  shortDate: string;
  exactDate: string;
  statusLabel: string;
  lifecycleStatus: MaintenanceLifecycleStatus;
  paymentWindowStartDate: Date | null;
  paymentWindowEndDate: Date | null;
  daysUntilDue: number | null;
  tone: 'good' | 'warning' | 'critical' | 'neutral';
};

type FeeStatusSectionProps = {
  patent: Patent;
};

const toneClasses = (tone: FeeRow['tone']) => {
  if (tone === 'critical') {
    return {
      dot: 'bg-red-500',
      text: 'text-red-600',
      row: 'hover:border-red-200 hover:bg-red-50/40',
    };
  }

  if (tone === 'warning') {
    return {
      dot: 'bg-amber-500',
      text: 'text-amber-600',
      row: 'hover:border-amber-200 hover:bg-amber-50/40',
    };
  }

  if (tone === 'good') {
    return {
      dot: 'bg-emerald-500',
      text: 'text-emerald-600',
      row: 'hover:border-emerald-200 hover:bg-emerald-50/40',
    };
  }

  return {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    row: 'hover:border-slate-200 hover:bg-slate-50',
  };
};

const formatCurrency = (value: number) => `$${value.toLocaleString('en-US')}`;

const formatDate = (value: string | null) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatExactDate = (value: string | null) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getTone = (status: MaintenanceLifecycleStatus): FeeRow['tone'] => {
  if (status === 'Current' || status === 'Paid') return 'good';
  if (status === 'Upcoming' || status === 'Payment Window Open') return 'warning';
  if (status === 'Due Soon' || status === 'Delinquent' || status === 'Lapsed') return 'critical';
  return 'neutral';
};

const getStatusLabel = (status: MaintenanceLifecycleStatus) => {
  if (status === 'Paid') return 'Paid';
  if (status === 'Current') return 'Current';
  if (status === 'Upcoming') return 'Upcoming';
  if (status === 'Payment Window Open') return 'Window Open';
  if (status === 'Due Soon') return 'Due Soon';
  if (status === 'Delinquent') return 'Delinquent';
  if (status === 'Lapsed') return 'Lapsed';
  return 'Not Applicable';
};

const FeeStatusSection: React.FC<FeeStatusSectionProps> = ({ patent }) => {
  const feeData = useMemo(() => {
    const maintenance = calculateMaintenanceStatus(patent);
    const rows: FeeRow[] = [
      {
        label: '3.5 Year',
        amount: maintenance.year_3_5.amount,
        dueDate: maintenance.year_3_5.dueDate ? new Date(`${maintenance.year_3_5.dueDate}T00:00:00Z`) : null,
        shortDate: formatDate(maintenance.year_3_5.dueDate),
        exactDate: formatExactDate(maintenance.year_3_5.dueDate),
        statusLabel: getStatusLabel(maintenance.year_3_5.lifecycleStatus),
        lifecycleStatus: maintenance.year_3_5.lifecycleStatus,
        paymentWindowStartDate: maintenance.year_3_5.paymentWindowStartDate
          ? new Date(`${maintenance.year_3_5.paymentWindowStartDate}T00:00:00Z`)
          : null,
        paymentWindowEndDate: maintenance.year_3_5.paymentWindowEndDate
          ? new Date(`${maintenance.year_3_5.paymentWindowEndDate}T00:00:00Z`)
          : null,
        daysUntilDue: maintenance.year_3_5.daysUntilDue,
        tone: getTone(maintenance.year_3_5.lifecycleStatus),
      },
      {
        label: '7.5 Year',
        amount: maintenance.year_7_5.amount,
        dueDate: maintenance.year_7_5.dueDate ? new Date(`${maintenance.year_7_5.dueDate}T00:00:00Z`) : null,
        shortDate: formatDate(maintenance.year_7_5.dueDate),
        exactDate: formatExactDate(maintenance.year_7_5.dueDate),
        statusLabel: getStatusLabel(maintenance.year_7_5.lifecycleStatus),
        lifecycleStatus: maintenance.year_7_5.lifecycleStatus,
        paymentWindowStartDate: maintenance.year_7_5.paymentWindowStartDate
          ? new Date(`${maintenance.year_7_5.paymentWindowStartDate}T00:00:00Z`)
          : null,
        paymentWindowEndDate: maintenance.year_7_5.paymentWindowEndDate
          ? new Date(`${maintenance.year_7_5.paymentWindowEndDate}T00:00:00Z`)
          : null,
        daysUntilDue: maintenance.year_7_5.daysUntilDue,
        tone: getTone(maintenance.year_7_5.lifecycleStatus),
      },
      {
        label: '11.5 Year',
        amount: maintenance.year_11_5.amount,
        dueDate: maintenance.year_11_5.dueDate ? new Date(`${maintenance.year_11_5.dueDate}T00:00:00Z`) : null,
        shortDate: formatDate(maintenance.year_11_5.dueDate),
        exactDate: formatExactDate(maintenance.year_11_5.dueDate),
        statusLabel: getStatusLabel(maintenance.year_11_5.lifecycleStatus),
        lifecycleStatus: maintenance.year_11_5.lifecycleStatus,
        paymentWindowStartDate: maintenance.year_11_5.paymentWindowStartDate
          ? new Date(`${maintenance.year_11_5.paymentWindowStartDate}T00:00:00Z`)
          : null,
        paymentWindowEndDate: maintenance.year_11_5.paymentWindowEndDate
          ? new Date(`${maintenance.year_11_5.paymentWindowEndDate}T00:00:00Z`)
          : null,
        daysUntilDue: maintenance.year_11_5.daysUntilDue,
        tone: getTone(maintenance.year_11_5.lifecycleStatus),
      },
    ];

    const alertRows = rows.filter((row) =>
      row.lifecycleStatus === 'Due Soon' ||
      row.lifecycleStatus === 'Payment Window Open' ||
      row.lifecycleStatus === 'Delinquent' ||
      row.lifecycleStatus === 'Lapsed'
    );
    const totalPendingDisplay = maintenance.isApplicable
      ? formatCurrency(maintenance.totalPending)
      : 'Not Applicable';

    return {
      maintenance,
      rows,
      alertRows,
      totalPendingDisplay,
    };
  }, [patent]);

  if (feeData.rows.length === 0 && !feeData.totalPendingDisplay) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">
          Maintenance Fees
        </h3>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{feeData.maintenance.overallStatus}</p>
          <p className="mt-1 text-sm text-slate-500">
            {feeData.maintenance.isApplicable
              ? `Anchored to ${feeData.maintenance.anchorDate || 'grant date unavailable'}`
              : 'Maintenance fees do not apply to application filings.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Next Event</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{feeData.maintenance.nextEventLabel}</p>
          <p className="mt-1 text-sm text-slate-500">
            {feeData.maintenance.nextEventDate ? formatDate(feeData.maintenance.nextEventDate) : 'No upcoming maintenance action'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Days Remaining</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {feeData.maintenance.daysUntilNextEvent !== null ? `${feeData.maintenance.daysUntilNextEvent} days` : 'N/A'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {feeData.maintenance.paymentWindowOpen ? 'Payment window is open' : 'Payment window not yet open'}
          </p>
        </div>
      </div>

      {!feeData.maintenance.isApplicable ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Maintenance fees are not applicable for this patent type, so the schedule is intentionally hidden.
        </div>
      ) : feeData.alertRows.length > 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Review maintenance status</p>
            <p className="mt-1 text-red-600">
              {feeData.alertRows
                .map((row) => `${row.label}: ${row.statusLabel}`)
                .join(' | ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <BadgeCheck size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Current maintenance status</p>
            <p className="mt-1 text-emerald-600">All scheduled maintenance milestones are in good standing.</p>
          </div>
        </div>
      )}

      {feeData.maintenance.isApplicable && (
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
              title={`Estimated due date: ${row.exactDate}`}
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{row.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{row.shortDate}</p>
                  {row.paymentWindowStartDate && row.paymentWindowEndDate && (
                    <p className="mt-1 text-xs text-slate-400">
                      Window: {formatDate(row.paymentWindowStartDate.toISOString().split('T')[0])} - {formatDate(row.paymentWindowEndDate.toISOString().split('T')[0])}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                    <span className={`text-sm font-medium ${styles.text}`}>
                      {row.statusLabel}
                    </span>
                    {row.tone === 'critical' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">
                        Action Required
                      </span>
                    )}
                  </div>
                  {row.daysUntilDue !== null && row.lifecycleStatus !== 'Paid' && row.lifecycleStatus !== 'Not Applicable' && (
                    <p className="mt-1 text-xs text-slate-400">{row.daysUntilDue} days to due</p>
                  )}
                </div>
              </div>

              <div className="pointer-events-none absolute right-3 top-full z-10 mt-2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
                Estimated due date: {row.exactDate}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {feeData.maintenance.isApplicable && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Pending Fees
            </p>
            <div className="grid gap-2 md:grid-cols-3">
              {feeData.rows.map((row) => {
                const styles = toneClasses(row.tone);
                return (
                  <div
                    key={`${row.label}-pending`}
                    className={`rounded-lg border px-4 py-3 ${
                      row.tone === 'critical'
                        ? 'border-red-200 bg-red-50/60'
                        : row.tone === 'warning'
                          ? 'border-amber-200 bg-amber-50/60'
                          : row.tone === 'good'
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{row.label}</p>
                    <p className={`mt-2 text-sm font-semibold ${styles.text}`}>
                      {formatCurrency(row.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default FeeStatusSection;

