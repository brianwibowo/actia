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
    'bg-zinc-900 text-zinc-50 border-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-50 dark:hover:bg-zinc-200 shadow-sm',
  secondary:
    'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 shadow-sm',
  ghost:
    'bg-transparent text-zinc-700 border-transparent hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/80',
  danger:
    'bg-white text-red-700 border-red-200 hover:bg-red-50 dark:bg-zinc-950 dark:text-red-400 dark:border-red-900/70 dark:hover:bg-red-950/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs rounded-md',
  md: 'min-h-[40px] px-4 py-2 text-sm rounded-md',
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
      className={`inline-flex items-center justify-center gap-2 border font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
