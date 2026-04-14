import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import type { TableColumn } from 'react-data-table-component';
import { PageHeader, Card, Button, ButtonGroup, Input, Loader } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { useAuth } from '../../contexts/AuthContext';
import { listOrderMovements, type OrderMovementRow, type OrderWorkflow } from '../../api/orderMovements';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function workflowLabel(w: OrderWorkflow): string {
  return w === 'warranty' ? 'Garantía' : 'Reparación estándar';
}

const exportOptions = { title: 'Movimientos de etapas', filename: 'movimientos-etapas' };

export function OrderMovementsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<OrderMovementRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderCodeFilter, setOrderCodeFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState<OrderWorkflow | ''>('');
  const filteredDataRef = useRef<OrderMovementRow[]>([]);

  const columns = useMemo<TableColumn<OrderMovementRow>[]>(
    () => [
      {
        id: 'createdAt',
        name: 'Fecha y hora',
        selector: (r) => r.createdAt ?? '',
        sortable: true,
        grow: 1.2,
        cell: (r) => (
          <span className="text-sm text-slate-800 dark:text-slate-100 whitespace-nowrap">
            {formatDateTime(r.createdAt)}
          </span>
        ),
      },
      {
        id: 'orderNo',
        name: 'Orden n.º',
        selector: (r) => r.orderNo,
        sortable: true,
        width: '100px',
      },
      {
        id: 'orderCode',
        name: 'Código',
        selector: (r) => r.orderCode,
        sortable: true,
        width: '100px',
      },
      {
        id: 'orderedByName',
        name: 'Por',
        selector: (r) => r.orderedByName,
        sortable: true,
        grow: 1,
        cell: (r) => (
          <div className="min-w-0">
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{r.orderedByName || '—'}</div>
            {r.orderedByEmail ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.orderedByEmail}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'workflow',
        name: 'Flujo',
        selector: (r) => r.workflow,
        sortable: true,
        width: '130px',
        cell: (r) => (
          <span
            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
              r.workflow === 'warranty'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
            }`}
          >
            {workflowLabel(r.workflow)}
          </span>
        ),
      },
      {
        id: 'beforeStageLabel',
        name: 'Anterior',
        selector: (r) => r.beforeStageLabel,
        sortable: true,
        grow: 1.1,
        cell: (r) => (
          <span className="text-sm text-slate-700 dark:text-slate-200" title={r.beforeStageKey || undefined}>
            {r.beforeStageLabel}
          </span>
        ),
      },
      {
        id: 'afterStageLabel',
        name: 'Actual',
        selector: (r) => r.afterStageLabel,
        sortable: true,
        grow: 1.1,
        cell: (r) => (
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100" title={r.afterStageKey || undefined}>
            {r.afterStageLabel}
          </span>
        ),
      },
    ],
    []
  );

  const fetchRows = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { movements, total: t } = await listOrderMovements(token, {
        limit: 500,
        skip: 0,
        orderCode: orderCodeFilter.trim() || undefined,
        workflow: workflowFilter || undefined,
      });
      setRows(movements);
      setTotal(t);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, orderCodeFilter, workflowFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: OrderMovementRow[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(columns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(columns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Movimientos entre etapas"
          breadcrumb={[{ label: 'Operaciones', icon: Home }, { label: 'Ordenes' }, { label: 'Movimientos' }]}
        />
        <Link to="/admin/order">
          <Button variant="secondary" size="md" leftIcon={ArrowLeft}>
            Volver a órdenes
          </Button>
        </Link>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
        Cada vez que una orden avanza en el flujo de reparación o garantía, se registra quién la cambió, la etapa anterior y
        la nueva. Use los filtros por código de seguimiento o tipo de flujo.
      </p>

      <Card className="p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Código de orden</label>
          <Input
            value={orderCodeFilter}
            onChange={(e) => setOrderCodeFilter(e.target.value)}
            placeholder="Filtrar por código"
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchRows();
            }}
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Flujo</label>
          <select
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value as OrderWorkflow | '')}
          >
            <option value="">Todos</option>
            <option value="standard">Reparación estándar</option>
            <option value="warranty">Garantía</option>
          </select>
        </div>
        <Button type="button" variant="primary" size="md" onClick={() => fetchRows()}>
          Aplicar filtros
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {loading ? 'Cargando…' : `${total} movimiento${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}`}
          </div>
          <ButtonGroup>
            <Button type="button" variant="secondary" size="sm" leftIcon={FileText} onClick={exportPDF}>
              PDF
            </Button>
            <Button type="button" variant="secondary" size="sm" leftIcon={FileSpreadsheet} onClick={exportExcel}>
              Excel
            </Button>
          </ButtonGroup>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : (
          <DataTableWithToolbar<OrderMovementRow>
            columns={columns}
            data={rows}
            searchFields={['orderNo', 'orderCode', 'orderedByName', 'beforeStageLabel', 'afterStageLabel']}
            searchPlaceholder="Buscar en la tabla…"
            dateColumnId="createdAt"
            onFilteredDataChange={onFilteredDataChange}
          />
        )}
      </Card>
    </div>
  );
}
