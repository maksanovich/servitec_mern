import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Wrench, FileText, FileSpreadsheet, Plus, Minus, X, Upload } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup, ConfirmDialog, Modal, Input, Loader } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import type { TableColumn } from 'react-data-table-component';
import {
  type Order,
  type OrderArea,
  AREA_TABS,
  getOrdersColumns,
} from './orders';
import { OrderExpandedRow } from './orders/OrderExpandedRow';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { deleteOrder, getOrders, updateOrder, getOrderById, type OrderBudgetLine } from '../../api/orders';
import { getServicesSpareParts, type ServiceSparePartItem } from '../../api/servicesSpareParts';
import { uploadImage } from '../../api/uploads';
import noImageUrl from '../../assets/images/noimage.png';

export type { Order, OrderArea };

const exportOptions = { title: 'Orders', filename: 'orders' };

interface BudgetLineItem {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  amount: number;
  total: number;
}

export function OrdersPage() {
  const { token } = useAuth();
  const MAX_ORDER_PHOTO_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB)
  const ACCEPT_ORDER_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

  const [activeArea, setActiveArea] = useState<OrderArea>('entrance');
  const filteredDataRef = useRef<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [statusConfirm, setStatusConfirm] = useState<{
    order: Order;
    action: 'to-maintenance' | 'to-warehouse' | 'to-entrance' | 'to-delivery' | 'to-waiting-parts' | 'from-waiting-parts';
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [budgetOrder, setBudgetOrder] = useState<Order | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [servicesData, setServicesData] = useState<ServiceSparePartItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [deliveryOrder, setDeliveryOrder] = useState<Order | null>(null);
  const [deliveryAdvance, setDeliveryAdvance] = useState<number>(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [warehouseMoveOrder, setWarehouseMoveOrder] = useState<Order | null>(null);
  const [warehouseAfterPhoto, setWarehouseAfterPhoto] = useState<string | null>(null);
  const [warehousePhotoError, setWarehousePhotoError] = useState<string | null>(null);
  const [warehouseAfterPhotoFile, setWarehouseAfterPhotoFile] = useState<File | null>(null);
  const [warehouseSaving, setWarehouseSaving] = useState(false);
  const warehousePhotoInputRef = useRef<HTMLInputElement>(null);
  const warehouseAfterObjectUrlRef = useRef<string | null>(null);

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

  const openWhatsappUpdate = useCallback((whatsappLink?: string, targetWindow?: Window | null) => {
    const link = String(whatsappLink ?? '').trim();
    if (!link) {
      if (targetWindow) targetWindow.close();
      toast.warning('Cannot send message via WhatsApp because the client phone is not registered.');
      return;
    }
    if (targetWindow) {
      targetWindow.location.href = link;
      return;
    }
    window.open(link, '_blank');
  }, []);

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

  const availableServices = useMemo(() => {
    if (!budgetOrder) return [];
    const filtered = budgetOrder.branch ? servicesData.filter((s) => s.branch === budgetOrder.branch) : servicesData;
    return filtered.filter((s) => s.state !== 'inactive');
  }, [servicesData, budgetOrder]);

  const totalBudget = useMemo(
    () => budgetLines.reduce((sum, line) => sum + line.total, 0),
    [budgetLines]
  );

  const addToBudget = useCallback((item: Pick<ServiceSparePartItem, 'id' | 'name' | 'price'>, amount: number = 1) => {
    const total = item.price * amount;
    setBudgetLines((prev) => {
      const existing = prev.find((l) => l.serviceId === item.id);
      if (existing) {
        const newAmount = existing.amount + amount;
        return prev.map((l) =>
          l.serviceId === item.id ? { ...l, amount: newAmount, total: l.price * newAmount } : l
        );
      }
      return [
        ...prev,
        {
          id: `budget-${item.id}-${Date.now()}`,
          serviceId: item.id,
          name: item.name,
          price: item.price,
          amount,
          total,
        },
      ];
    });
  }, []);

  const updateBudgetAmount = useCallback((lineId: string, amount: number) => {
    setBudgetLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, amount, total: l.price * amount } : l))
    );
  }, []);

  const removeBudgetLine = useCallback((lineId: string) => {
    setBudgetLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const closeBudgetModal = useCallback(() => {
    if (budgetSaving) return;
    setBudgetOrder(null);
    setBudgetLines([]);
    setBudgetError(null);
  }, [budgetSaving]);

  const handleEditBudgetClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setBudgetError(null);
      setBudgetOrder(order);
      setServicesLoading(true);
      try {
        const [orderResp, servicesResp] = await Promise.all([
          getOrderById(token, order.id),
          servicesData.length ? Promise.resolve<{ items: ServiceSparePartItem[] }>({ items: servicesData }) : getServicesSpareParts(token),
        ]);

        const lines: BudgetLineItem[] = (orderResp.order.budgetLines ?? []).map((l: OrderBudgetLine, idx: number) => ({
          id: `budget-${l.serviceId}-${idx}`,
          serviceId: l.serviceId,
          name: l.name,
          price: l.price,
          amount: l.amount,
          total: l.total,
        }));
        setBudgetLines(lines);
        if (!servicesData.length) setServicesData(servicesResp.items);
      } catch (e) {
        setBudgetError(e instanceof Error ? e.message : 'Failed to load budget details');
        setBudgetLines([]);
      } finally {
        setServicesLoading(false);
      }
    },
    [token, servicesData]
  );

  const handleBudgetSave = useCallback(async () => {
    if (!token || !budgetOrder) return;
    setBudgetSaving(true);
    setBudgetError(null);
    try {
      await updateOrder(token, budgetOrder.id, {
        budgetLines: budgetLines.map((l) => ({
          serviceId: l.serviceId,
          name: l.name,
          price: l.price,
          amount: l.amount,
          total: l.total,
        })),
      });
      await refetchOrders();
      setBudgetOrder(null);
      setBudgetLines([]);
    } catch (e) {
      setBudgetError(e instanceof Error ? e.message : 'Failed to save budget');
    } finally {
      setBudgetSaving(false);
    }
  }, [token, budgetOrder, budgetLines, refetchOrders]);

  const handleMaintenanceClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setStatusError(null);
      setStatusConfirm({ order, action: 'to-maintenance' });
    },
    [token]
  );

  const handleStoreClick = useCallback(
    (order: Order) => {
      if (!token) return;
      setWarehouseMoveOrder(order);
      if (warehouseAfterObjectUrlRef.current) {
        URL.revokeObjectURL(warehouseAfterObjectUrlRef.current);
        warehouseAfterObjectUrlRef.current = null;
      }
      setWarehouseAfterPhoto(null);
      setWarehousePhotoError(null);
    },
    [token]
  );

  const handleReplacementClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setStatusError(null);
      setStatusConfirm({ order, action: 'to-entrance' });
    },
    [token]
  );

  const handleWaitingPartsClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setStatusError(null);
      setStatusConfirm({ order, action: 'to-waiting-parts' });
    },
    [token]
  );

  const handleResumeMaintenanceClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setStatusError(null);
      setStatusConfirm({ order, action: 'from-waiting-parts' });
    },
    [token]
  );

  const openDeliveryModal = useCallback(
    async (order: Order) => {
      if (!token) return;
      setDeliveryError(null);
      setDeliveryLoading(true);
      try {
        const { order: detail } = await getOrderById(token, order.id);
        setDeliveryOrder(order);
        setDeliveryAdvance(detail.advancement ?? 0);
      } catch (e) {
        setDeliveryOrder(order);
        setDeliveryAdvance(0);
        setDeliveryError(e instanceof Error ? e.message : 'Failed to load delivery details');
      } finally {
        setDeliveryLoading(false);
      }
    },
    [token]
  );

  const closeDeliveryModal = useCallback(() => {
    if (deliverySaving) return;
    setDeliveryOrder(null);
    setDeliveryAdvance(0);
    setDeliveryError(null);
  }, [deliverySaving]);

  const handleDeliverySave = useCallback(() => {
    if (!token || !deliveryOrder) return;
    setStatusError(null);
    setStatusConfirm({ order: deliveryOrder, action: 'to-delivery' });
  }, [token, deliveryOrder]);

  const handleStatusConfirm = useCallback(async () => {
    if (!token || !statusConfirm) return;
    const shouldOpenWhatsappTab = statusConfirm.action !== 'to-warehouse';
    const pendingWhatsappTab = shouldOpenWhatsappTab ? window.open('', '_blank') : null;
    setStatusLoading(true);
    setStatusError(null);
    try {
      if (statusConfirm.action === 'to-maintenance') {
        const resp = await updateOrder(token, statusConfirm.order.id, { area: 'maintenance', state: 'maintenance' });
        openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
        await refetchOrders();
      } else if (statusConfirm.action === 'to-warehouse') {
        // Moving to warehouse now requires an after-repair photo.
        // Open a modal so the user can upload it before updating the order.
        setWarehouseMoveOrder(statusConfirm.order);
        setWarehouseAfterPhoto(null);
        setWarehousePhotoError(null);
        setStatusConfirm(null);
      } else if (statusConfirm.action === 'to-entrance') {
        const resp = await updateOrder(token, statusConfirm.order.id, { area: 'entrance', state: 'income' });
        openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
        await refetchOrders();
      } else if (statusConfirm.action === 'to-waiting-parts') {
        const resp = await updateOrder(token, statusConfirm.order.id, { area: 'waiting-parts', state: 'waiting' });
        openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
        await refetchOrders();
      } else if (statusConfirm.action === 'from-waiting-parts') {
        const resp = await updateOrder(token, statusConfirm.order.id, { area: 'maintenance', state: 'maintenance' });
        openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
        await refetchOrders();
      } else if (statusConfirm.action === 'to-delivery') {
        setDeliverySaving(true);
        setDeliveryError(null);
        const adv = Number.isFinite(deliveryAdvance) ? deliveryAdvance : 0;
        const resp = await updateOrder(token, statusConfirm.order.id, {
          area: 'delivery',
          state: 'delivery',
          advancement: adv,
        });
        openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
        await refetchOrders();
        setDeliveryOrder(null);
        setDeliveryAdvance(0);
      }
      setStatusConfirm(null);
    } catch (e) {
      if (pendingWhatsappTab) pendingWhatsappTab.close();
      setStatusError(e instanceof Error ? e.message : 'Failed to update order status');
    } finally {
      setStatusLoading(false);
      if (statusConfirm?.action === 'to-delivery') {
        setDeliverySaving(false);
      }
    }
  }, [token, statusConfirm, refetchOrders, deliveryAdvance, openWhatsappUpdate]);

  const handleStatusCancel = useCallback(() => {
    if (statusLoading) return;
    setStatusConfirm(null);
    setStatusError(null);
  }, [statusLoading]);

  const closeWarehouseModal = useCallback(() => {
    if (warehouseSaving) return;
    if (warehouseAfterObjectUrlRef.current) {
      URL.revokeObjectURL(warehouseAfterObjectUrlRef.current);
      warehouseAfterObjectUrlRef.current = null;
    }
    setWarehouseMoveOrder(null);
    setWarehouseAfterPhoto(null);
    setWarehouseAfterPhotoFile(null);
    setWarehousePhotoError(null);
    if (warehousePhotoInputRef.current) warehousePhotoInputRef.current.value = '';
  }, [warehouseSaving]);

  const handleWarehousePhotoFile = useCallback(
    (file: File) => {
      setWarehousePhotoError(null);
      if (!file.type.startsWith('image/')) {
        setWarehousePhotoError('Please select an image (JPEG, PNG, WebP or GIF).');
        return;
      }
      if (file.size > MAX_ORDER_PHOTO_BYTES) {
        setWarehousePhotoError(`Image must be under ${(MAX_ORDER_PHOTO_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
        return;
      }

      if (warehouseAfterObjectUrlRef.current) {
        URL.revokeObjectURL(warehouseAfterObjectUrlRef.current);
        warehouseAfterObjectUrlRef.current = null;
      }

      const objectUrl = URL.createObjectURL(file);
      warehouseAfterObjectUrlRef.current = objectUrl;
      setWarehouseAfterPhotoFile(file);
      setWarehouseAfterPhoto(objectUrl);
    },
    [MAX_ORDER_PHOTO_BYTES]
  );

  const handleWarehouseMove = useCallback(async () => {
    if (!token || !warehouseMoveOrder) return;
    const pendingWhatsappTab = window.open('', '_blank');
    setWarehouseSaving(true);
    setWarehousePhotoError(null);
    try {
      let photoValue = warehouseAfterPhoto?.trim() ?? '';

      if (warehouseAfterPhotoFile) {
        const { url } = await uploadImage(token, warehouseAfterPhotoFile, 'order-after');
        photoValue = url;
        setWarehouseAfterPhoto(url);
        setWarehouseAfterPhotoFile(null);
        if (warehouseAfterObjectUrlRef.current) {
          URL.revokeObjectURL(warehouseAfterObjectUrlRef.current);
          warehouseAfterObjectUrlRef.current = null;
        }
      }

      if (!photoValue) {
        setWarehousePhotoError('After-repair photo is required when moving to warehouse.');
        return;
      }
      const resp = await updateOrder(token, warehouseMoveOrder.id, {
        area: 'warehouse',
        state: 'warehouse',
        photoAfterRepair: photoValue,
      });
      openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
      await refetchOrders();
      setWarehouseMoveOrder(null);
      setWarehouseAfterPhoto(null);
      setWarehousePhotoError(null);
      if (warehousePhotoInputRef.current) warehousePhotoInputRef.current.value = '';
    } catch (e) {
      if (pendingWhatsappTab) pendingWhatsappTab.close();
      setWarehousePhotoError(e instanceof Error ? e.message : 'Failed to move order');
    } finally {
      setWarehouseSaving(false);
    }
  }, [token, warehouseMoveOrder, warehouseAfterPhoto, warehouseAfterPhotoFile, refetchOrders, openWhatsappUpdate]);

  const tableColumns = useMemo(
    () =>
      getOrdersColumns(handleDeleteClick, deleteLoading, {
        onMaintenanceClick: handleMaintenanceClick,
        onStoreClick: handleStoreClick,
        onReplacementClick: handleReplacementClick,
        onEditBudgetClick: handleEditBudgetClick,
        onDeliverClick: openDeliveryModal,
        onWaitingPartsClick: handleWaitingPartsClick,
        onResumeMaintenanceClick: handleResumeMaintenanceClick,
      }),
    [
      handleDeleteClick,
      deleteLoading,
      handleMaintenanceClick,
      handleStoreClick,
      handleReplacementClick,
      handleEditBudgetClick,
      openDeliveryModal,
      handleWaitingPartsClick,
      handleResumeMaintenanceClick,
    ]
  );

  const exportPDF = () => exportTableToPDF(tableColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(tableColumns, filteredDataRef.current, exportOptions);

  const deliveryTotal = deliveryOrder?.total ?? 0;
  const effectiveAdvance = Number.isFinite(deliveryAdvance) ? deliveryAdvance : 0;
  const deliveryDebt = Math.max(0, deliveryTotal - effectiveAdvance);

  const servicesColumns: TableColumn<ServiceSparePartItem>[] = useMemo(
    () => [
      { id: 'name', name: 'Service/Spare Parts',  width: '300px', selector: (r) => r.name, sortable: true },
      { id: 'price', name: 'Price', width: '100px', selector: (r) => r.price, sortable: true, format: (r) => r.price.toFixed(2) },
      { id: 'amount', name: 'Amount', width: '100px', selector: (r) => r.amount, sortable: true },
      {
        id: 'add',
        name: '',
        width: '60px',
        cell: (row) => (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="min-w-0 p-1.5"
            onClick={() => addToBudget(row)}
            aria-label={`Add ${row.name}`}
          >
            <Plus className="w-5 h-5 font-bold" />
          </Button>
        ),
        ignoreRowClick: true,
      },
    ],
    [addToBudget]
  );

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

      <Modal
        open={!!deliveryOrder}
        onClose={closeDeliveryModal}
        title="Equipment Delivery"
        size="lg"
      >
        {deliveryError && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {deliveryError}
          </div>
        )}

        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Service details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Advance (*)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={deliveryAdvance}
              onChange={(e) => setDeliveryAdvance(parseFloat(e.target.value) || 0)}
              disabled={deliveryLoading || deliverySaving}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Total (*)
            </label>
            <Input
              type="text"
              value={deliveryTotal.toFixed(2)}
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              Debt (*)
            </label>
            <Input
              type="text"
              value={deliveryDebt.toFixed(2)}
              disabled
              className="border-red-300 text-red-700 dark:border-red-700 dark:text-red-300"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="red"
            size="md"
            onClick={closeDeliveryModal}
            disabled={deliverySaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleDeliverySave}
            isLoading={deliverySaving}
          >
            Keep
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!warehouseMoveOrder}
        onClose={closeWarehouseModal}
        title="Move to Warehouse"
        size="lg"
      >
        {warehousePhotoError && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {warehousePhotoError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600">
              Upload the after-repair/fixed photo before moving this order to the warehouse.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={warehouseAfterPhoto && warehouseAfterPhoto.trim() ? warehouseAfterPhoto : noImageUrl}
                alt=""
                width={120}
                height={120}
                className="size-[120px] rounded-lg object-cover border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
              />
              {warehouseAfterPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    if (warehouseAfterObjectUrlRef.current) {
                      URL.revokeObjectURL(warehouseAfterObjectUrlRef.current);
                      warehouseAfterObjectUrlRef.current = null;
                    }
                    setWarehouseAfterPhoto(null);
                    setWarehouseAfterPhotoFile(null);
                    setWarehousePhotoError(null);
                    if (warehousePhotoInputRef.current) warehousePhotoInputRef.current.value = '';
                  }}
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                  title="Remove photo"
                  aria-label="Remove after-repair photo"
                  disabled={warehouseSaving}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={warehousePhotoInputRef}
                type="file"
                accept={ACCEPT_ORDER_IMAGES}
                className="hidden"
                disabled={warehouseSaving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleWarehousePhotoFile(file);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Upload}
                onClick={() => warehousePhotoInputRef.current?.click()}
                disabled={warehouseSaving}
              >
                Upload After Photo
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="red" size="md" onClick={closeWarehouseModal} disabled={warehouseSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleWarehouseMove}
              isLoading={warehouseSaving}
            >
              Move to Warehouse
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!budgetOrder}
        onClose={closeBudgetModal}
        title={budgetOrder ? `Add Service/Spare Part - ${budgetOrder.no}` : 'Add Service/Spare Part'}
        size="2xl"
      >
        {budgetError && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {budgetError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Budget Details</h3>
            </div>
            <div className="p-0 flex-1 min-h-0">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-h-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Service/Spare Parts</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Total</th>
                      <th className="w-10 py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {budgetLines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          No items. Add from Services / Spare Parts.
                        </td>
                      </tr>
                    ) : (
                      budgetLines.map((line) => (
                        <tr key={line.id} className="border-b border-slate-200/50 dark:border-slate-700/50">
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{line.name}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{line.price.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <div className="w-20">
                              <Input
                                type="number"
                                min={1}
                                value={line.amount}
                                onChange={(e) =>
                                  updateBudgetAmount(line.id, Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className="py-1 px-2"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{line.total.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => removeBudgetLine(line.id)}
                              className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                              aria-label="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300" colSpan={2}>
                        Total
                      </td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        $ {totalBudget.toFixed(2)}
                      </td>
                      <td className="py-3 px-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          <Card className="min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Services / Spare Parts</h3>
            </div>
            <div className="p-0 flex-1 min-h-0">
              <DataTableWithToolbar<ServiceSparePartItem>
                data={availableServices}
                columns={servicesColumns}
                searchFields={['name']}
                searchPlaceholder="Search:"
                pageSizeOptions={[10, 25, 50]}
                defaultPageSize={10}
                noDataComponent={
                  servicesLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                      <Loader size="md" />
                      <span className="text-sm">Loading…</span>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No services/spare parts found.
                    </div>
                  )
                }
              />
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="red" size="md" onClick={closeBudgetModal} disabled={budgetSaving}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="md" onClick={handleBudgetSave} isLoading={budgetSaving}>
            Keep
          </Button>
        </div>
      </Modal>

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
      <ConfirmDialog
        open={!!statusConfirm}
        onClose={handleStatusCancel}
        onConfirm={handleStatusConfirm}
        title="Change order status"
        message={
          statusConfirm
            ? statusConfirm.action === 'to-maintenance'
              ? `Move order "${statusConfirm.order.no}" to Maintenance?`
              : statusConfirm.action === 'to-warehouse'
                ? `Move order "${statusConfirm.order.no}" to Warehouse?`
                : statusConfirm.action === 'to-entrance'
                  ? `Move order "${statusConfirm.order.no}" back to Entrance?`
                  : statusConfirm.action === 'to-waiting-parts'
                    ? `Put order "${statusConfirm.order.no}" on hold until the spare part arrives? It will appear under Waiting for spare parts.`
                    : statusConfirm.action === 'from-waiting-parts'
                      ? `Move order "${statusConfirm.order.no}" back to Maintenance now that the part is available?`
                      : `Mark order "${statusConfirm.order.no}" as Delivered?`
            : ''
        }
        confirmLabel="Yes"
        cancelLabel="No"
        isLoading={statusLoading}
        error={statusError}
      />
    </div>
  );
}
