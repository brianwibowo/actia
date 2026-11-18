import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-card dark:border-zinc-800 dark:bg-[#0c0c0f] dark:text-zinc-50 dark:shadow-card-dark ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-3 ${className}`}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-semibold leading-none tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-6 pt-2 ${className}`}>{children}</div>;
}
