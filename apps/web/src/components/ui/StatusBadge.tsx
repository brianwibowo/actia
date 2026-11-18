type BadgeKind =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'open'
  | 'acknowledged'
  | 'resolved'
  | 'admin'
  | 'viewer'
  | 'neutral';

const badgeStyles: Record<BadgeKind, string> = {
  online:
    'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
  resolved:
    'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
  admin:
    'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
  offline:
    'bg-red-50 text-red-800 border-red-200/80 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
  open:
    'bg-red-50 text-red-800 border-red-200/80 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
  maintenance:
    'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
  acknowledged:
    'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
  viewer:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  neutral:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const dotColors: Record<BadgeKind, string> = {
  online: 'bg-emerald-600 dark:bg-emerald-400',
  resolved: 'bg-emerald-600 dark:bg-emerald-400',
  admin: 'bg-emerald-600 dark:bg-emerald-400',
  offline: 'bg-red-600 dark:bg-red-400',
  open: 'bg-red-600 dark:bg-red-400',
  maintenance: 'bg-amber-600 dark:bg-amber-400',
  acknowledged: 'bg-amber-600 dark:bg-amber-400',
  viewer: 'bg-slate-500 dark:bg-slate-400',
  neutral: 'bg-slate-500 dark:bg-slate-400',
};

export function StatusBadge({
  status,
  label,
  withDot = true,
  className = '',
}: {
  status: BadgeKind;
  label: string;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badgeStyles[status]} ${className}`}
    >
      {withDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
