import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Home,
  Building2,
  User,
  Tag,
  Cpu,
  Hash,
  BarChart3,
  FileText,
  DollarSign,
  RefreshCw,
  Plus,
  X,
  Upload,
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
} from '../../components/ui';
import { DataTableWithToolbar } from '../../components/datatable';
import type { TableColumn } from 'react-data-table-component';
import type { SelectOption } from '../../components/ui';
import type { ServiceSparePartItem } from '../../api/servicesSpareParts';
import { useAuth } from '../../contexts/AuthContext';
import { getBranches } from '../../api/branches';
import { getClients } from '../../api/clients';
import { getBrands } from '../../api/brands';
import { getModels } from '../../api/models';
import { getAccessories, type Accessory } from '../../api/accessories';
import { getServicesSpareParts } from '../../api/servicesSpareParts';
import { getProducts } from '../../api/products';
import { getAssignableTechnicians, type User as ApiUser } from '../../api/users';
import { createOrder, getOrderById, updateOrder } from '../../api/orders';
import { uploadImage } from '../../api/uploads';
import noImageUrl from '../../assets/images/noimage.png';

const MAX_ORDER_PHOTO_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB)
const ACCEPT_ORDER_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

const AREA_OPTIONS: SelectOption[] = [
  { value: 'entrance', label: 'Entrance Area' },
  { value: 'maintenance', label: 'Maintenance Area' },
];

const STATE_AREA_OPTIONS: SelectOption[] = [
  { value: 'income', label: 'Income' },
  { value: 'maintenance', label: 'Maintenance' },
];

