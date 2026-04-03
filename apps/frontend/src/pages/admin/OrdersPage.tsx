import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Wrench,
  FileText,
  FileSpreadsheet,
  Plus,
  Minus,
  X,
  Upload,
  DoorOpen,
  Package,
  Truck,
  Clock,
  Hammer,
  Cpu,
  ClipboardList,
  Sparkles,
  Layers,
  CircleDot,
  ScanLine,
  FlaskConical,
  Cog,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
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
  getOrdersColumns,
} from './orders';
import { OrderExpandedRow } from './orders/OrderExpandedRow';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { SUPER_ADMIN_SLUG } from '../../constants/adminPages';
import { deleteOrder, getOrders, updateOrder, getOrderById, type OrderBudgetLine, OrderWorkflow } from '../../api/orders';
import { getOrderProgressStagesPublic, type OrderProgressStage } from '../../api/orderProgressStages';
import { getServicesSpareParts, canAddCatalogItemToBudget, type ServiceSparePartItem } from '../../api/servicesSpareParts';
import { getSpareServerCatalog, type SpareServerRow } from '../../api/spareServer';
import { uploadImage } from '../../api/uploads';
import noImageUrl from '../../assets/images/noimage.png';
import {
  MAX_ORDER_PHOTOS_PER_SIDE,
  newLocalPhotoId,
  normalizeOrderPhotoListFromApi,
  type LocalOrderPhoto,
} from '../../utils/orderPhotos';

export type { Order };

const exportOptions = { title: 'Orders', filename: 'orders' };

/** One icon per tab index so stages that share a legacy area still look distinct. */
const STAGE_TAB_ICONS: LucideIcon[] = [
  DoorOpen,
  Wrench,
  Package,
  Truck,
  Clock,
  Hammer,
  Cpu,
  ClipboardList,
  Sparkles,
  Layers,
  CircleDot,
  ScanLine,
  FlaskConical,
  Cog,
  Settings2,
];

interface BudgetLineItem {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  amount: number;
  total: number;
}

