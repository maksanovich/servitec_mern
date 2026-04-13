import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { ServiceSparePartItem } from './types';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

export interface ServiceSparePartColumnActions {
  onEdit: (item: ServiceSparePartItem) => void;
  onDelete: (item: ServiceSparePartItem) => void;
}

function ActionDropdown({
  item,
  onEdit,
  onDelete,
}: { item: ServiceSparePartItem } & ServiceSparePartColumnActions) {
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
        title="Acciones"
        aria-label="Acciones"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
          style={{ top: position.top, left: position.left }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onEdit(item); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onDelete(item); setOpen(false); }}
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

const typeVariant: Record<ServiceSparePartItem['type'], 'info' | 'warning'> = {
  service: 'info',
  replacement: 'warning',
};

const typeLabel: Record<ServiceSparePartItem['type'], string> = {
  service: 'Servicio',
  replacement: 'Reemplazo',
};

function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
}

export interface GetServicesColumnsOptions {
  /** When false, the Type column is omitted (e.g. Services-only catalog). */
  includeType?: boolean;
  /** When false, the Action column is omitted (e.g. read-only Spare Parts view). */
  includeActions?: boolean;
  /** When false, the Amount column is omitted (e.g. Services catalog without stock). */
  includeAmount?: boolean;
  /** Header for the name column (default: Service / Spare Parts). */
  nameColumnLabel?: string;
  /** Min width for the name column (default: 300px). */
  nameColumnMinWidth?: string;
  /** Min width for the details column (default: 220px). */
  detailsColumnMinWidth?: string;
}

export function getServicesColumns(
  actions: ServiceSparePartColumnActions,
  options?: GetServicesColumnsOptions
): TableColumn<ServiceSparePartItem>[] {
  const {
    includeType = true,
    includeActions = true,
    includeAmount = true,
    nameColumnLabel = 'Servicio / repuesto',
    nameColumnMinWidth = '180px',
    detailsColumnMinWidth = '220px',
  } = options ?? {};

  const cols: TableColumn<ServiceSparePartItem>[] = [];

  if (includeType) {
    cols.push({
      id: 'type',
      name: 'Tipo',
      selector: (row) => row.type,
      sortable: true,
      width: '160px',
      cell: (row) => (
        <Badge variant={typeVariant[row.type]}>{typeLabel[row.type]}</Badge>
      ),
    });
  }

  cols.push(
    {
      id: 'name',
      name: nameColumnLabel,
      selector: (row) => row.name,
      sortable: true,
      width: nameColumnMinWidth,
      cell: (row) => (
        <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
      ),
    },
    ...(includeAmount
      ? [
          {
            id: 'amount',
            name: 'Cantidad',
            selector: (row: ServiceSparePartItem) => row.amount,
            sortable: true,
            width: '100px',
            cell: (row: ServiceSparePartItem) => (
              <span className="text-slate-700 dark:text-slate-300">{row.amount}</span>
            ),
          } satisfies TableColumn<ServiceSparePartItem>,
        ]
      : []),
    {
      id: 'price',
      name: 'Precio',
      selector: (row) => row.price,
      sortable: true,
      width: '100px',
      cell: (row) => (
        <span className="text-slate-700 dark:text-slate-300">{formatPrice(row.price)}</span>
      ),
    },
    {
      id: 'details',
      name: 'Detalles',
      selector: (row) => row.details,
      sortable: true,
      minWidth: detailsColumnMinWidth,
      cell: (row) => (
        <span className="text-slate-700 dark:text-slate-300 line-clamp-2" title={row.details}>
          {row.details}
        </span>
      ),
    },
    {
      id: 'syncedAt',
      name: 'Última sincronización',
      selector: (row) => row.syncedAt ?? '',
      sortable: true,
      width: '160px',
      cell: (row) => (
        <span
          className="text-slate-700 dark:text-slate-300 text-sm tabular-nums"
          title={row.syncedAt ?? undefined}
        >
          {formatSyncedAt(row.syncedAt)}
        </span>
      ),
    }
  );

  if (includeActions) {
    cols.push({
      id: 'action',
      name: 'Acciones',
      sortable: false,
      width: '80px',
      cell: (row) => <ActionDropdown item={row} onEdit={actions.onEdit} onDelete={actions.onDelete} />,
    });
  }

  return cols;
}

/** Static columns for export (no action callbacks). */
export const servicesColumns: TableColumn<ServiceSparePartItem>[] = getServicesColumns(
  { onEdit: () => {}, onDelete: () => {} },
  {}
);
