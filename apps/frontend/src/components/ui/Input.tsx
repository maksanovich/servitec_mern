import { forwardRef, InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon: LeftIcon, rightIcon: RightIcon, error, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {LeftIcon && (
          <LeftIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm
            bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200
            placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-10' : ''}
            ${RightIcon ? 'pr-10' : ''}
            ${error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}
            ${className}
          `}
          {...props}
        />
        {RightIcon && (
          <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
