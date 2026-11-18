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
    'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  resolved:
    'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  admin:
    'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100',
  offline:
    'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  open:
    'bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  maintenance:
    'bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  acknowledged:
    'bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  viewer:
    'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  neutral:
    'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
};

const dotColors: Record<BadgeKind, string> = {
  online: 'bg-emerald-600 dark:bg-emerald-400',
  resolved: 'bg-emerald-600 dark:bg-emerald-400',
  admin: 'bg-current',
  offline: 'bg-red-600 dark:bg-red-400',
  open: 'bg-red-600 dark:bg-red-400',
  maintenance: 'bg-amber-600 dark:bg-amber-400',
  acknowledged: 'bg-amber-600 dark:bg-amber-400',
  viewer: 'bg-zinc-500 dark:bg-zinc-400',
  neutral: 'bg-zinc-500 dark:bg-zinc-400',
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
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${badgeStyles[status]} ${className}`}
    >
      {withDot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
