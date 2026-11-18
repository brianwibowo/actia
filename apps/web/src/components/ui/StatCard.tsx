import type { ReactNode } from 'react';

type StatTone = 'neutral' | 'ok' | 'warn' | 'danger';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: ReactNode;
  tone?: StatTone;
  progressPct?: number | null;
}

const iconTones: Record<StatTone, string> = {
  neutral:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  warn: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  danger:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
};

const valueTones: Record<StatTone, string> = {
  neutral: 'text-slate-900 dark:text-slate-100',
  ok: 'text-slate-900 dark:text-slate-100',
  warn: 'text-amber-800 dark:text-amber-300',
  danger: 'text-red-700 dark:text-red-300',
};

const barTones: Record<StatTone, string> = {
  neutral: 'bg-slate-600 dark:bg-slate-400',
  ok: 'bg-emerald-600 dark:bg-emerald-400',
  warn: 'bg-amber-600 dark:bg-amber-400',
  danger: 'bg-red-600 dark:bg-red-400',
};

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = 'neutral',
  progressPct,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-[#11171d] dark:shadow-card-dark flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
          {label}
        </span>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconTones[tone]}`}
        >
          {icon}
        </span>
      </div>

      <div>
        <div className={`mono text-3xl font-bold tracking-tight ${valueTones[tone]}`}>{value}</div>
        {typeof progressPct === 'number' && Number.isFinite(progressPct) && (
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${barTones[tone]}`}
              style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
            />
          </div>
        )}
      </div>

      {sublabel && (
        <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{sublabel}</div>
      )}
    </div>
  );
}
