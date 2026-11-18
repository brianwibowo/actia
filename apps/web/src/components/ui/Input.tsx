import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export function Field({
  label,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

const baseFieldClass =
  'w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-emerald-700 dark:border-slate-700 dark:bg-[#0e141a] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-emerald-400';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${baseFieldClass} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${baseFieldClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function SearchInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative min-w-[200px] flex-1 ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        className={`${baseFieldClass} pl-10`}
        {...props}
      />
    </div>
  );
}
