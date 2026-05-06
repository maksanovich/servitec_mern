import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Home,
  Building2,
  User,
  Tag,
  Package,
  Cpu,
  Hash,
  BarChart3,
  FileText,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  SearchableSelect,
  DatePicker,
  Loader,
  Modal,
  RichTextEditor,
} from '../../components/ui';
import { htmlToPlainText } from '../../utils/htmlPlainText';
import {
  MAX_ORDER_PHOTOS_PER_SIDE,
  newLocalPhotoId,
  normalizeOrderPhotoListFromApi,
  type LocalOrderPhoto,
} from '../../utils/orderPhotos';
import { discountAmountForSubtotal, totalAfterDiscount, type DiscountType } from '../../utils/orderDiscount';
import { DataTableWithToolbar } from '../../components/datatable';
import type { TableColumn } from 'react-data-table-component';
import type { SelectOption } from '../../components/ui';
import type { ServiceSparePartItem } from '../../api/servicesSpareParts';
import { getSpareServerCatalog, type SpareServerRow } from '../../api/spareServer';
import {
  collectSpareTarifaIdsFromCatalog,
  recalculateSpareBudgetLines,
  spareRowHasTarifaId,
  spareUnitPriceInclVat,
} from '../../utils/spareTariffPrice';
import { useAuth } from '../../contexts/AuthContext';
import { getClients } from '../../api/clients';
import { createBrand, getBrands } from '../../api/brands';
import { createModel, getModels } from '../../api/models';
import { getAccessories, type Accessory } from '../../api/accessories';
import { getServicesSpareParts, canAddCatalogItemToBudget } from '../../api/servicesSpareParts';
import { createProduct as createCatalogProduct, getProducts } from '../../api/products';
import { getAssignableTechnicians, type User as ApiUser } from '../../api/users';
import { createOrder, CreateOrderError, getOrderById, updateOrder } from '../../api/orders';
import { uploadImage } from '../../api/uploads';
import noImageUrl from '../../assets/images/noimage.png';

const MAX_ORDER_PHOTO_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB)
const ACCEPT_ORDER_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

const AREA_OPTIONS: SelectOption[] = [
  { value: 'entrance', label: 'Zona de ingreso' },
  { value: 'maintenance', label: 'Zona de mantenimiento' },
];

