import { forwardRef, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80';
    const variantStyles = variant === 'elevated' ? 'shadow-sm' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
}

export function CardHeader({ title, actions, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 ${className}`}
      {...props}
    >
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
