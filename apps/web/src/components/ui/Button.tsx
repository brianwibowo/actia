import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-400 dark:hover:bg-emerald-300 shadow-sm',
  secondary:
    'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 dark:bg-[#161f27] dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 shadow-sm',
  ghost:
    'bg-transparent text-slate-700 border-transparent hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70',
  danger:
    'bg-white text-red-700 border-red-300 hover:bg-red-50 dark:bg-[#161f27] dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950/60',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-3.5 py-2 text-sm rounded-xl',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border font-semibold whitespace-nowrap transition-colors disabled:opacity-55 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
