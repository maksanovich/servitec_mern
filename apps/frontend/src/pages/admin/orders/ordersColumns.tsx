import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  DollarSign,
  Package,
  RefreshCw,
  Printer,
  Pencil,
  Truck,
  Wrench,
  Trash2,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Order } from './types';
import type { OrderProgressStage } from '../../../api/orderProgressStages';
import { priorityLabel, priorityVariant, stateVariant, stateLabel } from './constants';
import { downloadTechnicalReportDocx } from '../../../api/orders';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

/** Stages for this order's workflow (avoids matching a standard key against the warranty tab list). */
function stagesForOrderPipeline(order: Order, orderedStages: OrderProgressStage[]): OrderProgressStage[] {
  const wf = order.workflow ?? 'standard';
  const pipeline = orderedStages.filter((s) => (s.workflow ?? 'standard') === wf);
  return pipeline.length > 0 ? pipeline : orderedStages;
}

/**
 * When `progressStageKey` is missing or from the wrong pipeline (legacy data), fall back to same legacy area
 * then first stage so move/skip actions still appear on Garantía like Reparación estándar.
 */
function resolvePipelineStageIndex(order: Order, stagesForNav: OrderProgressStage[]): number {
  if (stagesForNav.length === 0) return -1;
  const key = String(order.progressStageKey ?? '').trim();
  let idx = stagesForNav.findIndex((s) => s.key === key);
  if (idx >= 0) return idx;
  if (order.area) {
    const matches = [...stagesForNav]
      .filter((s) => s.legacyArea === order.area)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (matches[0]) {
      const j = stagesForNav.findIndex((s) => s.key === matches[0].key);
      if (j >= 0) return j;
    }
  }
  return 0;
}

/** Stable keys — when at approval, offer a direct jump to repair (skip e.g. waiting-for-parts). */
const INBOUND_STAGE_KEY = 'inbound-receiving';
const WARRANTY_INBOUND_STAGE_KEY = 'warranty-receiving';
const APPROVAL_STAGE_KEY = 'approval';
const REPAIR_STAGE_KEY = 'repair';
const WARRANTY_WAIT_APPROVAL_KEY = 'warranty-waiting-provider-approval';
const WARRANTY_APPROVED_KEY = 'warranty-approved';
const WARRANTY_REJECTED_KEY = 'warranty-rejected';

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
            <Wrench className="w-4 h-4" /> Mantenimiento
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => {
              onPrint(order);
              setOpen(false);
            }}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => {
              navigate(`/admin/order/${order.id}/edit`);
              setOpen(false);
            }}
          >
            <Pencil className="w-4 h-4" /> Editar
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
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </>
      ) : order.area === 'delivery' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Imprimir
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
            <Wrench className="w-4 h-4" /> Repuesto recibido — reanudar mantenimiento
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => { onDelete(order); setOpen(false); }}
            disabled={isDeleteLoading}
          >
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Eliminando…' : 'Eliminar'}
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
            <DollarSign className="w-4 h-4" /> Editar presupuesto
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
            <Clock className="w-4 h-4" /> Esperando repuesto
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
            <RefreshCw className="w-4 h-4" /> Reemplazo
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
            <Package className="w-4 h-4" /> Almacén
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => {
              navigate(`/admin/order/${order.id}/edit`);
              setOpen(false);
            }}
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => {
              onPrint(order);
              setOpen(false);
            }}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </>
      ) : order.area === 'warehouse' ? (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Editar
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
            <Truck className="w-4 h-4" /> Entregar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Imprimir
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
            <DollarSign className="w-4 h-4" /> Editar presupuesto
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onStore(order); setOpen(false); }}
          >
            <Package className="w-4 h-4" /> Almacén
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-violet-700 dark:text-violet-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onReplacement(order); setOpen(false); }}
          >
            <RefreshCw className="w-4 h-4" /> Reemplazo
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onPrint(order); setOpen(false); }}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { navigate(`/admin/order/${order.id}/edit`); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 disabled:opacity-50"
            onClick={() => { onDelete(order); setOpen(false); }}
            disabled={isDeleteLoading}
          >
            <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Eliminando…' : 'Eliminar'}
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
        title="Acciones"
        aria-label="Acciones"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}

// Keep legacy ActionDropdown implementation (unused) while newer stage-based menu is used.
// The `void` reference silences TypeScript's unused-function warning.
void ActionDropdown;

