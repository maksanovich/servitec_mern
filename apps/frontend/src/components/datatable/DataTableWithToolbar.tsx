import { useMemo, useState, useEffect, useCallback } from 'react';
import type { TableColumn } from 'react-data-table-component';
import { DataTable } from './DataTable';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';

export interface DataTableFilterState {
  search: string;
  startDate: string;
  endDate: string;
  pageSize: number;
}

export interface DataTableWithToolbarProps<T> {
  /** Full dataset */
  data: T[];
  columns: TableColumn<T>[];
  /** Column ids to search in (uses column selector). If omitted, no search filter is applied. */
  searchFields?: (string | keyof T)[];
  searchPlaceholder?: string;
  /** Column id for date range filter (value must be parseable as date). If omitted, no date filter. */
  dateColumnId?: string | keyof T;
  pageSizeOptions?: number[];
  /** Right-side content (e.g. export buttons) */
  rightContent?: React.ReactNode;
  /** Called when filters or filtered data change. Use this to get current filtered data (e.g. for export). */
  onFilteredDataChange?: (filters: DataTableFilterState, filteredData: T[]) => void;
  noDataComponent?: React.ReactNode;
  /** Initial page size */
  defaultPageSize?: number;
  /** Initial date range (for date filter) */
  defaultStartDate?: string;
  defaultEndDate?: string;
  /** Enable expandable rows; pass expandableRowsComponent to render expanded content */
  expandableRows?: boolean;
  expandableRowsComponent?: React.ComponentType<{ data: T }>;
  expandableRowDisabled?: (row: T) => boolean;
  /** Icons for expand/collapse (e.g. Plus when collapsed, Minus when expanded) */
  expandableIcon?: { collapsed: React.ReactNode; expanded: React.ReactNode };
  /** Row click (e.g. open detail modal) */
  onRowClicked?: (row: T, e: React.MouseEvent) => void;
  pointerOnHover?: boolean;
  highlightOnHover?: boolean;
}

function getColumnId(col: TableColumn<unknown>): string | null {
  const raw = col.id ?? (col as { sortField?: string }).sortField;
  return raw != null ? String(raw) : null;
}

function filterBySearch<T>(data: T[], query: string, columns: TableColumn<T>[], searchFieldIds: (string | keyof T)[] | undefined): T[] {
  if (!query.trim() || !searchFieldIds?.length) return data;
  const q = query.toLowerCase();
  return data.filter((row) => {
    const rowObj = row as Record<string, unknown>;
    const parts: string[] = [];
    for (const sf of searchFieldIds) {
      const k = String(sf);
      const col = columns.find((c) => getColumnId(c as TableColumn<unknown>) === k);
      if (col && typeof col.selector === 'function') {
        parts.push(String((col.selector as (r: T) => unknown)(row) ?? '').toLowerCase());
      } else if (k in rowObj) {
        parts.push(String(rowObj[k] ?? '').toLowerCase());
      }
    }
    return parts.join(' ').includes(q);
  });
}

function filterByDateRange<T>(data: T[], startDate: string, endDate: string, dateColumnId: string | keyof T, columns: TableColumn<T>[]): T[] {
  if (!startDate && !endDate) return data;
  const col = columns.find((c) => getColumnId(c as TableColumn<unknown>) === String(dateColumnId));
  if (!col?.selector || typeof col.selector !== 'function') return data;
  const sel = col.selector as (r: T) => unknown;
  const start = startDate ? new Date(startDate).getTime() : -Infinity;
  const end = endDate ? new Date(endDate).getTime() : Infinity;
  return data.filter((row) => {
    const val = sel(row);
    const d = typeof val === 'string' || typeof val === 'number' ? new Date(val).getTime() : NaN;
    if (Number.isNaN(d)) return true;
    return d >= start && d <= end;
  });
}

export function DataTableWithToolbar<T>({
  data,
  columns,
  searchFields,
  searchPlaceholder = 'Search...',
  dateColumnId,
  pageSizeOptions = [10, 25, 50, 100],
  rightContent,
  onFilteredDataChange,
  noDataComponent,
  defaultPageSize = 10,
  defaultStartDate = '',
  defaultEndDate = '',
  expandableRows,
  expandableRowsComponent,
  expandableRowDisabled,
  expandableIcon,
  onRowClicked,
  pointerOnHover,
  highlightOnHover,
}: DataTableWithToolbarProps<T>) {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filteredData = useMemo(() => {
    let out = filterBySearch(data, search, columns, searchFields);
    if (dateColumnId) {
      out = filterByDateRange(out, startDate, endDate, dateColumnId, columns);
    }
    return out;
  }, [data, search, startDate, endDate, dateColumnId, columns, searchFields]);

  const filters: DataTableFilterState = useMemo(
    () => ({ search, startDate, endDate, pageSize }),
    [search, startDate, endDate, pageSize]
  );

  const notifyFiltered = useCallback(() => {
    onFilteredDataChange?.(filters, filteredData);
  }, [onFilteredDataChange, filters, filteredData]);

  useEffect(() => {
    notifyFiltered();
  }, [notifyFiltered]);

  const showSearch = searchFields != null && searchFields.length > 0;
  const showDateRange = dateColumnId != null;

  return (
    <>
      <DataTableToolbar
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        pageSizeOptions={pageSizeOptions}
        startDate={showDateRange ? startDate : undefined}
        endDate={showDateRange ? endDate : undefined}
        onDateRangeChange={showDateRange ? (s, e) => { setStartDate(s); setEndDate(e); } : undefined}
        searchValue={showSearch ? search : undefined}
        onSearchChange={showSearch ? setSearch : undefined}
        searchPlaceholder={searchPlaceholder}
        rightContent={rightContent}
      />
      <div className="pb-5 w-full min-w-0 overflow-x-auto">
        <DataTable<T>
          key={pageSize}
          className="w-full max-w-full"
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={pageSize}
          paginationRowsPerPageOptions={pageSizeOptions}
          paginationComponent={DataTablePagination}
          onRowClicked={onRowClicked}
          pointerOnHover={pointerOnHover}
          highlightOnHover={highlightOnHover}
          noDataComponent={noDataComponent ?? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              No data available in this table.
            </div>
          )}
          expandableRows={expandableRows}
          expandableRowsComponent={expandableRowsComponent}
          expandableRowDisabled={expandableRowDisabled}
          expandableIcon={expandableIcon}
        />
      </div>
    </>
  );
}
