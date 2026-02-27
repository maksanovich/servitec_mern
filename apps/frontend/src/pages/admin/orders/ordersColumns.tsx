import { useState, useRef, useEffect } from 'react';
import { ChevronDown, DollarSign, Package, RefreshCw, Printer, Pencil, Plus, Truck } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Order } from './types';
import { priorityVariant, stateVariant, stateLabel } from './constants';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

function onEditBudget(order: Order) {
  console.log('Edit budget', order);
}
function onStore(order: Order) {
  console.log('Store', order);
}
function onReplacement(order: Order) {
  console.log('Replacement', order);
}
function onPrint(order: Order) {
  console.log('Print', order);
}
function onEdit(order: Order) {
  console.log('Edit', order);
}
function onDeliver(order: Order) {
  console.log('Deliver', order);
}

function ActionDropdown({ order }: { order: Order }) {
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
          {order.area === 'delivery' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => { onPrint(order); setOpen(false); }}
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          ) : order.area === 'waiting-parts' ? (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onDeliver(order); setOpen(false); }}
              >
                <Truck className="w-4 h-4" /> Deliver
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onPrint(order); setOpen(false); }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onEdit(order); setOpen(false); }}
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            </>
          ) : order.area === 'warehouse' ? (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onDeliver(order); setOpen(false); }}
              >
                <Truck className="w-4 h-4" /> Deliver
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onEdit(order); setOpen(false); }}
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onPrint(order); setOpen(false); }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onEditBudget(order); setOpen(false); }}
              >
                <DollarSign className="w-4 h-4" /> Edit budget
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onStore(order); setOpen(false); }}
              >
                <Package className="w-4 h-4" /> Store
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onReplacement(order); setOpen(false); }}
              >
                <RefreshCw className="w-4 h-4" /> Replacement
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onPrint(order); setOpen(false); }}
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onEdit(order); setOpen(false); }}
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const ordersColumns: TableColumn<Order>[] = [
  {
    id: 'no',
    name: 'No.',
    selector: (row) => row.no,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{row.no}</span>
      </div>
    ),
  },
  {
    id: 'code',
    name: 'Code.',
    selector: (row) => row.code,
    sortable: true,
    width: '90px',
  },
  {
    id: 'priority',
    name: 'Prio.',
    selector: (row) => row.priority,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <Badge variant={priorityVariant[row.priority]}>
        {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
      </Badge>
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
    id: 'type',
    name: 'Guy',
    selector: (row) => row.type,
    sortable: true,
    width: '110px',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    selector: (row) => row.equipment,
    sortable: true,
    minWidth: '120px',
  },
  {
    id: 'series',
    name: 'Series',
    selector: (row) => row.series,
    sortable: true,
    width: '110px',
  },
  {
    id: 'customer',
    name: 'Customer',
    selector: (row) => `${row.customer} (${row.customerId})`,
    sortable: true,
    minWidth: '220px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">
        {row.customer} ({row.customerId})
      </span>
    ),
  },
  {
    id: 'technical',
    name: 'Technical',
    selector: (row) => row.technical,
    sortable: true,
    minWidth: '180px',
  },
  {
    id: 'total',
    name: 'Total',
    selector: (row) => row.total,
    sortable: true,
    sortFunction: (a, b) => a.total - b.total,
    width: '90px',
    cell: (row) => (
      <span className="font-medium text-slate-900 dark:text-slate-100">
        ${row.total.toFixed(2)}
      </span>
    ),
  },
  {
    id: 'action',
    name: 'Action',
    sortable: false,
    width: '80px',
    cell: (row) => <ActionDropdown order={row} />,
  },
  {
    id: 'branch',
    name: 'Branch',
    selector: (row) => row.branch,
    sortable: true,
    width: '140px',
  },
];
