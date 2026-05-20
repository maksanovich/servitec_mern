import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { SelectOption } from './Select';

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  onQueryChange?: (query: string) => void;
  filterOptions?: boolean;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  emptyText?: string;
  /** When true, user can confirm a value typed in the search box that is not in `options`. */
  allowCustomValue?: boolean;
  customValueLabel?: (query: string) => string;
  /** Called after the user confirms a custom (non-listed) value. */
  onCustomValueSelect?: (value: string) => void;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = '-- Seleccionar --',
  searchPlaceholder = 'Buscar…',
  onQueryChange,
  filterOptions = true,
  disabled,
  className = '',
  buttonClassName = '',
  emptyText = 'Sin resultados',
  allowCustomValue = false,
  customValueLabel,
  onCustomValueSelect,
}: SearchableSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    if (!filterOptions) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = `${o.label} ${o.value} ${o.searchText ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [filterOptions, options, query]);

  const customQuery = query.trim();
  const showCustomRow =
    allowCustomValue &&
    customQuery.length > 0 &&
    !options.some((o) => o.value.trim().toLowerCase() === customQuery.toLowerCase());

  const confirmCustomValue = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    onValueChange(next);
    onCustomValueSelect?.(next);
    setOpen(false);
    setQuery('');
  };

  const displayLabel = selected?.label ?? (value.trim() ? value.trim() : null);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    onQueryChange?.(query);
  }, [open, onQueryChange, query]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return;
      const el = wrapperRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
          bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200
          text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          w-full flex items-center justify-between gap-2
          ${buttonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${displayLabel ? '' : 'text-slate-500 dark:text-slate-400'}`}>
          {displayLabel ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="
            absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 shadow-lg
          "
        >
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && showCustomRow) {
                    e.preventDefault();
                    confirmCustomValue(customQuery);
                  }
                }}
                placeholder={searchPlaceholder}
                className="
                  w-full pl-10 pr-3 py-2 rounded-md border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-900/30 text-slate-900 dark:text-slate-200
                  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40
                "
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto py-1">
            {showCustomRow && (
              <button
                type="button"
                role="option"
                onClick={() => confirmCustomValue(customQuery)}
                className="
                  w-full text-left px-3 py-2 text-sm font-medium
                  text-emerald-700 dark:text-emerald-300
                  hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                  border-b border-slate-100 dark:border-slate-700/80
                "
              >
                {customValueLabel ? customValueLabel(customQuery) : `Usar «${customQuery}»`}
              </button>
            )}
            {filtered.length === 0 && !showCustomRow ? (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{emptyText}</div>
            ) : (
              filtered.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2 text-sm
                      ${active ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}
                      hover:bg-slate-50 dark:hover:bg-slate-700/40
                    `}
                  >
                    <div className="truncate">{opt.label}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
