import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords?: number;
  recordsFrom?: number;
  recordsTo?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function Pagination({
  page,
  totalPages,
  totalRecords = 0,
  recordsFrom = 0,
  recordsTo = 0,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
      <span>
        Showing records {recordsFrom} to {recordsTo} out of {totalRecords} records
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
