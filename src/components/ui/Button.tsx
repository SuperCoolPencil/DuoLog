import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'income' | 'expense' | 'ghost' | 'danger';
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  income:
    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50',
  expense:
    'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50',
  ghost:
    'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50',
  danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20',
};

export function Button({
  variant = 'ghost',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn-primary ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
