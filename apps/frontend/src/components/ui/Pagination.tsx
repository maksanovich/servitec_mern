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
        Registros {recordsFrom} a {recordsTo} de {totalRecords}
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrevious}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
