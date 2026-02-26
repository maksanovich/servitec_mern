import { forwardRef, ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'emerald' | 'red' | 'amber' | 'orange';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/50',
  secondary:
    'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 focus:ring-slate-400/50',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 focus:ring-slate-400/50',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/50',
  red: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/50',
  orange: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3 py-2 text-sm gap-2',
  lg: 'px-4 py-2.5 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      isLoading,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-800
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {LeftIcon && <LeftIcon className="w-4 h-4 flex-shrink-0" />}
            {children}
            {RightIcon && <RightIcon className="w-4 h-4 flex-shrink-0" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export function ButtonGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}
