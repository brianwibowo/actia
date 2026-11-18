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
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-900 dark:text-zinc-200">
        {label}
      </label>
      {children}
    </div>
  );
}

const baseFieldClass =
  'w-full min-h-[38px] rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 transition-colors focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-zinc-300';

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
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
        aria-hidden="true"
      />
      <input
        type="search"
        className={`${baseFieldClass} pl-9`}
        {...props}
      />
    </div>
  );
}
