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

export function StatCard({
  label,
  value,
  sublabel,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-card dark:border-zinc-800 dark:bg-[#0c0c0f] dark:shadow-card-dark">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
      </div>
      <div>
        <div className="mono text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {value}
        </div>
        {sublabel && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
