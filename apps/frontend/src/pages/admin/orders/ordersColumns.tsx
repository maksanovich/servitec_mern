import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, DollarSign, Package, RefreshCw, Printer, Pencil, Truck, Wrench, Trash2, Clock } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Order } from './types';
import { priorityVariant, stateVariant, stateLabel } from './constants';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

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
  const url = `/admin/order/${order.id}/print`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
function onDeliver(order: Order) {
  console.log('Deliver', order);
}

function ActionDropdown({
  order,
  onRequestDelete,
  isDeleteLoading,
  onMaintenanceClick,
  onStoreClick,
  onReplacementClick,
  onEditBudgetClick,
  onDeliverClick,
  onWaitingPartsClick,
  onResumeMaintenanceClick,
}: {
  order: Order;
  onRequestDelete: (order: Order) => void;
  isDeleteLoading?: boolean;
  onMaintenanceClick?: (order: Order) => void;
  onStoreClick?: (order: Order) => void;
  onReplacementClick?: (order: Order) => void;
  onEditBudgetClick?: (order: Order) => void;
  onDeliverClick?: (order: Order) => void;
  onWaitingPartsClick?: (order: Order) => void;
  onResumeMaintenanceClick?: (order: Order) => void;
}) {
  function onDelete(ord: Order) {
    if (isDeleteLoading) return;
    onRequestDelete(ord);
  }
  const navigate = useNavigate();
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

  const menuContent = open && position && (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
    >
      {order.area === 'entrance' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
            onClick={() => {
              if (onMaintenanceClick) {
                onMaintenanceClick(order);
              } else {
                console.log('Maintenance', order);
              }
              setOpen(false);
            }}
          >
            <Wrench className="w-4 h-4" /> Maintenance
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => {
              onPrint(order);
              setOpen(false);
            }}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => {
              navigate(`/admin/order/${order.id}/edit`);
              setOpen(false);
            }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => {
              onDelete(order);
              setOpen(false);
            }}
            disabled={isDeleteLoading}
          >
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Deleting…' : 'Delete'}
          </button>
        </>
      ) : order.area === 'delivery' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </>
      ) : order.area === 'waiting-parts' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
            onClick={() => {
              if (onResumeMaintenanceClick) {
                onResumeMaintenanceClick(order);
              }
              setOpen(false);
            }}
          >
            <Wrench className="w-4 h-4" /> Part received — resume maintenance
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
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => { onDelete(order); setOpen(false); }}
            disabled={isDeleteLoading}
          >
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Deleting…' : 'Delete'}
          </button>
        </>
      ) : order.area === 'maintenance' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              if (onEditBudgetClick) {
                onEditBudgetClick(order);
              } else {
                onEditBudget(order);
              }
              setOpen(false);
            }}
          >
            <DollarSign className="w-4 h-4" /> Edit budget
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => {
              if (onWaitingPartsClick) {
                onWaitingPartsClick(order);
              }
              setOpen(false);
            }}
          >
            <Clock className="w-4 h-4" /> Waiting for spare part
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-violet-700 dark:text-violet-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              if (onReplacementClick) {
                onReplacementClick(order);
              } else {
                onReplacement(order);
              }
              setOpen(false);
            }}
          >
            <RefreshCw className="w-4 h-4" /> Replacement
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              if (onStoreClick) {
                onStoreClick(order);
              } else {
                onStore(order);
              }
              setOpen(false);
            }}
          >
            <Package className="w-4 h-4" /> Store
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => {
              navigate(`/admin/order/${order.id}/edit`);
              setOpen(false);
            }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => {
              onPrint(order);
              setOpen(false);
            }}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </>
      ) : order.area === 'warehouse' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
            onClick={() => {
              if (onDeliverClick) {
                onDeliverClick(order);
              } else {
                onDeliver(order);
              }
              setOpen(false);
            }}
          >
            <Truck className="w-4 h-4" /> Deliver
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => {
              if (onEditBudgetClick) {
                onEditBudgetClick(order);
              } else {
                onEditBudget(order);
              }
              setOpen(false);
            }}
          >
            <DollarSign className="w-4 h-4" /> Edit budget
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onStore(order); setOpen(false); }}
          >
            <Package className="w-4 h-4" /> Store
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-violet-700 dark:text-violet-200 hover:bg-slate-100 dark:hover:bg-slate-700"
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
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => { onDelete(order); setOpen(false); }}
            disabled={isDeleteLoading}
          >
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Deleting…' : 'Delete'}
          </button>
        </>
      )}
    </div>
  );

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
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}

export function getOrdersColumns(
  onRequestDelete: (order: Order) => void,
  isDeleteLoading?: boolean,
  options?: {
    onMaintenanceClick?: (order: Order) => void;
    onStoreClick?: (order: Order) => void;
    onReplacementClick?: (order: Order) => void;
    onEditBudgetClick?: (order: Order) => void;
    onDeliverClick?: (order: Order) => void;
    onWaitingPartsClick?: (order: Order) => void;
    onResumeMaintenanceClick?: (order: Order) => void;
  }
): TableColumn<Order>[] {
  return [
  {
    id: 'no',
    name: 'No.',
    selector: (row) => row.no,
    sortable: true,
    width: '100px',
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
    width: '150px',
    cell: (row) => (
      <Badge variant={stateVariant[row.state]}>{stateLabel[row.state]}</Badge>
    ),
  },
  {
    id: 'type',
    name: 'Type',
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
    cell: (row) => (
      <ActionDropdown
        order={row}
        onRequestDelete={onRequestDelete}
        isDeleteLoading={isDeleteLoading}
        onMaintenanceClick={options?.onMaintenanceClick}
        onStoreClick={options?.onStoreClick}
        onReplacementClick={options?.onReplacementClick}
        onEditBudgetClick={options?.onEditBudgetClick}
        onDeliverClick={options?.onDeliverClick}
        onWaitingPartsClick={options?.onWaitingPartsClick}
        onResumeMaintenanceClick={options?.onResumeMaintenanceClick}
      />
    ),
  },
  {
    id: 'branch',
    name: 'Branch',
    selector: (row) => row.branch,
    sortable: true,
    width: '140px',
  },
];
}

export const ordersColumns = getOrdersColumns(() => {});