function StageActionDropdown({
  order,
  stages,
  onRequestDelete,
  isDeleteLoading,
  onMoveToStage,
  onEditBudgetClick,
}: {
  order: Order;
  stages: OrderProgressStage[];
  onRequestDelete: (order: Order) => void;
  isDeleteLoading?: boolean;
  onMoveToStage?: (order: Order, toStageKey: string) => void;
  onEditBudgetClick?: (order: Order) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
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
    return;
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

  const orderedStages = [...stages].sort((a, b) => {
    const d = a.sortOrder - b.sortOrder;
    return d !== 0 ? d : a.key.localeCompare(b.key);
  });

  const workflow = order.workflow ?? 'standard';
  const stagesForNav = stagesForOrderPipeline(order, orderedStages);
  const stageIndex = resolvePipelineStageIndex(order, stagesForNav);
  const currentStage = stageIndex >= 0 ? stagesForNav[stageIndex]! : null;
  const prevStage = stageIndex > 0 ? stagesForNav[stageIndex - 1]! : null;
  const warrantyApprovedStageDirect = stagesForNav.find((s) => s.key === WARRANTY_APPROVED_KEY);
  const warrantyRejectedStageDirect = stagesForNav.find((s) => s.key === WARRANTY_REJECTED_KEY);

  const rawProgressKey = String(order.progressStageKey ?? '').trim();
  const atWarrantyAwaitingApproval =
    workflow === 'warranty' &&
    (rawProgressKey === WARRANTY_WAIT_APPROVAL_KEY || currentStage?.key === WARRANTY_WAIT_APPROVAL_KEY);
  const showWarrantyApprovalOutcomes =
    onMoveToStage && atWarrantyAwaitingApproval && warrantyApprovedStageDirect && warrantyRejectedStageDirect;

  const atStandardInbound =
    workflow === 'standard' && currentStage != null && currentStage.key === INBOUND_STAGE_KEY;

  const atWarrantyInbound =
    workflow === 'warranty' && currentStage != null && currentStage.key === WARRANTY_INBOUND_STAGE_KEY;

  /**
   * Every tab: list all later pipeline stages as skip targets (not only recepción or the single “next”).
   * At recepción estándar / garantía, keep Reparación / Diagnóstico first in the list.
   */
  const forwardSkipStages =
    onMoveToStage && currentStage && !showWarrantyApprovalOutcomes
      ? (() => {
          let forward = stagesForNav.filter((s) => s.sortOrder > currentStage.sortOrder);
          if (atStandardInbound) {
            const repIdx = forward.findIndex((s) => s.key === REPAIR_STAGE_KEY);
            if (repIdx > 0) {
              const arr = [...forward];
              const [rep] = arr.splice(repIdx, 1);
              forward = [rep, ...arr];
            }
          } else if (atWarrantyInbound) {
            const diagIdx = forward.findIndex((s) => s.key === 'warranty-diagnosis');
            if (diagIdx > 0) {
              const arr = [...forward];
              const [d] = arr.splice(diagIdx, 1);
              forward = [d, ...arr];
            }
          }
          return forward;
        })()
      : [];

  const approvalStageInPipeline = stagesForNav.find((s) => s.key === APPROVAL_STAGE_KEY);
  const isAfterApprovalStage =
    approvalStageInPipeline != null &&
    currentStage != null &&
    currentStage.sortOrder > approvalStageInPipeline.sortOrder;
  const showEditBudgetAction =
    Boolean(currentStage?.budgetEditable && onEditBudgetClick && !isAfterApprovalStage);

  const codeTrimmed = String(order.code ?? '').trim();
  const showDownloadTechnicalReport =
    codeTrimmed !== '' &&
    (((order.workflow ?? 'standard') === 'standard' &&
      currentStage != null &&
      (currentStage.legacyArea === 'warehouse' ||
        currentStage.legacyArea === 'delivery' ||
        currentStage.legacyArea === 'quarantine' ||
        currentStage.legacyArea === 'abandonment')) ||
      (order.workflow === 'warranty' &&
        currentStage != null &&
        (currentStage.legacyArea === 'warehouse' ||
          currentStage.legacyArea === 'delivery' ||
          currentStage.legacyArea === 'quarantine' ||
          currentStage.legacyArea === 'abandonment')));

  function onDelete(ord: Order) {
    if (isDeleteLoading) return;
    onRequestDelete(ord);
  }

  const menuContent = open && position && (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
      style={{ top: position.top, left: position.left }}
    >
      {prevStage && onMoveToStage && (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={() => {
            onMoveToStage(order, prevStage.key);
            setOpen(false);
          }}
        >
          Ant.: {prevStage.label}
        </button>
      )}

      {forwardSkipStages.length > 0 && onMoveToStage && (
        <>
          {forwardSkipStages.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
              title={
                atStandardInbound && idx === 0 && s.key === REPAIR_STAGE_KEY
                  ? 'Tras el ingreso puede iniciarse la reparación; también puede elegir otra etapa abajo.'
                  : atWarrantyInbound && idx === 0 && s.key === 'warranty-diagnosis'
                    ? 'Elija la siguiente etapa del flujo de garantía.'
                    : undefined
              }
              onClick={() => {
                onMoveToStage(order, s.key);
                setOpen(false);
              }}
            >
              {s.key === REPAIR_STAGE_KEY || s.key === 'warranty-diagnosis' ? (
                <Wrench className="w-4 h-4 shrink-0" />
              ) : null}
              {s.label}
            </button>
          ))}
        </>
      )}

      {showWarrantyApprovalOutcomes && warrantyApprovedStageDirect && warrantyRejectedStageDirect && (
        <>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
            title="Marcar garantía como aprobada"
            onClick={() => {
              onMoveToStage!(order, warrantyApprovedStageDirect.key);
              setOpen(false);
            }}
          >
            {warrantyApprovedStageDirect.label}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-700 dark:text-rose-200 hover:bg-rose-500/10 dark:hover:bg-rose-500/20"
            title="Marcar garantía como rechazada"
            onClick={() => {
              onMoveToStage!(order, warrantyRejectedStageDirect.key);
              setOpen(false);
            }}
          >
            {warrantyRejectedStageDirect.label}
          </button>
        </>
      )}

      {showEditBudgetAction && (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-amber-500/10 dark:hover:bg-amber-500/20"
          onClick={() => {
            onEditBudgetClick!(order);
            setOpen(false);
          }}
        >
          Editar presupuesto
        </button>
      )}

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => {
          onPrint(order);
          setOpen(false);
        }}
      >
        <Printer className="w-4 h-4" /> Imprimir
      </button>

      {showDownloadTechnicalReport && (
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-sky-700 dark:text-sky-200 hover:bg-sky-500/10 dark:hover:bg-sky-500/20 disabled:opacity-50"
          disabled={reportLoading}
          onClick={async () => {
            const code = codeTrimmed;
            if (!code) {
              toast.error('La orden no tiene código de seguimiento para el informe.');
              return;
            }
            setReportLoading(true);
            try {
              await downloadTechnicalReportDocx(code);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'No se pudo descargar el informe');
            } finally {
              setReportLoading(false);
            }
          }}
        >
          <FileText className="w-4 h-4 shrink-0" />
          {reportLoading ? 'Preparando…' : 'Descargar informe'}
        </button>
      )}

      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 dark:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        onClick={() => {
          navigate(`/admin/order/${order.id}/edit`);
          setOpen(false);
        }}
      >
        <Pencil className="w-4 h-4" /> Editar
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
        <Trash2 className="w-4 h-4" /> {isDeleteLoading ? 'Eliminando…' : 'Eliminar'}
      </button>
    </div>
  );

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
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}