export function OrdersPage() {
  const { token, user } = useAuth();
  const MAX_ORDER_PHOTO_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB)
  const ACCEPT_ORDER_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

  const [workflowView, setWorkflowView] = useState<OrderWorkflow>('standard');
  const [stages, setStages] = useState<OrderProgressStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [activeStageKey, setActiveStageKey] = useState<string>('');
  const filteredDataRef = useRef<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [moveConfirm, setMoveConfirm] = useState<{
    order: Order;
    toStageKey: string;
  } | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const [budgetOrder, setBudgetOrder] = useState<Order | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  // Tracks the budget quantities at the moment the modal was opened.
  // Used to enforce replacement stock limits while editing.
  const initialBudgetQtyRef = useRef<Map<string, number>>(new Map());
  const [servicesData, setServicesData] = useState<ServiceSparePartItem[]>([]);
  const [spareCatalogData, setSpareCatalogData] = useState<SpareServerRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [deliveryOrder, setDeliveryOrder] = useState<Order | null>(null);
  const [deliveryTargetStageKey, setDeliveryTargetStageKey] = useState<string>('');
  const [deliveryAdvance, setDeliveryAdvance] = useState<number>(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const [warehouseMoveOrder, setWarehouseMoveOrder] = useState<Order | null>(null);
  const [warehouseTargetStageKey, setWarehouseTargetStageKey] = useState<string>('');
  const [warehouseAfterItems, setWarehouseAfterItems] = useState<LocalOrderPhoto[]>([]);
  const [warehousePhotoError, setWarehousePhotoError] = useState<string | null>(null);
  const [warehouseSaving, setWarehouseSaving] = useState(false);
  const warehousePhotoInputRef = useRef<HTMLInputElement>(null);
  const warehouseAfterItemsRef = useRef(warehouseAfterItems);
  warehouseAfterItemsRef.current = warehouseAfterItems;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStagesLoading(true);
        const { stages: list } = await getOrderProgressStagesPublic(workflowView);
        if (!mounted) return;
        setStages(list);
        setActiveStageKey((prev) => (prev && list.some((s) => s.key === prev) ? prev : list[0]?.key ?? ''));
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setStages([]);
        setActiveStageKey('');
      } finally {
        if (mounted) setStagesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [workflowView]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { orders: list } = await getOrders(token, { limit: 200, workflow: workflowView });
        if (mounted) setOrders(list as unknown as Order[]);
      } catch (e) {
        console.error(e);
        if (mounted) setOrders([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, workflowView]);

  const dataByStage = useMemo(() => {
    if (!activeStageKey) return [];
    return orders.filter((o) => (o.progressStageKey ?? '') === activeStageKey);
  }, [activeStageKey, orders]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Order[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const refetchOrders = useCallback(async () => {
    try {
      const { orders: list } = await getOrders(token, { limit: 200, workflow: workflowView });
      setOrders(list as unknown as Order[]);
    } catch (e) {
      console.error(e);
    }
  }, [token, workflowView]);

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
    return servicesData.filter((s) => s.state !== 'inactive' && s.type === 'service');
  }, [servicesData, budgetOrder]);

  const servicesById = useMemo(() => {
    const m = new Map<string, ServiceSparePartItem>();
    for (const s of servicesData) m.set(s.id, s);
    return m;
  }, [servicesData]);

  const spareById = useMemo(() => {
    const m = new Map<string, SpareServerRow>();
    for (const p of spareCatalogData) m.set(p.id, p);
    return m;
  }, [spareCatalogData]);

  const getInitialBudgetQty = useCallback((serviceId: string) => {
    return initialBudgetQtyRef.current.get(serviceId) ?? 0;
  }, []);

  const getReplacementRemaining = useCallback(
    (serviceId: string, currentQty: number, catalogAmount: number) => {
      const initialQty = getInitialBudgetQty(serviceId);
      // catalogAmount is the currently free stock. Consumed while editing is (current - initial).
      const remaining = Number(catalogAmount ?? 0) - (Number(currentQty ?? 0) - Number(initialQty ?? 0));
      return remaining;
    },
    [getInitialBudgetQty]
  );

  const totalBudget = useMemo(
    () => budgetLines.reduce((sum, line) => sum + line.total, 0),
    [budgetLines]
  );

  const addToBudget = useCallback(
    (item: Pick<ServiceSparePartItem, 'id' | 'name' | 'price' | 'type' | 'amount'>, amount: number = 1) => {
      if (!canAddCatalogItemToBudget(item)) return;
      setBudgetLines((prev) => {
        const existing = prev.find((l) => l.serviceId === item.id);
        const currentQty = existing ? existing.amount : 0;

        if (item.type === 'replacement') {
          const remaining = getReplacementRemaining(item.id, currentQty, item.amount);
          const addNow = Math.max(0, Math.min(amount, Math.floor(remaining)));
          if (addNow <= 0) return prev;
          amount = addNow;
        }

        const total = item.price * amount;
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
    },
    [getReplacementRemaining]
  );

  const addSpareToBudget = useCallback(
    (row: SpareServerRow, amount: number = 1) => {
      const stock = row.stock ?? 0;
      if (stock <= 0) return;
      const price = Number(row.precio ?? 0);
      const name =
        row.description.trim() || row.productocodigo.trim() || `Spare (${row.productosid})`;
      setBudgetLines((prev) => {
        const existing = prev.find((l) => l.serviceId === row.id);
        const currentQty = existing ? existing.amount : 0;
        const remaining = getReplacementRemaining(row.id, currentQty, stock);
        const addNow = Math.max(0, Math.min(amount, Math.floor(remaining)));
        if (addNow <= 0) return prev;
        amount = addNow;
        const total = price * amount;
        if (existing) {
          const newAmount = existing.amount + amount;
          return prev.map((l) =>
            l.serviceId === row.id ? { ...l, amount: newAmount, total: l.price * newAmount } : l
          );
        }
        return [
          ...prev,
          {
            id: `budget-${row.id}-${Date.now()}`,
            serviceId: row.id,
            name,
            price,
            amount,
            total,
          },
        ];
      });
    },
    [getReplacementRemaining]
  );

  const updateBudgetAmount = useCallback((lineId: string, amount: number) => {
    setBudgetLines((prev) => {
      const line = prev.find((l) => l.id === lineId);
      if (!line) return prev;
      const service = servicesById.get(line.serviceId);
      const spare = spareById.get(line.serviceId);
      let nextAmount = amount;
      if (service?.type === 'replacement') {
        const initialQty = getInitialBudgetQty(line.serviceId);
        const max = Math.max(1, Math.floor(initialQty + Number(service.amount ?? 0)));
        nextAmount = Math.min(max, Math.max(1, Math.floor(nextAmount || 1)));
      } else if (spare) {
        const stock = spare.stock ?? 0;
        const initialQty = getInitialBudgetQty(line.serviceId);
        const max = Math.max(1, Math.floor(initialQty + stock));
        nextAmount = Math.min(max, Math.max(1, Math.floor(nextAmount || 1)));
      } else {
        nextAmount = Math.max(1, Math.floor(nextAmount || 1));
      }
      return prev.map((l) => (l.id === lineId ? { ...l, amount: nextAmount, total: l.price * nextAmount } : l));
    });
  }, [servicesById, spareById, getInitialBudgetQty]);

  const removeBudgetLine = useCallback((lineId: string) => {
    setBudgetLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const closeBudgetModal = useCallback(() => {
    if (budgetSaving) return;
    setBudgetOrder(null);
    setBudgetLines([]);
    setBudgetError(null);
    initialBudgetQtyRef.current = new Map();
  }, [budgetSaving]);

  const handleEditBudgetClick = useCallback(
    async (order: Order) => {
      if (!token) return;
      setBudgetError(null);
      setBudgetOrder(order);
      setCatalogLoading(true);
      try {
        const [orderResp, servicesResp, spareResp] = await Promise.all([
          getOrderById(token, order.id),
          servicesData.length ? Promise.resolve<{ items: ServiceSparePartItem[] }>({ items: servicesData }) : getServicesSpareParts(token),
          spareCatalogData.length ? Promise.resolve<{ items: SpareServerRow[] }>({ items: spareCatalogData }) : getSpareServerCatalog(token),
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
        initialBudgetQtyRef.current = new Map(lines.map((l) => [l.serviceId, l.amount]));
        if (!servicesData.length) setServicesData(servicesResp.items);
        if (!spareCatalogData.length) setSpareCatalogData(spareResp.items);
      } catch (e) {
        setBudgetError(e instanceof Error ? e.message : 'Failed to load budget details');
        setBudgetLines([]);
      } finally {
        setCatalogLoading(false);
      }
    },
    [token, servicesData, spareCatalogData]
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
      // Refresh catalog amounts (replacement stock may have changed).
      try {
        const [servicesRes, spareRes] = await Promise.all([
          getServicesSpareParts(token),
          getSpareServerCatalog(token),
        ]);
        setServicesData(servicesRes.items);
        setSpareCatalogData(spareRes.items);
      } catch {
        // Keep prior list if refresh fails.
      }
      setBudgetOrder(null);
      setBudgetLines([]);
    } catch (e) {
      setBudgetError(e instanceof Error ? e.message : 'Failed to save budget');
    } finally {
      setBudgetSaving(false);
    }
  }, [token, budgetOrder, budgetLines, refetchOrders]);

  const openWarehouseModal = useCallback(
    async (order: Order, toStageKey: string) => {
      setWarehouseTargetStageKey(toStageKey);
      setWarehousePhotoError(null);
      let items: LocalOrderPhoto[] = [];
      if (token) {
        try {
          const { order: detail } = await getOrderById(token, order.id);
          items = normalizeOrderPhotoListFromApi(detail.photoAfterRepair).map((url) => ({
            id: newLocalPhotoId(),
            displayUrl: url,
            remoteUrl: url,
          }));
        } catch {
          items = [];
        }
      }
      setWarehouseAfterItems(items);
      setWarehouseMoveOrder(order);
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
    setDeliveryTargetStageKey('');
    setDeliveryError(null);
  }, [deliverySaving]);

  const handleDeliverySave = useCallback(async () => {
    if (!token || !deliveryOrder) return;
    setDeliverySaving(true);
    setDeliveryError(null);
    const targetKey = deliveryTargetStageKey || '';
    const stage = stages.find((s) => s.key === targetKey);
    const legacyArea = stage?.legacyArea ?? 'delivery';
    const legacyState = stage?.legacyState ?? 'delivery';
    const shouldOpenWhatsappTab = legacyState !== deliveryOrder.state;
    const pendingWhatsappTab = shouldOpenWhatsappTab ? window.open('', '_blank') : null;
    try {
      const adv = Number.isFinite(deliveryAdvance) ? deliveryAdvance : 0;
      const resp = await updateOrder(token, deliveryOrder.id, {
        progressStageKey: targetKey,
        area: legacyArea,
        state: legacyState,
        advancement: adv,
      });
      if (shouldOpenWhatsappTab) openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
      await refetchOrders();
      setDeliveryOrder(null);
      setDeliveryAdvance(0);
      setDeliveryTargetStageKey('');
    } catch (e) {
      if (pendingWhatsappTab) pendingWhatsappTab.close();
      setDeliveryError(e instanceof Error ? e.message : 'Failed to move order');
    } finally {
      setDeliverySaving(false);
    }
  }, [token, deliveryOrder, deliveryTargetStageKey, stages, deliveryAdvance, refetchOrders, openWhatsappUpdate]);

  const handleMoveConfirm = useCallback(async () => {
    if (!token || !moveConfirm) return;
    const toStage = stages.find((s) => s.key === moveConfirm.toStageKey);
    if (!toStage) return;

    const shouldOpenWhatsappTab = toStage.legacyState !== moveConfirm.order.state;
    const pendingWhatsappTab = shouldOpenWhatsappTab ? window.open('', '_blank') : null;
    setMoveLoading(true);
    setMoveError(null);

    try {
      const resp = await updateOrder(token, moveConfirm.order.id, {
        progressStageKey: moveConfirm.toStageKey,
        area: toStage.legacyArea,
        state: toStage.legacyState,
      });
      if (shouldOpenWhatsappTab) openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
      await refetchOrders();
      setMoveConfirm(null);
    } catch (e) {
      if (pendingWhatsappTab) pendingWhatsappTab.close();
      setMoveError(e instanceof Error ? e.message : 'Failed to move order');
    } finally {
      setMoveLoading(false);
    }
  }, [token, moveConfirm, stages, refetchOrders, openWhatsappUpdate]);

  const handleMoveCancel = useCallback(() => {
    if (moveLoading) return;
    setMoveConfirm(null);
    setMoveError(null);
  }, [moveLoading]);

  const handleMoveToStage = useCallback(
    (order: Order, toStageKey: string) => {
      if (!token) return;
      const dest = stages.find((s) => s.key === toStageKey);
      if (!dest) return;

      if (dest.requiresAfterRepairPhoto) {
        openWarehouseModal(order, toStageKey);
        return;
      }

      if (dest.requiresDeliveryAdvance) {
        setDeliveryTargetStageKey(toStageKey);
        openDeliveryModal(order);
        return;
      }

      setMoveError(null);
      setMoveConfirm({ order, toStageKey });
    },
    [token, stages, openWarehouseModal, openDeliveryModal]
  );

  const closeWarehouseModal = useCallback(() => {
    if (warehouseSaving) return;
    for (const p of warehouseAfterItemsRef.current) {
      if (p.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
    }
    setWarehouseMoveOrder(null);
    setWarehouseTargetStageKey('');
    setWarehouseAfterItems([]);
    setWarehousePhotoError(null);
    if (warehousePhotoInputRef.current) warehousePhotoInputRef.current.value = '';
  }, [warehouseSaving]);

  const validateWarehouseImage = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image (JPEG, PNG, WebP or GIF).';
    }
    if (file.size > MAX_ORDER_PHOTO_BYTES) {
      return `Each image must be under ${(MAX_ORDER_PHOTO_BYTES / (1024 * 1024)).toFixed(0)}MB.`;
    }
    return null;
  }, [MAX_ORDER_PHOTO_BYTES]);

  const addWarehouseAfterFiles = useCallback(
    (files: FileList | File[]) => {
      setWarehousePhotoError(null);
      const list = Array.from(files);
      if (list.length === 0) return;
      setWarehouseAfterItems((prev) => {
        const room = MAX_ORDER_PHOTOS_PER_SIDE - prev.length;
        if (room <= 0) {
          setWarehousePhotoError(`You can add at most ${MAX_ORDER_PHOTOS_PER_SIDE} after-repair photos.`);
          return prev;
        }
        const toAdd = list.slice(0, room);
        const next: LocalOrderPhoto[] = [...prev];
        for (const file of toAdd) {
          const err = validateWarehouseImage(file);
          if (err) {
            setWarehousePhotoError(err);
            return prev;
          }
          const url = URL.createObjectURL(file);
          next.push({ id: newLocalPhotoId(), displayUrl: url, file });
        }
        return next;
      });
    },
    [validateWarehouseImage]
  );

  const removeWarehouseAfterPhoto = useCallback((id: string) => {
    setWarehouseAfterItems((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p?.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
      return prev.filter((x) => x.id !== id);
    });
    setWarehousePhotoError(null);
  }, []);

  const handleWarehouseMove = useCallback(async () => {
    if (!token || !warehouseMoveOrder) return;
    const stage = stages.find((s) => s.key === warehouseTargetStageKey);
    const legacyArea = stage?.legacyArea ?? 'warehouse';
    const legacyState = stage?.legacyState ?? 'warehouse';
    const shouldOpenWhatsappTab = legacyState !== warehouseMoveOrder.state;
    const pendingWhatsappTab = shouldOpenWhatsappTab ? window.open('', '_blank') : null;
    setWarehouseSaving(true);
    setWarehousePhotoError(null);
    try {
      const photoUrls: string[] = [];
      for (const p of warehouseAfterItems) {
        if (p.file) {
          const { url } = await uploadImage(token, p.file, 'order-after');
          photoUrls.push(url);
          if (p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
        } else if (p.remoteUrl) {
          photoUrls.push(p.remoteUrl);
        }
      }

      if (photoUrls.length === 0) {
        setWarehousePhotoError('After-repair photo is required when moving to warehouse.');
        return;
      }
      const resp = await updateOrder(token, warehouseMoveOrder.id, {
        progressStageKey: warehouseTargetStageKey,
        area: legacyArea,
        state: legacyState,
        photoAfterRepair: photoUrls,
      });
      if (shouldOpenWhatsappTab) openWhatsappUpdate(resp.whatsappLink, pendingWhatsappTab);
      await refetchOrders();
      setWarehouseMoveOrder(null);
      setWarehouseTargetStageKey('');
      setWarehouseAfterItems([]);
      setWarehousePhotoError(null);
      if (warehousePhotoInputRef.current) warehousePhotoInputRef.current.value = '';
    } catch (e) {
      if (pendingWhatsappTab) pendingWhatsappTab.close();
      setWarehousePhotoError(e instanceof Error ? e.message : 'Failed to move order');
    } finally {
      setWarehouseSaving(false);
    }
  }, [token, warehouseMoveOrder, warehouseTargetStageKey, warehouseAfterItems, stages, refetchOrders, openWhatsappUpdate]);

  const sortedStagesForTabs = useMemo(
    () => [...stages].sort((a, b) => a.sortOrder - b.sortOrder),
    [stages]
  );

  const tableColumns = useMemo(
    () =>
      getOrdersColumns(handleDeleteClick, deleteLoading, {
        stages,
        onMoveToStage: handleMoveToStage,
        onEditBudgetClick: handleEditBudgetClick,
        hideStateColumn: stages.length > 0,
      }),
    [
      handleDeleteClick,
      deleteLoading,
      stages,
      handleMoveToStage,
      handleEditBudgetClick,
    ]
  );

  const exportPDF = () => exportTableToPDF(tableColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(tableColumns, filteredDataRef.current, exportOptions);

  const deliveryTotal = deliveryOrder?.total ?? 0;
  const effectiveAdvance = Number.isFinite(deliveryAdvance) ? deliveryAdvance : 0;
  const deliveryDebt = Math.max(0, deliveryTotal - effectiveAdvance);

  const servicesColumns: TableColumn<ServiceSparePartItem>[] = useMemo(
    () => [
      { id: 'name', name: 'Code', width: '140px', selector: (r) => r.name, sortable: true },
      { id: 'details', name: 'Detail', maxWidth: "420px", selector: (r) => r.details, sortable: true },
      { id: 'price', name: 'Price', width: '100px', selector: (r) => r.price, sortable: true, format: (r) => r.price.toFixed(2) },
      {
        id: 'add',
        name: '',
        width: '60px',
        cell: (row) => {
          const currentQty = budgetLines.find((l) => l.serviceId === row.id)?.amount ?? 0;
          const remaining =
            row.type === 'replacement' ? getReplacementRemaining(row.id, currentQty, row.amount) : Number.POSITIVE_INFINITY;
          const addable = canAddCatalogItemToBudget(row) && (row.type !== 'replacement' || remaining > 0);
          return (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-0 p-1.5"
              disabled={!addable}
              title={addable ? undefined : 'Not enough stock to add'}
              onClick={() => addToBudget(row)}
              aria-label={addable ? `Add ${row.name}` : `Cannot add ${row.name} — not enough stock`}
            >
              <Plus className="w-5 h-5 font-bold" />
            </Button>
          );
        },
        ignoreRowClick: true,
      },
    ],
    [addToBudget, budgetLines, getReplacementRemaining]
  );

  const spareColumns: TableColumn<SpareServerRow>[] = useMemo(
    () => [
      {
        id: 'productocodigo',
        name: 'Code',
        width: '140px',
        selector: (r) => r.productocodigo,
        sortable: true,
        cell: (r) => (
          <span className="text-slate-700 dark:text-slate-300">{r.productocodigo || '—'}</span>
        ),
      },
      {
        id: 'description',
        name: 'Description',
        minWidth: '280px',
        selector: (r) => r.description,
        sortable: true,
        cell: (r) => (
          <span
            className="block min-w-0 max-w-md truncate text-slate-700 dark:text-slate-300 text-sm"
            title={r.description?.trim() ? r.description : undefined}
          >
            {r.description || '—'}
          </span>
        ),
      },
      {
        id: 'precio',
        name: 'Price',
        selector: (r) => r.precio ?? 0,
        sortable: true,
        width: '84px',
        right: true,
        cell: (r) => (
          <span className="tabular-nums text-sm text-slate-700 dark:text-slate-300">
            {r.precio != null ? r.precio.toFixed(2) : '—'}
          </span>
        ),
      },
      {
        id: 'stock',
        name: 'Stock',
        selector: (r) => r.stock ?? 0,
        sortable: true,
        width: '84px',
        right: true,
        cell: (r) => (
          <span className="tabular-nums text-sm text-slate-700 dark:text-slate-300">
            {r.stock != null ? String(r.stock) : '—'}
          </span>
        ),
      },
      {
        id: 'add',
        name: '',
        width: '60px',
        cell: (row) => {
          const stock = row.stock ?? 0;
          const currentQty = budgetLines.find((l) => l.serviceId === row.id)?.amount ?? 0;
          const remaining = getReplacementRemaining(row.id, currentQty, stock);
          const addable = stock > 0 && remaining > 0;
          const label = row.description.trim() || row.productocodigo || `Spare (${row.productosid})`;
          return (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-0 p-1.5"
              disabled={!addable}
              title={addable ? undefined : 'Not enough stock to add'}
              onClick={() => addSpareToBudget(row)}
              aria-label={addable ? `Add ${label}` : `Cannot add ${label} — not enough stock`}
            >
              <Plus className="w-5 h-5 font-bold" />
            </Button>
          );
        },
        ignoreRowClick: true,
      },
    ],
    [addSpareToBudget, budgetLines, getReplacementRemaining]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Orders - DIGITALSERVER TECHNICAL SERVICE"
          breadcrumb={[{ label: 'Operations', icon: Home }, { label: 'Orders' }]}
        />
        <div className="flex flex-col items-stretch sm:flex-row sm:items-center gap-2">
          <ButtonGroup className="sm:mr-auto">
            <Button
              type="button"
              variant={workflowView === 'standard' ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setWorkflowView('standard')}
            >
              Standard repair
            </Button>
            <Button
              type="button"
              variant={workflowView === 'warranty' ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setWorkflowView('warranty')}
            >
              Warranty
            </Button>
          </ButtonGroup>
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
          {user?.role?.slug === SUPER_ADMIN_SLUG && (
            <Link to="/admin/order/stages">
              <Button variant="secondary" size="md" className="sm:ml-2" leftIcon={FileText}>
                Manage stages
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex w-full gap-1 border-b border-slate-200 dark:border-slate-700">
        {stagesLoading && (
          <div className="flex-1 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Loading stages…</div>
        )}
        {!stagesLoading &&
          sortedStagesForTabs.map((s, index) => {
            const Icon = STAGE_TAB_ICONS[index % STAGE_TAB_ICONS.length];
            const isActive = activeStageKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveStageKey(s.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
      </div>

      <Card className="overflow-hidden">
        <DataTableWithToolbar<Order>
          data={dataByStage}
          columns={tableColumns}
          searchFields={['no', 'code', 'customer', 'technical', 'equipment', 'series', 'type']}
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
              Upload one or more after-repair / fixed photos before moving this order to the warehouse.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {warehouseAfterItems.map((p) => (
                <div key={p.id} className="relative shrink-0">
                  <img
                    src={p.displayUrl}
                    alt=""
                    width={120}
                    height={120}
                    className="size-[120px] rounded-lg object-cover border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeWarehouseAfterPhoto(p.id)}
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                    title="Remove photo"
                    aria-label="Remove after-repair photo"
                    disabled={warehouseSaving}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {warehouseAfterItems.length === 0 && (
                <img
                  src={noImageUrl}
                  alt=""
                  width={120}
                  height={120}
                  className="size-[120px] rounded-lg object-cover border-2 border-dashed border-slate-200 dark:border-slate-600 opacity-70"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={warehousePhotoInputRef}
                type="file"
                accept={ACCEPT_ORDER_IMAGES}
                multiple
                className="hidden"
                disabled={warehouseSaving}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) addWarehouseAfterFiles(files);
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
                Add after-repair photos
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
        title={budgetOrder ? `Edit budget — ${budgetOrder.no}` : 'Edit budget'}
        size="2xl"
        headerActions={
          <>
            <Button type="button" variant="red" size="md" onClick={closeBudgetModal} disabled={budgetSaving}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="md" onClick={handleBudgetSave} isLoading={budgetSaving}>
              Keep
            </Button>
          </>
        }
      >
        {budgetError && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {budgetError}
          </div>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Services</h3>
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
                  catalogLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                      <Loader size="md" />
                      <span className="text-sm">Loading…</span>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No services found.
                    </div>
                  )
                }
              />
            </div>
          </Card>

          <Card className="min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Spare parts</h3>
            </div>
            <div className="p-0 flex-1 min-h-0">
              <DataTableWithToolbar<SpareServerRow>
                data={spareCatalogData}
                columns={spareColumns}
                searchFields={['description', 'productocodigo']}
                searchPlaceholder="Search:"
                pageSizeOptions={[10, 25, 50]}
                defaultPageSize={10}
                noDataComponent={
                  catalogLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                      <Loader size="md" />
                      <span className="text-sm">Loading…</span>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                      No spare parts found.
                    </div>
                  )
                }
              />
            </div>
          </Card>

          <Card className="min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Budget Details</h3>
            </div>
            <div className="p-0 flex-1 min-h-0">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-h-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Item</th>
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
                          No items. Add from Services or Spare parts.
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
        open={!!moveConfirm}
        onClose={handleMoveCancel}
        onConfirm={handleMoveConfirm}
        title="Move order"
        message={
          moveConfirm
            ? `Move order "${moveConfirm.order.no}" to "${stages.find((s) => s.key === moveConfirm.toStageKey)?.label ?? moveConfirm.toStageKey
            }"?`
            : ''
        }
        confirmLabel="Yes"
        cancelLabel="No"
        isLoading={moveLoading}
        error={moveError}
      />
    </div>
  );
}
