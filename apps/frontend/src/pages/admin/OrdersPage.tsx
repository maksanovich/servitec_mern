import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Wrench, FileText, FileSpreadsheet } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, ConfirmDialog } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import {
  type Order,
  type OrderArea,
  AREA_TABS,
  getOrdersColumns,
} from './orders';
import { OrderExpandedRow } from './orders/OrderExpandedRow';
import { Plus, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { deleteOrder, getOrders } from '../../api/orders';

export type { Order, OrderArea };

const exportOptions = { title: 'Orders', filename: 'orders' };

export function OrdersPage() {
  const { token } = useAuth();
  const [activeArea, setActiveArea] = useState<OrderArea>('entrance');
  const filteredDataRef = useRef<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { orders: list } = await getOrders(token, { limit: 200 });
        if (mounted) setOrders(list as unknown as Order[]);
      } catch (e) {
        console.error(e);
        if (mounted) setOrders([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const dataByArea = useMemo(() => {
    return orders.filter((o) => o.area === activeArea);
  }, [activeArea, orders]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Order[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const refetchOrders = useCallback(async () => {
    try {
      const { orders: list } = await getOrders(token, { limit: 200 });
      setOrders(list as unknown as Order[]);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const handleDeleteClick = useCallback((order: Order) => {
    setDeleteError(null);
    setDeleteConfirm(order);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteOrder(token, deleteConfirm.id);
      setDeleteConfirm(null);
      await refetchOrders();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete order');
    } finally {
      setDeleteLoading(false);
    }
  }, [token, deleteConfirm, refetchOrders]);

  const handleDeleteCancel = useCallback(() => {
    if (!deleteLoading) {
      setDeleteConfirm(null);
      setDeleteError(null);
    }
  }, [deleteLoading]);

  const tableColumns = useMemo(() => getOrdersColumns(handleDeleteClick, deleteLoading), [handleDeleteClick, deleteLoading]);

  const exportPDF = () => exportTableToPDF(tableColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(tableColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Orders - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Operations', icon: Home }, { label: 'Orders' }]}
        />
        <Link to="/admin/order/new">
          <Button
            variant="emerald"
            size="md"
            leftIcon={Wrench}
            className="sm:ml-auto"
          >
            New Order
          </Button>
        </Link>
      </div>

      {/* Area tabs */}
      <div className="flex w-full gap-1 border-b border-slate-200 dark:border-slate-700">
        {AREA_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveArea(id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
              ${activeArea === id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Order>
          data={dataByArea}
          columns={tableColumns}
          searchFields={['no', 'code', 'customer', 'technical', 'equipment', 'series', 'type', 'branch']}
          searchPlaceholder="Look for:"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          expandableRows
          expandableRowsComponent={OrderExpandedRow}
          expandableIcon={{
            collapsed: <Plus className="h-4 w-4" strokeWidth={2.5} />,
            expanded: <Minus className="h-4 w-4" strokeWidth={2.5} />,
          }}
          rightContent={
            <ButtonGroup>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileText}
                onClick={exportPDF}
                title="Export PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Export PDF"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={FileSpreadsheet}
                onClick={exportExcel}
                title="Export Excel"
                className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                aria-label="Export Excel"
              />
            </ButtonGroup>
          }
        />
      </Card>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete order"
        message={
          deleteConfirm
            ? `Are you sure you want to delete "${deleteConfirm.no}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
}
