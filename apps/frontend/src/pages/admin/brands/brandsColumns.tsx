import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Brand } from './types';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

function onEdit(brand: Brand) {
  console.log('Edit brand', brand);
}

function onDelete(brand: Brand) {
  console.log('Delete brand', brand);
}

function ActionDropdown({ brand }: { brand: Brand }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={actionBtnClass}
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
          role="menu"
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              onEdit(brand);
              setOpen(false);
            }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              onDelete(brand);
              setOpen(false);
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

const stateVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

const stateLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export const brandsColumns: TableColumn<Brand>[] = [
  {
    id: 'name',
    name: 'Brand',
    selector: (row) => row.name,
    sortable: true,
    minWidth: '200px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
    ),
  },
  {
    id: 'state',
    name: 'State',
    selector: (row) => row.state,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <Badge variant={stateVariant[row.state]}>{stateLabel[row.state]}</Badge>
    ),
  },
  {
    id: 'action',
    name: 'Action',
    sortable: false,
    width: '80px',
    cell: (row) => <ActionDropdown brand={row} />,
  },
];