export function getOrdersColumns(
  onRequestDelete: (order: Order) => void,
  isDeleteLoading?: boolean,
  options?: {
    stages?: OrderProgressStage[];
    onMoveToStage?: (order: Order, toStageKey: string) => void;
    onEditBudgetClick?: (order: Order) => void;
    /** When true, omit State — redundant with the selected stage tab filter. */
    hideStateColumn?: boolean;
  }
): TableColumn<Order>[] {
  const stageByKey = new Map<string, OrderProgressStage>((options?.stages ?? []).map((s) => [s.key, s]));

  const columns: TableColumn<Order>[] = [
  {
    id: 'no',
    name: 'N.º',
    selector: (row) => row.no,
    sortable: true,
    width: '100px',
  },
  {
    id: 'code',
    name: 'Código',
    selector: (row) => row.code,
    sortable: true,
    width: '90px',
  },
  {
    id: 'priority',
    name: 'Prior.',
    selector: (row) => row.priority,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <Badge variant={priorityVariant[row.priority]}>
        {priorityLabel[row.priority]}
      </Badge>
    ),
  },
  {
    id: 'state',
    name: 'Estado',
    selector: (row) => row.state,
    sortable: true,
    width: '150px',
    cell: (row) => (
      <Badge variant={stateVariant[row.state]}>{stageByKey.get(row.progressStageKey ?? '')?.label ?? stateLabel[row.state]}</Badge>
    ),
  },
  {
    id: 'type',
    name: 'Tipo',
    selector: (row) => row.type,
    sortable: true,
    width: '110px',
  },
  {
    id: 'equipment',
    name: 'Equipo',
    selector: (row) => row.equipment,
    sortable: true,
    minWidth: '120px',
    cell: (row) => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const createdAtMs = row.createdAt ? new Date(row.createdAt).getTime() : NaN;
      const isInServiceOld = row.state !== 'finished' && Number.isFinite(createdAtMs) && Date.now() - createdAtMs > sevenDaysMs;
      return (
        <span
          className={
            `text-slate-700 dark:text-slate-300 ${isInServiceOld ? 'animate-pulse text-rose-600 dark:text-rose-300 font-semibold' : ''}`
          }
          title={isInServiceOld ? 'En servicio más de 7 días' : undefined}
        >
          {row.equipment}
        </span>
      );
    },
  },
  {
    id: 'series',
    name: 'Serie',
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
    name: 'Técnico',
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
    name: 'Acciones',
    sortable: false,
    width: '80px',
    cell: (row) => (
      <StageActionDropdown
        order={row}
        stages={options?.stages ?? []}
        onRequestDelete={onRequestDelete}
        isDeleteLoading={isDeleteLoading}
        onMoveToStage={options?.onMoveToStage}
        onEditBudgetClick={options?.onEditBudgetClick}
      />
    ),
  },
];

  if (options?.hideStateColumn) {
    return columns.filter((c) => c.id !== 'state');
  }
  return columns;
}

export const ordersColumns = getOrdersColumns(() => {});