function isTechnicianUser(u: ApiUser) {
  const slug = (u.role?.slug ?? '').toLowerCase();
  const name = (u.role?.name ?? '').toLowerCase();
  // Be defensive: accept common variants.
  return slug === 'technician' || slug.includes('tech') || name.includes('technician') || name.includes('tech');
}

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const YES_NO_OPTIONS: SelectOption[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
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

  const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
  const [customerOptions, setCustomerOptions] = useState<SelectOption[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [allModels, setAllModels] = useState<Array<{ brand: string; model: string }>>([]);
  const [accessoriesData, setAccessoriesData] = useState<Accessory[]>([]);
  const [servicesData, setServicesData] = useState<ServiceSparePartItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [technicianOptions, setTechnicianOptions] = useState<SelectOption[]>([]);
  const [submitError, setSubmitError] = useState('');

  const [branch, setBranch] = useState('');
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
  const [branchError, setBranchError] = useState('');

  const [photoBeforeRepair, setPhotoBeforeRepair] = useState<string | null>(null);
  const [photoAfterRepair, setPhotoAfterRepair] = useState<string | null>(null);
  const [photoBeforeRepairFile, setPhotoBeforeRepairFile] = useState<File | null>(null);
  const [photoAfterRepairFile, setPhotoAfterRepairFile] = useState<File | null>(null);
  const [photoBeforeError, setPhotoBeforeError] = useState<string | null>(null);
  const [photoAfterError, setPhotoAfterError] = useState<string | null>(null);
  const photoBeforeInputRef = useRef<HTMLInputElement>(null);
  const photoAfterInputRef = useRef<HTMLInputElement>(null);
  const photoBeforeObjectUrlRef = useRef<string | null>(null);
  const photoAfterObjectUrlRef = useRef<string | null>(null);
  const showAfterRepairPhotoSection = isEditMode && (area === 'warehouse' || stateArea === 'warehouse');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const orderPromise = isEditMode && id ? getOrderById(token, id) : Promise.resolve(null);
        const [branchesRes, clientsRes, brandsRes, modelsRes, accessoriesRes, usersRes, orderRes] = await Promise.allSettled([
          getBranches(token),
          getClients(token, { page: 1, limit: 100 }),
          getBrands(token),
          getModels(token),
          getAccessories(token),
          getAssignableTechnicians(token),
          orderPromise,
        ]);

        if (!mounted) return;

        const branches = branchesRes.status === 'fulfilled' ? branchesRes.value.branches : [];
        setBranchOptions(
          branches
            .filter((b) => b.state !== 'inactive')
            .map((b) => ({ value: b.branchName, label: b.branchName }))
        );

        const clientsResp = clientsRes.status === 'fulfilled' ? clientsRes.value : { clients: [] };
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
          setBranch(o.branch ?? '');
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

          setPhotoBeforeRepair(o.photoBeforeRepair?.trim() ? o.photoBeforeRepair : null);
          setPhotoAfterRepair(o.photoAfterRepair?.trim() ? o.photoAfterRepair : null);
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setBranchOptions([]);
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

    if (!branch) {
      setProductOptions([]);
      if (!isEditMode) setProduct('');
      return;
    }

    let mounted = true;
    (async () => {
      setProductsLoading(true);
      try {
        const { products } = await getProducts(token, { branch, state: 'active' });
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
  }, [token, branch, isEditMode]);

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
    const filtered = branch ? accessoriesData.filter((a) => a.branch === branch) : accessoriesData;
    const unique = new Map<string, string>();
    for (const a of filtered) {
      const key = a.artifact;
      if (!unique.has(key)) unique.set(key, key);
    }
    return Array.from(unique.values()).sort().map((label) => ({ id: label, label }));
  }, [accessoriesData, branch]);

  const effectiveProductOptions = useMemo(() => {
    const trimmed = product.trim();
    if (!trimmed) return productOptions;
    if (productOptions.some((o) => o.value === trimmed)) return productOptions;
    if (!isEditMode) return productOptions;
    // Keep the current order value selected even if it is not active anymore.
    return [{ value: trimmed, label: trimmed }, ...productOptions];
  }, [product, productOptions, isEditMode]);

  const availableServices = useMemo(() => {
    const filtered = branch ? servicesData.filter((s) => s.branch === branch) : servicesData;
    return filtered.filter((s) => s.state !== 'inactive');
  }, [servicesData, branch]);

  useEffect(() => {
    // reset model selection if brand changes and selected model isn't valid anymore
    if (!model) return;
    if (!allModels.length) return;
    const stillValid = allModels.some((m) => m.model === model && (!brand || m.brand === brand));
    if (!stillValid) setModel('');
  }, [brand, model, allModels]);

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
  }, []);

  const updateBudgetAmount = useCallback((lineId: string, amount: number) => {
    setBudgetLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, amount, total: l.price * amount } : l
      )
    );
  }, []);

  const removeBudgetLine = useCallback((lineId: string) => {
    setBudgetLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const toggleAccessory = (id: string) => {
    setAccessories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectOrderPhotoBefore = useCallback((file: File) => {
    setPhotoBeforeError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoBeforeError('Please select an image (JPEG, PNG, WebP or GIF).');
      return;
    }
    if (file.size > MAX_ORDER_PHOTO_BYTES) {
      setPhotoBeforeError(`Image must be under ${(MAX_ORDER_PHOTO_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    if (photoBeforeObjectUrlRef.current) {
      URL.revokeObjectURL(photoBeforeObjectUrlRef.current);
      photoBeforeObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    photoBeforeObjectUrlRef.current = objectUrl;
    setPhotoBeforeRepairFile(file);
    setPhotoBeforeRepair(objectUrl);
  }, []);

  const selectOrderPhotoAfter = useCallback((file: File) => {
    setPhotoAfterError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoAfterError('Please select an image (JPEG, PNG, WebP or GIF).');
      return;
    }
    if (file.size > MAX_ORDER_PHOTO_BYTES) {
      setPhotoAfterError(`Image must be under ${(MAX_ORDER_PHOTO_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    if (photoAfterObjectUrlRef.current) {
      URL.revokeObjectURL(photoAfterObjectUrlRef.current);
      photoAfterObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    photoAfterObjectUrlRef.current = objectUrl;
    setPhotoAfterRepairFile(file);
    setPhotoAfterRepair(objectUrl);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) {
      setBranchError('Required Branch');
      return;
    }
    setBranchError('');
    setSubmitError('');
    try {
      if (!token) {
        setSubmitError('Not authenticated.');
        return;
      }

      // Upload selected files only on Save/Submit (not on selection).
      let photoBeforeValue = photoBeforeRepair ?? '';
      let photoAfterValue = photoAfterRepair ?? '';

      if (photoBeforeRepairFile) {
        const { url } = await uploadImage(token, photoBeforeRepairFile, 'order-before');
        photoBeforeValue = url;
        setPhotoBeforeRepair(url);
        setPhotoBeforeRepairFile(null);
        if (photoBeforeObjectUrlRef.current) {
          URL.revokeObjectURL(photoBeforeObjectUrlRef.current);
          photoBeforeObjectUrlRef.current = null;
        }
      }
      if (photoAfterRepairFile) {
        const { url } = await uploadImage(token, photoAfterRepairFile, 'order-after');
        photoAfterValue = url;
        setPhotoAfterRepair(url);
        setPhotoAfterRepairFile(null);
        if (photoAfterObjectUrlRef.current) {
          URL.revokeObjectURL(photoAfterObjectUrlRef.current);
          photoAfterObjectUrlRef.current = null;
        }
      }

      const payload = {
        branch,
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
        photoBeforeRepair: photoBeforeValue,
        photoAfterRepair: photoAfterValue,
      };

      if (!payload.clientId || Number.isNaN(payload.clientId)) throw new Error('Customer is required');
      if (!payload.brand) throw new Error('Brand is required');
      if (!payload.model) throw new Error('Model is required');
      if (!payload.series) throw new Error('Series is required');
      if (!payload.type) throw new Error('Product is required');

      if (isEditMode && id) {
        await updateOrder(token, id, payload as any);
      } else {
        await createOrder(token, payload as any);
      }
      navigate('/admin/order');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit order';
      setSubmitError(message);
    }
  };

  const handleCancel = () => {
    navigate('/admin/order');
  };

  const servicesColumns: TableColumn<ServiceSparePartItem>[] = useMemo(
    () => [
      { id: 'name', name: 'Service/Spare Parts', selector: (r) => r.name, sortable: true },
      { id: 'price', name: 'Price', selector: (r) => r.price, sortable: true, format: (r) => r.price.toFixed(2) },
      { id: 'amount', name: 'Amount', selector: (r) => r.amount, sortable: true },
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

  useEffect(() => {
    async function loadServices() {
      if (!token) return;
      setServicesLoading(true);
      try {
        const { items } = await getServicesSpareParts(token);
        setServicesData(items);
      } catch {
        setServicesData([]);
      } finally {
        setServicesLoading(false);
      }
    }
    loadServices();
  }, [token]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[
          { label: 'Operations', icon: Home },
          { label: 'Orders' },
          { label: isEditMode ? 'Edit Order' : 'New Order' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order details - full width */}
        <Card>
          <CardHeader title="Order Details" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass()}>Branch <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Building2,
                  <SearchableSelect
                    options={branchOptions}
                    placeholder="-- Select --"
                    value={branch}
                    onValueChange={setBranch}
                    buttonClassName={`${branchError ? 'border-red-500' : ''}`}
                  />
                )}
                {branchError && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{branchError}</p>
                )}
              </div>
              <div>
                <label className={labelClass()}>Customer <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  User,
                  <SearchableSelect
                    options={customerOptions}
                    placeholder="-- Select --"
                    value={customer}
                    onValueChange={setCustomer}
                    onQueryChange={setCustomerQuery}
                    filterOptions={false}
                    emptyText={customerLoading ? 'Loading…' : 'No results'}
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Brand <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Tag,
                  <SearchableSelect
                    options={brandOptions}
                    placeholder="-- Select --"
                    value={brand}
                    onValueChange={setBrand}
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Model <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Cpu,
                  <SearchableSelect
                    options={modelOptions}
                    placeholder="-- Select --"
                    value={model}
                    onValueChange={setModel}
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Series <span className="text-red-500 dark:text-red-400">*</span></label>
                <Input
                  leftIcon={Hash}
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="Serial / Series"
                />
              </div>
              <div>
                <label className={labelClass()}>Product <span className="text-red-500 dark:text-red-400">*</span></label>
                {productsLoading ? (
                  <div className="pt-2">
                    <Loader size="md" />
                  </div>
                ) : effectiveProductOptions.length ? (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {effectiveProductOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="product"
                          value={opt.value}
                          checked={product === opt.value}
                          onChange={() => setProduct(opt.value)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="pt-2 text-xs text-red-600 dark:text-red-400">No active products for this branch.</p>
                )}
              </div>
              <div>
                <label className={labelClass()}>Area <span className="text-red-500 dark:text-red-400">*</span></label>
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
                <label className={labelClass()}>State Area <span className="text-red-500 dark:text-red-400">*</span></label>
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
                <label className={labelClass()}>Technician <span className="text-red-500 dark:text-red-400">*</span></label>
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
                <label className={labelClass()}>Priority</label>
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
              <label className={labelClass()}>Equipment Malfunction and Condition <span className="text-red-500 dark:text-red-400">*</span></label>
              <textarea
                value={equipmentCondition}
                onChange={(e) => setEquipmentCondition(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="Describe equipment malfunction and condition..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass()}>Photo — before repair (intake)</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Shown to the customer on the public track page.</p>
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={photoBeforeRepair && photoBeforeRepair.trim() ? photoBeforeRepair : noImageUrl}
                      alt=""
                      width={120}
                      height={120}
                      className="size-[120px] rounded-lg object-cover border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                    />
                    {photoBeforeRepair && (
                      <button
                        type="button"
                        onClick={() => {
                          if (photoBeforeObjectUrlRef.current) {
                            URL.revokeObjectURL(photoBeforeObjectUrlRef.current);
                            photoBeforeObjectUrlRef.current = null;
                          }
                          setPhotoBeforeRepair(null);
                          setPhotoBeforeRepairFile(null);
                          setPhotoBeforeError(null);
                          if (photoBeforeInputRef.current) photoBeforeInputRef.current.value = '';
                        }}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                        title="Remove photo"
                        aria-label="Remove before-repair photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={photoBeforeInputRef}
                      type="file"
                      accept={ACCEPT_ORDER_IMAGES}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) selectOrderPhotoBefore(file);
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
                      Upload
                    </Button>
                    {photoBeforeError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{photoBeforeError}</p>
                    )}
                  </div>
                </div>
              </div>
              {showAfterRepairPhotoSection && (
                <div>
                  <label className={labelClass()}>Photo — after repair</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Upload when the order is moved to warehouse (fixed/after photo).</p>
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={photoAfterRepair && photoAfterRepair.trim() ? photoAfterRepair : noImageUrl}
                        alt=""
                        width={120}
                        height={120}
                        className="size-[120px] rounded-lg object-cover border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                      />
                      {photoAfterRepair && (
                        <button
                          type="button"
                          onClick={() => {
                            if (photoAfterObjectUrlRef.current) {
                              URL.revokeObjectURL(photoAfterObjectUrlRef.current);
                              photoAfterObjectUrlRef.current = null;
                            }
                            setPhotoAfterRepair(null);
                          setPhotoAfterRepairFile(null);
                            setPhotoAfterError(null);
                            if (photoAfterInputRef.current) photoAfterInputRef.current.value = '';
                          }}
                          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                          title="Remove photo"
                          aria-label="Remove after-repair photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={photoAfterInputRef}
                        type="file"
                        accept={ACCEPT_ORDER_IMAGES}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                        if (file) selectOrderPhotoAfter(file);
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
                        Upload
                      </Button>
                      {photoAfterError && <p className="text-xs text-red-600 dark:text-red-400">{photoAfterError}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass()}>Technical Report (Mandatory) <span className="text-red-500 dark:text-red-400">*</span></label>
              <textarea
                value={technicalReport}
                onChange={(e) => setTechnicalReport(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="Technical report..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass()}>Diagnosis</label>
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
                <label className={labelClass()}>Warranty</label>
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
                <label className={labelClass()}>F. Fiancée</label>
                <DatePicker
                  value={fianceeDate}
                  onChange={(e) => setFianceeDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className={labelClass()}>Advancement</label>
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
              <label className={labelClass()}>Accessories <span className="text-red-500 dark:text-red-400">*</span></label>
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

        {/* Services / Spare Parts and Budget Details - same row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-h-0 flex flex-col">
            <CardHeader title="Services / Spare Parts" />
            <CardContent className="p-0 flex-1 min-h-0">
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
            </CardContent>
          </Card>
          <Card className="min-h-0 flex flex-col">
            <CardHeader title="Budget Details" />
            <CardContent className="flex-1 min-h-0 flex flex-col">
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
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {submitError}
          </div>
        )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="red" size="md" onClick={handleCancel} leftIcon={X}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {isEditMode ? 'Update' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
