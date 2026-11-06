import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 hover:shadow-red-600/35',
  outline: 'border border-navy-200 bg-white text-navy-900 hover:border-navy-400 hover:bg-navy-50',
  ghost: 'border border-white/20 bg-white/5 text-white hover:bg-white/10',
};

export function buttonStyles(variant: ButtonVariant = 'primary', className = ''): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold',
    'transition duration-200 hover:-translate-y-0.5 active:translate-y-0',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
    VARIANTS[variant],
    className,
  ].join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({ variant, className, ...props }: ButtonProps) {
  return <button className={buttonStyles(variant, className)} {...props} />;
}
