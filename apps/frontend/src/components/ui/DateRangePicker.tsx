import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DatePicker } from './DatePicker';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange?: (start: string, end: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = `${startDate}, ${endDate}`;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="
          flex items-center gap-2 w-full min-w-[200px] px-3 py-2 rounded-lg border
          bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600
          text-slate-700 dark:text-slate-300 text-sm
          hover:border-slate-300 dark:hover:border-slate-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          transition-colors
        "
      >
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{displayValue}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-1 z-50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg min-w-[280px]">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Start date
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(e) => onChange?.(e.target.value, endDate)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  End date
                </label>
                <DatePicker
                  value={endDate}
                  onChange={(e) => onChange?.(startDate, e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
