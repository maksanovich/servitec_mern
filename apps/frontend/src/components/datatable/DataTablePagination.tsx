import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

export interface DataTablePaginationProps {
  rowCount: number;
  currentPage: number;
  rowsPerPage: number;
  onChangePage: (page: number, totalRows: number) => void;
  onChangeRowsPerPage?: (currentRowsPerPage: number, currentPage: number) => void;
}

const PAGES_TO_SHOW = 5;

export function DataTablePagination({
  rowCount,
  currentPage,
  rowsPerPage,
  onChangePage,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(rowCount / rowsPerPage));
  const start = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, rowCount);

  let pageStart = Math.max(1, currentPage - Math.floor(PAGES_TO_SHOW / 2));
  const pageEnd = Math.min(totalPages, pageStart + PAGES_TO_SHOW - 1);
  pageStart = Math.max(1, pageEnd - PAGES_TO_SHOW + 1);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full px-1 mt-4">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {start} to {end} of {rowCount} Entries
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChangePage(1, rowCount)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onChangePage(currentPage - 1, rowCount)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onChangePage(page, rowCount)}
            className={
              page === currentPage
                ? 'w-8 h-8 px-1.5 py-1.5 rounded bg-blue-600 text-white text-sm font-medium'
                : 'w-8 h-8 px-1.5 py-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm'
            }
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChangePage(currentPage + 1, rowCount)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onChangePage(totalPages, rowCount)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