const STATE_AREA_OPTIONS: SelectOption[] = [
  { value: 'income', label: 'Ingreso' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

function isTechnicianUser(u: ApiUser) {
  const slug = (u.role?.slug ?? '').toLowerCase();
  const name = (u.role?.name ?? '').toLowerCase();
  // Be defensive: accept common variants.
  return slug === 'technician' || slug.includes('tech') || name.includes('technician') || name.includes('tech');
}

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const YES_NO_OPTIONS: SelectOption[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Sí' },
];

export interface BudgetLineItem {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  amount: number;
  total: number;
}

function labelClass(required?: boolean) {
  return `block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ${required ? '' : ''}`;
}

function wrapWithIcon(Icon: typeof Building2, children: React.ReactNode) {
  return (
    <div className="relative w-full">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      <div className="[&>*]:pl-10">{children}</div>
    </div>
  );
}

export function NewOrderPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);
  const [clientTarifasById, setClientTarifasById] = useState<Record<number, number>>({});
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [allModels, setAllModels] = useState<Array<{ brand: string; model: string }>>([]);
  const [accessoriesData, setAccessoriesData] = useState<Accessory[]>([]);
  const [servicesData, setServicesData] = useState<ServiceSparePartItem[]>([]);
  const [spareCatalogData, setSpareCatalogData] = useState<SpareServerRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [technicianOptions, setTechnicianOptions] = useState<SelectOption[]>([]);
  const [submitError, setSubmitError] = useState<{ text: string; contactClientId?: number } | null>(null);

  const [customer, setCustomer] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('');
  const [product, setProduct] = useState('');
  const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [area, setArea] = useState('entrance');
  const [stateArea, setStateArea] = useState('income');
  const [technician, setTechnician] = useState('');
  const [priority, setPriority] = useState('normal');
  const [equipmentCondition, setEquipmentCondition] = useState('');
  const [technicalReport, setTechnicalReport] = useState('');
  const [diagnosis, setDiagnosis] = useState('no');
  const [warranty, setWarranty] = useState('no');
  const [fianceeDate, setFianceeDate] = useState('');
  const [advancement, setAdvancement] = useState('');
  const [accessories, setAccessories] = useState<Record<string, boolean>>({});
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState('0');
  // Tracks the budget quantities at the moment this page loaded (edit mode) so we can enforce
  // replacement stock limits while editing.
  const initialBudgetQtyRef = useRef<Map<string, number>>(new Map());
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddBrandLoading, setQuickAddBrandLoading] = useState(false);
  const [quickAddModelLoading, setQuickAddModelLoading] = useState(false);
  const [quickAddProductLoading, setQuickAddProductLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'brand' | 'model' | 'product' | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  /** Repuesto list price column + spare budget lines use this Perseo tariff id. */
  const [spareCatalogTarifaId, setSpareCatalogTarifaId] = useState(0);
  const [serviceSparePanelOpen, setServiceSparePanelOpen] = useState(true);

  const [beforePhotos, setBeforePhotos] = useState<LocalOrderPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<LocalOrderPhoto[]>([]);
  const [photoBeforeError, setPhotoBeforeError] = useState<string | null>(null);
  const [photoAfterError, setPhotoAfterError] = useState<string | null>(null);
  const photoBeforeInputRef = useRef<HTMLInputElement>(null);
  const photoAfterInputRef = useRef<HTMLInputElement>(null);
  const beforePhotosRef = useRef(beforePhotos);
  const afterPhotosRef = useRef(afterPhotos);
  beforePhotosRef.current = beforePhotos;
  afterPhotosRef.current = afterPhotos;
  const showAfterRepairPhotoSection = isEditMode && (area === 'warehouse' || stateArea === 'warehouse');

  useEffect(() => {
    return () => {
      for (const p of beforePhotosRef.current) {
        if (p.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
      }
      for (const p of afterPhotosRef.current) {
        if (p.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const orderPromise = isEditMode && id ? getOrderById(token, id) : Promise.resolve(null);
        const [clientsRes, brandsRes, modelsRes, accessoriesRes, usersRes, orderRes] = await Promise.allSettled([
          getClients(token, { page: 1, limit: 100 }),
          getBrands(token),
          getModels(token),
          getAccessories(token),
          getAssignableTechnicians(token),
          orderPromise,
        ]);

        if (!mounted) return;

        const clientsResp = clientsRes.status === 'fulfilled' ? clientsRes.value : { clients: [] };
        const nextTarifas: Record<number, number> = {};
        for (const c of clientsResp.clients) {
          const tid = typeof c.tarifasid === 'number' && !Number.isNaN(c.tarifasid) ? c.tarifasid : 0;
          nextTarifas[c.clientesid] = tid;
        }
        setClientTarifasById(nextTarifas);
        setCustomerOptions(
          clientsResp.clients
            .filter((c) => c.estado !== false)
            .map((c) => {
              const baseLabel = c.razonsocial || c.nombrecomercial || String(c.clientesid);
              const idLabel = String(c.identificacion ?? '').trim();
              const label = idLabel ? `${baseLabel} — ${idLabel}` : baseLabel;
              const searchText = [
                c.razonsocial,
                c.nombrecomercial,
                c.identificacion,
                c.tipoidentificacion,
                c.email,
                c.telefono1,
                c.telefono2,
                c.telefono3,
                c.direccion,
                c.ciudad,
                c.provincia,
                c.clientescodigo,
              ]
                .filter(Boolean)
                .join(' ');
              return { value: String(c.clientesid), label, searchText };
            })
        );

        const brands = brandsRes.status === 'fulfilled' ? brandsRes.value.brands : [];
        setBrandOptions(
          brands
            .filter((b) => b.state !== 'inactive')
            .map((b) => ({ value: b.name, label: b.name }))
        );

        const models = modelsRes.status === 'fulfilled' ? modelsRes.value.models : [];
        setAllModels(
          models
            .filter((m) => m.state !== 'inactive')
            .map((m) => ({
              brand: String(m.brand ?? '').trim(),
              model: String(m.model ?? '').trim(),
            }))
            .filter((m) => m.brand && m.model)
        );

        const accessories = accessoriesRes.status === 'fulfilled' ? accessoriesRes.value.accessories : [];
        setAccessoriesData(accessories.filter((a) => a.state !== 'inactive'));

        const users = usersRes.status === 'fulfilled' ? usersRes.value.users : [];
        const activeUsers = (users ?? []).filter((u) => u.state !== 'inactive');
        const technicians = activeUsers.filter(isTechnicianUser);
        const list = (technicians.length ? technicians : activeUsers)
          .map((u) => {
            const baseLabel = (u.name || u.email || u.id).trim();
            const idLabel = String(u.identification ?? '').trim();
            const label = idLabel ? `${baseLabel} (${idLabel})` : baseLabel;
            return { value: u.id, label };
          })
          .sort((a, b) => a.label.localeCompare(b.label));

        setTechnicianOptions(list);

        // Prefill form when editing an existing order.
        const orderResp = orderRes.status === 'fulfilled' ? orderRes.value : null;
        if (orderResp?.order) {
          const o = orderResp.order;
          setCustomer(String(o.clientId ?? ''));
          setBrand(o.brand ?? '');
          setModel(o.model ?? '');
          setSeries(o.series ?? '');
          setProduct(o.type ?? '');
          setArea(o.area ?? 'entrance');
          setStateArea(o.state ?? 'income');
          setTechnician(o.technicianId ?? '');
          setPriority(o.priority ?? 'normal');
          setEquipmentCondition(o.equipmentCondition ?? '');
          setTechnicalReport(o.technicalReport ?? '');
          setDiagnosis(o.diagnosis ? 'yes' : 'no');
          setWarranty(o.warranty ? 'yes' : 'no');
          setFianceeDate(o.fianceeDate ?? '');
          setAdvancement(String(o.advancement ?? 0));
          setDiscountType((o.discountType as DiscountType) ?? 'none');
          setDiscountValue(String(o.discountValue ?? 0));

          const acc: Record<string, boolean> = {};
          for (const artifact of o.accessories ?? []) acc[String(artifact)] = true;
          setAccessories(acc);

          const initialBudgetLines: BudgetLineItem[] = (o.budgetLines ?? []).map((l, idx) => ({
            id: `budget-${l.serviceId}-${idx}`,
            serviceId: l.serviceId,
            name: l.name,
            price: l.price,
            amount: l.amount,
            total: l.total,
          }));
          setBudgetLines(initialBudgetLines);
          initialBudgetQtyRef.current = new Map(initialBudgetLines.map((l) => [l.serviceId, l.amount]));

          setBeforePhotos(
            normalizeOrderPhotoListFromApi(o.photoBeforeRepair as string | string[] | undefined).map((url) => ({
              id: newLocalPhotoId(),
              displayUrl: url,
              remoteUrl: url,
            }))
          );
          setAfterPhotos(
            normalizeOrderPhotoListFromApi(o.photoAfterRepair as string | string[] | undefined).map((url) => ({
              id: newLocalPhotoId(),
              displayUrl: url,
              remoteUrl: url,
            }))
          );
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setCustomerOptions([]);
          setBrandOptions([]);
          setAllModels([]);
          setAccessoriesData([]);
          setTechnicianOptions([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, id]);

  useEffect(() => {
    // If no technician selected yet, default to first available option.
    if (technician) return;
    if (technicianOptions.length === 0) return;
    setTechnician(technicianOptions[0].value);
  }, [technician, technicianOptions]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      setProductsLoading(true);
      try {
        const { products } = await getProducts(token, { state: 'active' });
        if (!mounted) return;

        setProductOptions(products.map((p) => ({ value: p.product, label: p.product })));
        setProduct((prev) => {
          const trimmed = prev.trim();
          const hasSelected = products.some((p) => p.product === trimmed);
          if (hasSelected) return trimmed;
          if (!trimmed || !isEditMode) return products[0]?.product ?? '';
          return trimmed; // preserve in edit mode (so existing orders still show the current value)
        });
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setProductOptions([]);
        if (!isEditMode) setProduct('');
      } finally {
        if (mounted) setProductsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, isEditMode]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const q = customerQuery.trim();

    const t = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const clientsResp = await getClients(token, {
          page: 1,
          limit: q ? 50 : 100,
          search: q ? q : undefined,
        });

        if (!mounted) return;
        setCustomerOptions(
          clientsResp.clients
            .filter((c) => c.estado !== false)
            .map((c) => {
              const baseLabel = c.razonsocial || c.nombrecomercial || String(c.clientesid);
              const idLabel = String(c.identificacion ?? '').trim();
              const label = idLabel ? `${baseLabel} (${idLabel})` : baseLabel;
              const searchText = [
                c.razonsocial,
                c.nombrecomercial,
                c.identificacion,
                c.tipoidentificacion,
                c.email,
                c.telefono1,
                c.telefono2,
                c.telefono3,
                c.direccion,
                c.ciudad,
                c.provincia,
                c.clientescodigo,
              ]
                .filter(Boolean)
                .join(' ');
              return { value: String(c.clientesid), label, searchText };
            })
        );
      } catch (e) {
        console.error(e);
        if (mounted) setCustomerOptions([]);
      } finally {
        if (mounted) setCustomerLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [customerQuery, token]);

  const normalizeKey = useCallback((s: string) => s.trim().toLowerCase(), []);

  const modelOptions: SelectOption[] = useMemo(() => {
    const brandKey = normalizeKey(brand);
    const filtered = brandKey
      ? allModels.filter((m) => normalizeKey(m.brand) === brandKey)
      : allModels;

    const unique = new Map<string, string>();
    for (const m of filtered) {
      const label = m.model;
      const key = normalizeKey(label);
      if (!unique.has(key)) unique.set(key, label);
    }

    return Array.from(unique.values())
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));
  }, [allModels, brand, normalizeKey]);

  const accessoryOptions = useMemo(() => {
    const filtered = accessoriesData;
    const unique = new Map<string, string>();
    for (const a of filtered) {
      const key = a.artifact;
      if (!unique.has(key)) unique.set(key, key);
    }
    return Array.from(unique.values()).sort().map((label) => ({ id: label, label }));
  }, [accessoriesData]);

  const effectiveProductOptions = useMemo(() => {
    const trimmed = product.trim();
    if (!trimmed) return productOptions;
    if (productOptions.some((o) => o.value === trimmed)) return productOptions;
    if (!isEditMode) return productOptions;
    // Keep the current order value selected even if it is not active anymore.
    return [{ value: trimmed, label: trimmed }, ...productOptions];
  }, [product, productOptions, isEditMode]);

  const availableServices = useMemo(() => {
    return servicesData.filter((s) => s.state !== 'inactive' && s.type === 'service');
  }, [servicesData]);

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

  const clientTarifasid = useMemo(() => {
    const id = Number(customer);
    if (!id || Number.isNaN(id)) return 0;
    const t = clientTarifasById[id];
    return typeof t === 'number' && !Number.isNaN(t) ? t : 0;
  }, [customer, clientTarifasById]);

  const spareTarifaSelectOptions = useMemo((): SelectOption[] => {
    return collectSpareTarifaIdsFromCatalog(spareCatalogData).map((id) => ({
      value: String(id),
      label: `Tarifa ${id}`,
    }));
  }, [spareCatalogData]);

  useEffect(() => {
    if (spareTarifaSelectOptions.length === 0) {
      setSpareCatalogTarifaId(0);
      return;
    }
    const ids = spareTarifaSelectOptions.map((o) => Number(o.value));
    const preferred =
      clientTarifasid > 0 && ids.includes(clientTarifasid) ? clientTarifasid : ids[0];
    setSpareCatalogTarifaId(preferred);
  }, [spareTarifaSelectOptions, clientTarifasid]);

  const filteredSpareCatalog = useMemo(() => {
    return spareCatalogData.filter((r) => spareRowHasTarifaId(r, spareCatalogTarifaId));
  }, [spareCatalogData, spareCatalogTarifaId]);

  useEffect(() => {
    setBudgetLines((prev) => recalculateSpareBudgetLines(prev, spareById, spareCatalogTarifaId));
  }, [spareCatalogTarifaId, spareById, budgetLines.length]);

  const getInitialBudgetQty = useCallback((serviceId: string) => {
    return initialBudgetQtyRef.current.get(serviceId) ?? 0;
  }, []);

  const getReplacementRemaining = useCallback(
    (serviceId: string, currentQty: number, catalogAmount: number) => {
      const initialQty = getInitialBudgetQty(serviceId);
      return Number(catalogAmount ?? 0) - (Number(currentQty ?? 0) - Number(initialQty ?? 0));
    },
    [getInitialBudgetQty]
  );

  useEffect(() => {
    // reset model selection if brand changes and selected model isn't valid anymore
    if (!model) return;
    if (!allModels.length) return;
    const stillValid = allModels.some((m) => m.model === model && (!brand || m.brand === brand));
    if (!stillValid) setModel('');
  }, [brand, model, allModels]);

  const subtotalBudget = useMemo(
    () => budgetLines.reduce((sum, line) => sum + line.total, 0),
    [budgetLines]
  );
  const discountValueNum = useMemo(() => {
    const n = Number(discountValue);
    return Number.isFinite(n) ? n : 0;
  }, [discountValue]);
  const discountAmount = useMemo(
    () => discountAmountForSubtotal(subtotalBudget, discountType, discountValueNum),
    [subtotalBudget, discountType, discountValueNum]
  );
  const totalBudget = useMemo(
    () => totalAfterDiscount(subtotalBudget, discountType, discountValueNum),
    [subtotalBudget, discountType, discountValueNum]
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
            l.serviceId === item.id
              ? { ...l, amount: newAmount, total: l.price * newAmount }
              : l
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
      const price = spareUnitPriceInclVat(row, spareCatalogTarifaId);
      const name =
        row.description.trim() || row.productocodigo.trim() || `Repuesto (${row.productosid})`;
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
    [getReplacementRemaining, spareCatalogTarifaId]
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

  const toggleAccessory = (id: string) => {
    setAccessories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const validateImageFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Seleccione una imagen (JPEG, PNG, WebP o GIF).';
    }
    if (file.size > MAX_ORDER_PHOTO_BYTES) {
      return `Cada imagen debe pesar menos de ${(MAX_ORDER_PHOTO_BYTES / (1024 * 1024)).toFixed(0)} MB.`;
    }
    return null;
  }, []);

  const addBeforePhotoFiles = useCallback(
    (files: FileList | File[]) => {
      setPhotoBeforeError(null);
      const list = Array.from(files);
      if (list.length === 0) return;
      setBeforePhotos((prev) => {
        const room = MAX_ORDER_PHOTOS_PER_SIDE - prev.length;
        if (room <= 0) {
          setPhotoBeforeError(`Puede añadir como máximo ${MAX_ORDER_PHOTOS_PER_SIDE} fotos previas a la reparación.`);
          return prev;
        }
        const toAdd = list.slice(0, room);
        const next: LocalOrderPhoto[] = [...prev];
        for (const file of toAdd) {
          const err = validateImageFile(file);
          if (err) {
            setPhotoBeforeError(err);
            return prev;
          }
          const url = URL.createObjectURL(file);
          next.push({ id: newLocalPhotoId(), displayUrl: url, file });
        }
        return next;
      });
    },
    [validateImageFile]
  );

  const addAfterPhotoFiles = useCallback(
    (files: FileList | File[]) => {
      setPhotoAfterError(null);
      const list = Array.from(files);
      if (list.length === 0) return;
      setAfterPhotos((prev) => {
        const room = MAX_ORDER_PHOTOS_PER_SIDE - prev.length;
        if (room <= 0) {
          setPhotoAfterError(`Puede añadir como máximo ${MAX_ORDER_PHOTOS_PER_SIDE} fotos posteriores a la reparación.`);
          return prev;
        }
        const toAdd = list.slice(0, room);
        const next: LocalOrderPhoto[] = [...prev];
        for (const file of toAdd) {
          const err = validateImageFile(file);
          if (err) {
            setPhotoAfterError(err);
            return prev;
          }
          const url = URL.createObjectURL(file);
          next.push({ id: newLocalPhotoId(), displayUrl: url, file });
        }
        return next;
      });
    },
    [validateImageFile]
  );

  const removeBeforePhoto = useCallback((id: string) => {
    setBeforePhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p?.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
      return prev.filter((x) => x.id !== id);
    });
    setPhotoBeforeError(null);
  }, []);

  const removeAfterPhoto = useCallback((id: string) => {
    setAfterPhotos((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p?.file && p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
      return prev.filter((x) => x.id !== id);
    });
    setPhotoAfterError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (!token) {
        setSubmitError({ text: 'No autenticado.' });
        return;
      }

      const photoBeforeUrls: string[] = [];
      for (const p of beforePhotos) {
        if (p.file) {
          const { url } = await uploadImage(token, p.file, 'order-before');
          photoBeforeUrls.push(url);
          if (p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
        } else if (p.remoteUrl) {
          photoBeforeUrls.push(p.remoteUrl);
        }
      }
      setBeforePhotos(
        photoBeforeUrls.map((url) => ({
          id: newLocalPhotoId(),
          displayUrl: url,
          remoteUrl: url,
        }))
      );

      const photoAfterUrls: string[] = [];
      for (const p of afterPhotos) {
        if (p.file) {
          const { url } = await uploadImage(token, p.file, 'order-after');
          photoAfterUrls.push(url);
          if (p.displayUrl.startsWith('blob:')) URL.revokeObjectURL(p.displayUrl);
        } else if (p.remoteUrl) {
          photoAfterUrls.push(p.remoteUrl);
        }
      }
      setAfterPhotos(
        photoAfterUrls.map((url) => ({
          id: newLocalPhotoId(),
          displayUrl: url,
          remoteUrl: url,
        }))
      );

      const payload = {
        clientId: parseInt(customer, 10),
        brand,
        model,
        series,
        type: product,
        area: area as any,
        state: stateArea as any,
        technician,
        priority: priority as any,
        equipmentCondition,
        technicalReport,
        diagnosis,
        warranty,
        fianceeDate,
        advancement: advancement === '' ? 0 : Number(advancement),
        accessories: Object.entries(accessories)
          .filter(([, v]) => v)
          .map(([k]) => k),
        budgetLines: budgetLines.map((l) => ({
          serviceId: l.serviceId,
          name: l.name,
          price: l.price,
          amount: l.amount,
          total: l.total,
        })),
        discountType,
        discountValue: discountType === 'none' ? 0 : discountValueNum,
        photoBeforeRepair: photoBeforeUrls,
        photoAfterRepair: photoAfterUrls,
      };

      if (!payload.clientId || Number.isNaN(payload.clientId)) throw new Error('El cliente es obligatorio');
      if (!payload.brand) throw new Error('La marca es obligatoria');
      if (!payload.model) throw new Error('El modelo es obligatorio');
      if (!payload.series) throw new Error('La serie es obligatoria');
      if (!payload.type) throw new Error('El producto es obligatorio');
      if (!htmlToPlainText(equipmentCondition)) {
        throw new Error('La avería y el estado del equipo son obligatorios');
      }
      if (!htmlToPlainText(technicalReport)) {
        throw new Error('El informe técnico es obligatorio');
      }

      if (isEditMode && id) {
        await updateOrder(token, id, payload as any);
      } else {
        await createOrder(token, payload as any);
      }
      navigate('/admin/order');
    } catch (err) {
      if (err instanceof CreateOrderError && err.code === 'CLIENT_CONTACT_REQUIRED' && err.clientId != null) {
        setSubmitError({
          text: err.message,
          contactClientId: err.clientId,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'No se pudo enviar la orden';
      setSubmitError({ text: message });
    }
  };

  const handleCancel = () => {
    navigate('/admin/order');
  };

  const openQuickAddModal = useCallback((type: 'brand' | 'model' | 'product') => {
    setQuickAddError(null);
    setQuickAddType(type);
    setQuickAddValue('');
    setQuickAddOpen(true);
  }, []);

  const handleQuickAddBrand = useCallback(() => {
    openQuickAddModal('brand');
  }, [openQuickAddModal]);

  const handleQuickAddModel = useCallback(() => {
    if (!brand.trim()) {
      setQuickAddError('Seleccione una marca antes de añadir un modelo.');
      return;
    }
    openQuickAddModal('model');
  }, [brand, openQuickAddModal]);

  const handleQuickAddProduct = useCallback(() => {
    openQuickAddModal('product');
  }, [openQuickAddModal]);

  const handleQuickAddSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setQuickAddError('No autenticado.');
      return;
    }
    if (!quickAddType) return;

    const value = quickAddValue.trim();
    if (!value) {
      setQuickAddError('El nombre es obligatorio.');
      return;
    }

    setQuickAddError(null);
    if (quickAddType === 'brand') setQuickAddBrandLoading(true);
    if (quickAddType === 'model') setQuickAddModelLoading(true);
    if (quickAddType === 'product') setQuickAddProductLoading(true);

    try {
      if (quickAddType === 'brand') {
        const { brand: created } = await createBrand(token, { name: value, state: 'active' });
        setBrandOptions((prev) => {
          const next = new Map(prev.map((b) => [normalizeKey(b.value), b]));
          next.set(normalizeKey(created.name), { value: created.name, label: created.name });
          return Array.from(next.values()).sort((a, b) => a.label.localeCompare(b.label));
        });
        setBrand(created.name);
      } else if (quickAddType === 'model') {
        const { model: created } = await createModel(token, {
          brand: brand.trim(),
          model: value,
          state: 'active',
        });
        setAllModels((prev) => {
          const exists = prev.some(
            (m) => normalizeKey(m.brand) === normalizeKey(created.brand) && normalizeKey(m.model) === normalizeKey(created.model)
          );
          if (exists) return prev;
          return [...prev, { brand: created.brand, model: created.model }];
        });
        setModel(created.model);
      } else {
        const { product: created } = await createCatalogProduct(token, {
          product: value,
          state: 'active',
        });
        setProductOptions((prev) => {
          const next = new Map(prev.map((p) => [normalizeKey(p.value), p]));
          next.set(normalizeKey(created.product), { value: created.product, label: created.product });
          return Array.from(next.values()).sort((a, b) => a.label.localeCompare(b.label));
        });
        setProduct(created.product);
      }

      setQuickAddOpen(false);
      setQuickAddType(null);
      setQuickAddValue('');
    } catch (err) {
      setQuickAddError(err instanceof Error ? err.message : 'No se pudo crear el elemento');
    } finally {
      setQuickAddBrandLoading(false);
      setQuickAddModelLoading(false);
      setQuickAddProductLoading(false);
    }
  }, [brand, normalizeKey, quickAddType, quickAddValue, token]);

  const servicesColumns: TableColumn<ServiceSparePartItem>[] = useMemo(
    () => [
      { id: 'name', name: 'Código', width: "140px", selector: (r) => r.name, sortable: true },
      { id: 'details', name: 'Detalle', maxWidth: "420px", selector: (r) => r.details, sortable: true },
      { id: 'price', name: 'Precio', width: '100px', selector: (r) => r.price, sortable: true, format: (r) => r.price.toFixed(2) },
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
              title={addable ? undefined : 'Stock insuficiente para añadir'}
              onClick={() => addToBudget(row)}
              aria-label={addable ? `Añadir ${row.name}` : `No se puede añadir ${row.name} — stock insuficiente`}
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
        name: 'Código',
        width: '140px',
        selector: (r) => r.productocodigo,
        sortable: true,
        cell: (r) => (
          <span className="text-slate-700 dark:text-slate-300">{r.productocodigo || '—'}</span>
        ),
      },
      {
        id: 'description',
        name: 'Descripción',
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
        name: 'Precio (IVA incl.)',
        selector: (r) => spareUnitPriceInclVat(r, spareCatalogTarifaId),
        sortable: true,
        width: '120px',
        right: true,
        cell: (r) => (
          <span className="tabular-nums text-sm text-slate-700 dark:text-slate-300">
            {spareUnitPriceInclVat(r, spareCatalogTarifaId).toFixed(2)}
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
          const label = row.description.trim() || row.productocodigo || `Repuesto (${row.productosid})`;
          return (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-0 p-1.5"
              disabled={!addable}
              title={addable ? undefined : 'Stock insuficiente para añadir'}
              onClick={() => addSpareToBudget(row)}
              aria-label={addable ? `Añadir ${label}` : `No se puede añadir ${label} — stock insuficiente`}
            >
              <Plus className="w-5 h-5 font-bold" />
            </Button>
          );
        },
        ignoreRowClick: true,
      },
    ],
    [addSpareToBudget, budgetLines, getReplacementRemaining, spareCatalogTarifaId]
  );

  useEffect(() => {
    async function loadCatalog() {
      if (!token) return;
      setCatalogLoading(true);
      try {
        const [servicesRes, spareRes] = await Promise.all([
          getServicesSpareParts(token),
          getSpareServerCatalog(token),
        ]);
        setServicesData(servicesRes.items);
        setSpareCatalogData(spareRes.items);
      } catch {
        setServicesData([]);
        setSpareCatalogData([]);
      } finally {
        setCatalogLoading(false);
      }
    }
    loadCatalog();
  }, [token]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ordenes — Servicio técnico DIGITALSERVER"
        breadcrumb={[
          { label: 'Operaciones', icon: Home },
          { label: 'Ordenes' },
          { label: isEditMode ? 'Editar orden' : 'Nueva orden' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order details - full width */}
        <Card>
          <CardHeader title="Detalles de la orden" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass()}>Ubicación <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Building2,
                  <Input value="Principal" disabled />
                )}
              </div>
              <div>
                <label className={labelClass()}>Cliente <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  User,
                  <SearchableSelect
                    options={customerOptions}
                    placeholder="-- Seleccionar --"
                    value={customer}
                    onValueChange={setCustomer}
                    onQueryChange={setCustomerQuery}
                    filterOptions={false}
                    emptyText={customerLoading ? 'Cargando…' : 'Sin resultados'}
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Marca <span className="text-red-500 dark:text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {wrapWithIcon(
                      Tag,
                      <SearchableSelect
                        options={brandOptions}
                        placeholder="-- Seleccionar --"
                        value={brand}
                        onValueChange={setBrand}
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3"
                    onClick={handleQuickAddBrand}
                    disabled={quickAddBrandLoading}
                    isLoading={quickAddBrandLoading}
                  >
                    + Añadir
                  </Button>
                </div>
              </div>
              <div>
                <label className={labelClass()}>Modelo <span className="text-red-500 dark:text-red-400">*</span></label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {wrapWithIcon(
                      Cpu,
                      <SearchableSelect
                        options={modelOptions}
                        placeholder="-- Seleccionar --"
                        value={model}
                        onValueChange={setModel}
                      />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 px-3"
                    onClick={handleQuickAddModel}
                    disabled={quickAddModelLoading || !brand.trim()}
                    isLoading={quickAddModelLoading}
                  >
                    + Añadir
                  </Button>
                </div>
              </div>
              <div>
                <label className={labelClass()}>Serie <span className="text-red-500 dark:text-red-400">*</span></label>
                <Input
                  leftIcon={Hash}
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  placeholder="Número de serie"
                />
              </div>
              <div>
                <label className={labelClass()}>Producto <span className="text-red-500 dark:text-red-400">*</span></label>
                {productsLoading ? (
                  <div className="pt-2">
                    <Loader size="md" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        {wrapWithIcon(
                          Package,
                          <SearchableSelect
                            options={effectiveProductOptions}
                            placeholder="-- Seleccionar --"
                            value={product}
                            onValueChange={setProduct}
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 px-3"
                        onClick={handleQuickAddProduct}
                        disabled={quickAddProductLoading}
                        isLoading={quickAddProductLoading}
                      >
                        + Añadir
                      </Button>
                    </div>
                    {!effectiveProductOptions.length && (
                      <p className="text-xs text-red-600 dark:text-red-400">No hay productos activos disponibles.</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass()}>Área <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Building2,
                  <Select
                    options={AREA_OPTIONS}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Zona de estado <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  RefreshCw,
                  <Select
                    options={STATE_AREA_OPTIONS}
                    value={stateArea}
                    onChange={(e) => setStateArea(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Técnico <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  User,
                  <Select
                    options={technicianOptions}
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Prioridad</label>
                {wrapWithIcon(
                  BarChart3,
                  <Select
                    options={PRIORITY_OPTIONS}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div>
              <label className={labelClass()} htmlFor="order-equipment-condition">
                Avería y estado del equipo <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <RichTextEditor
                id="order-equipment-condition"
                aria-label="Avería y estado del equipo"
                value={equipmentCondition}
                onChange={setEquipmentCondition}
                placeholder="Describa la avería y el estado del equipo…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass()}>Fotos — antes de la reparación (ingreso)</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Visibles para el cliente en el seguimiento público. Puede añadir varias imágenes.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {beforePhotos.map((p) => (
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
                          onClick={() => removeBeforePhoto(p.id)}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                          title="Quitar foto"
                          aria-label="Quitar foto anterior a la reparación"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {beforePhotos.length === 0 && (
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
                      ref={photoBeforeInputRef}
                      type="file"
                      accept={ACCEPT_ORDER_IMAGES}
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files?.length) addBeforePhotoFiles(files);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={Upload}
                      onClick={() => photoBeforeInputRef.current?.click()}
                    >
                      Añadir fotos
                    </Button>
                    {photoBeforeError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{photoBeforeError}</p>
                    )}
                  </div>
                </div>
              </div>
              {showAfterRepairPhotoSection && (
                <div>
                  <label className={labelClass()}>Fotos — después de la reparación</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Súbalas cuando la orden pase a almacén (reparado). Puede añadir varias imágenes.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {afterPhotos.map((p) => (
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
                            onClick={() => removeAfterPhoto(p.id)}
                            className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                            title="Quitar foto"
                            aria-label="Quitar foto posterior a la reparación"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {afterPhotos.length === 0 && (
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
                        ref={photoAfterInputRef}
                        type="file"
                        accept={ACCEPT_ORDER_IMAGES}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files?.length) addAfterPhotoFiles(files);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={Upload}
                        onClick={() => photoAfterInputRef.current?.click()}
                      >
                        Añadir fotos
                      </Button>
                      {photoAfterError && <p className="text-xs text-red-600 dark:text-red-400">{photoAfterError}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass()} htmlFor="order-technical-report">
                Informe técnico (obligatorio) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <RichTextEditor
                id="order-technical-report"
                aria-label="Informe técnico"
                value={technicalReport}
                onChange={setTechnicalReport}
                placeholder="Informe técnico…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass()}>Diagnóstico</label>
                {wrapWithIcon(
                  BarChart3,
                  <Select
                    options={YES_NO_OPTIONS}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Garantía</label>
                {wrapWithIcon(
                  FileText,
                  <Select
                    options={YES_NO_OPTIONS}
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Fecha prometida</label>
                <DatePicker
                  value={fianceeDate}
                  onChange={(e) => setFianceeDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className={labelClass()}>Anticipo</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={advancement}
                    onChange={(e) => setAdvancement(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass()}>Accesorios <span className="text-red-500 dark:text-red-400">*</span></label>
              <div className="flex flex-wrap gap-4 pt-2">
                {accessoryOptions.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!accessories[id]}
                      onChange={() => toggleAccessory(id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Servicios, repuestos (Perseo) y presupuesto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-h-0 flex flex-col">
            <CardHeader
              title="Servicios y repuestos"
              actions={
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Tarifa
                    {spareTarifaSelectOptions.length > 0 ? (
                      <Select
                        className="!w-auto min-w-[9rem] py-1.5 text-sm"
                        options={spareTarifaSelectOptions}
                        value={String(spareCatalogTarifaId)}
                        onChange={(e) => setSpareCatalogTarifaId(Number(e.target.value) || 0)}
                        aria-label="Tarifa de lista de repuestos"
                      />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setServiceSparePanelOpen((v) => !v)}
                    aria-expanded={serviceSparePanelOpen}
                    title={serviceSparePanelOpen ? 'Ocultar catálogo' : 'Mostrar catálogo'}
                  >
                    {serviceSparePanelOpen ? (
                      <ChevronUp className="w-4 h-4 mr-1 inline" aria-hidden />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1 inline" aria-hidden />
                    )}
                    {serviceSparePanelOpen ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              }
            />
            {serviceSparePanelOpen && (
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col gap-0 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col min-h-0">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Repuestos</h3>
                  </div>
                  <div className="flex-1 min-h-[240px] max-h-[420px] flex flex-col">
                    <DataTableWithToolbar<SpareServerRow>
                      data={filteredSpareCatalog}
                      columns={spareColumns}
                      searchFields={['description', 'productocodigo']}
                      searchPlaceholder="Buscar:"
                      pageSizeOptions={[10, 25, 50]}
                      defaultPageSize={10}
                      noDataComponent={
                        catalogLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                            <Loader size="md" />
                            <span className="text-sm">Cargando…</span>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-500 dark:text-slate-400 px-4">
                            {spareCatalogData.length === 0
                              ? 'No hay repuestos en el catálogo.'
                              : 'Ningún repuesto para la tarifa seleccionada.'}
                          </div>
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col min-h-0 border-t border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Servicios</h3>
                  </div>
                  <div className="flex-1 min-h-[240px] max-h-[420px] flex flex-col">
                    <DataTableWithToolbar<ServiceSparePartItem>
                      data={availableServices}
                      columns={servicesColumns}
                      searchFields={['name', 'details']}
                      searchPlaceholder="Buscar:"
                      pageSizeOptions={[10, 25, 50]}
                      defaultPageSize={10}
                      noDataComponent={
                        catalogLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                            <Loader size="md" />
                            <span className="text-sm">Cargando…</span>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                            No se encontraron servicios.
                          </div>
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
          <Card className="min-h-0 flex flex-col">
            <CardHeader title="Detalle del presupuesto" />
            <CardContent className="flex-1 min-h-0 flex flex-col">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-h-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Servicio / repuestos</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Precio</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Cantidad</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Total</th>
                      <th className="w-10 py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {budgetLines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          Sin líneas. Añada desde Servicios o Repuestos.
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
                              aria-label="Quitar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300" colSpan={2}>Subtotal</td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">$ {subtotalBudget.toFixed(2)}</td>
                      <td className="py-3 px-4" />
                    </tr>
                    <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Descuento</td>
                      <td className="py-3 px-4">
                        <Select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                          options={[
                            { value: 'none', label: 'Sin descuento' },
                            { value: 'percentage', label: 'Porcentaje (%)' },
                            { value: 'amount', label: 'Valor ($)' },
                          ]}
                          className="max-w-[180px]"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {discountType !== 'none' ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-24 py-1 px-2"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-red-600 dark:text-red-300">
                        - $ {discountAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4" />
                    </tr>
                    <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300" colSpan={2}>Total (<span className="text-red-500 dark:text-red-400">*</span>)</td>
                      <td className="py-3 px-4" />
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">$ {totalBudget.toFixed(2)}</td>
                      <td className="py-3 px-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 space-y-2">
            <p>{submitError.text}</p>
            {submitError.contactClientId != null && (
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin/clients?edit=${submitError.contactClientId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-medium text-red-800 dark:text-red-200 underline underline-offset-2 hover:text-red-900 dark:hover:text-red-100"
              >
                Abrir la ficha del cliente en una pestaña nueva para añadir teléfono y correo
              </a>
            )}
          </div>
        )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="red" size="md" onClick={handleCancel} leftIcon={X}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md">
            {isEditMode ? 'Actualizar' : 'Guardar orden'}
          </Button>
        </div>
      </form>

      <Modal
        open={quickAddOpen}
        onClose={() => {
          if (quickAddBrandLoading || quickAddModelLoading || quickAddProductLoading) return;
          setQuickAddOpen(false);
          setQuickAddType(null);
          setQuickAddValue('');
          setQuickAddError(null);
        }}
        title={
          quickAddType === 'brand'
            ? 'Añadir marca'
            : quickAddType === 'model'
              ? 'Añadir modelo'
              : 'Añadir producto'
        }
        size="sm"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {quickAddType === 'brand' ? 'Nombre de la marca' : quickAddType === 'model' ? 'Nombre del modelo' : 'Nombre del producto'}
            </label>
            <Input
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              placeholder={
                quickAddType === 'brand'
                  ? 'ej. HP'
                  : quickAddType === 'model'
                    ? 'ej. LATITUDE 5420'
                    : 'ej. PLACA BASE'
              }
              autoFocus
            />
            {quickAddType === 'model' && brand.trim() && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Marca: {brand}</p>
            )}
          </div>

          {quickAddError && (
            <p className="text-sm text-red-600 dark:text-red-400">{quickAddError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (quickAddBrandLoading || quickAddModelLoading || quickAddProductLoading) return;
                setQuickAddOpen(false);
                setQuickAddType(null);
                setQuickAddValue('');
                setQuickAddError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={quickAddBrandLoading || quickAddModelLoading || quickAddProductLoading}
              disabled={quickAddBrandLoading || quickAddModelLoading || quickAddProductLoading}
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
