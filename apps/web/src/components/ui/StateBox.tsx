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
      ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30'
      : tone === 'success'
        ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-[#11171d]';

  const icon =
    tone === 'loading' ? (
      <Loader2 size={20} className="animate-spin text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
    ) : tone === 'error' ? (
      <AlertCircle size={20} className="text-red-700 dark:text-red-300" aria-hidden="true" />
    ) : (
      <Inbox size={20} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
    );

  return (
    <div
      role={role}
      className={`rounded-2xl border p-6 shadow-card dark:shadow-card-dark ${toneBorder}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          {title && (
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
          )}
          <p
            className={`text-sm ${title ? 'mt-1' : ''} ${
              tone === 'error'
                ? 'text-red-800 dark:text-red-200'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {description}
          </p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
