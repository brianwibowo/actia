import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export function StateBox({
  tone = 'neutral',
  title,
  description,
  action,
  role,
}: {
  tone?: 'neutral' | 'loading' | 'error' | 'success';
  title?: string;
  description: string;
  action?: ReactNode;
  role?: 'status' | 'alert';
}) {
  const toneBorder =
    tone === 'error'
      ? 'border-red-300 bg-red-50/50 dark:border-red-900/70 dark:bg-red-950/25'
      : tone === 'success'
        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/70 dark:bg-emerald-950/25'
        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0c0c0f]';

  const icon =
    tone === 'loading' ? (
      <Loader2 size={18} className="animate-spin text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
    ) : tone === 'error' ? (
      <AlertCircle size={18} className="text-red-600 dark:text-red-400" aria-hidden="true" />
    ) : (
      <Inbox size={18} className="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
    );

  return (
    <div
      role={role}
      className={`rounded-xl border p-5 shadow-card dark:shadow-card-dark ${toneBorder}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</p>
          )}
          <p
            className={`text-xs leading-relaxed ${title ? 'mt-1' : ''} ${
              tone === 'error'
                ? 'text-red-700 dark:text-red-300'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {description}
          </p>
          {action && <div className="mt-3.5">{action}</div>}
        </div>
      </div>
    </div>
  );
}
