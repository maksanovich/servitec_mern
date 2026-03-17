import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Brand } from './types';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

export interface BrandColumnActions {
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

function ActionDropdown({
  brand,
  onEdit,
  onDelete,
}: { brand: Brand } & BrandColumnActions) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (open && buttonRef.current && !buttonRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleScrollOrResize() {
      setOpen(false);
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={actionBtnClass}
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
            style={{ top: position.top, left: position.left }}
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
          </div>,
          document.body
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

export function getBrandColumns(actions: BrandColumnActions): TableColumn<Brand>[] {
  return [
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
    cell: (row) => (
      <ActionDropdown brand={row} onEdit={actions.onEdit} onDelete={actions.onDelete} />
    ),
  },
  ];
}

/** Static columns for export (no action callbacks). */
export const brandsColumns: TableColumn<Brand>[] = getBrandColumns({
  onEdit: () => {},
  onDelete: () => {},
});
