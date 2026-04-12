import { DateRangePicker, Input } from '../ui';

/** Format date string for toolbar/pagination display (e.g. "20 Feb 2026"). Exported for custom pagination. */
export function formatDateLabel(d: string) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface DataTableToolbarProps {
  /** Rows per page */
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];

  /** Date range filter */
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;

  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Right-side content (e.g. date range label + export buttons). Rendered in ml-auto. */
  rightContent?: React.ReactNode;

  /** Optional class for the toolbar wrapper */
  className?: string;
}

const DEFAULT_PAGE_OPTIONS = [10, 25, 50, 100];

export function DataTableToolbar({
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_OPTIONS,
  startDate,
  endDate,
  onDateRangeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  rightContent,
  className = '',
}: DataTableToolbarProps) {
  const showRows = pageSize != null && onPageSizeChange != null;
  const showDateRange = startDate != null && endDate != null && onDateRangeChange != null;
  const showSearch = onSearchChange != null;
  const dateRangeLabel =
    showDateRange && startDate != null && endDate != null
      ? [formatDateLabel(startDate), formatDateLabel(endDate)].filter(Boolean).join(' – ') || '—'
      : '';

  const hasLeft = showRows || showDateRange || showSearch;
  const hasRight = rightContent != null || dateRangeLabel;

  if (!hasLeft && !hasRight) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-4 px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-3">
        {showRows && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Filas</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      {(showSearch || dateRangeLabel || rightContent) && (
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {showSearch && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Buscar</span>
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-44 min-w-0"
              />
            </div>
          )}
          {showDateRange && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Rango de fechas</span>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={onDateRangeChange}
              />
            </div>
          )}
          {rightContent}
        </div>
      )}
    </div>
  );
}
