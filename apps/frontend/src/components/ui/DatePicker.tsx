import { forwardRef, InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Display format for the label when value is set */
  label?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className = '', label, ...props }, ref) => {
    return (
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
        <input
          ref={ref}
          type="date"
          lang="es"
          className={`
            w-full min-w-[140px] pl-10 pr-3 py-2 rounded-lg border
            bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-200
            border-slate-200 dark:border-slate-600 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            transition-colors
            [color-scheme:light]
            dark:[color-scheme:dark]
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
