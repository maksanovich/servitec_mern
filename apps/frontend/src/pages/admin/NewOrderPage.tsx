import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  User,
  Tag,
  Cpu,
  Hash,
  BarChart3,
  FileText,
  Lock,
  DollarSign,
  RefreshCw,
  Plus,
  X,
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
import { getUsers, type User as ApiUser } from '../../api/users';
import { createOrder } from '../../api/orders';

const PRODUCT_OPTIONS: SelectOption[] = [
  { value: 'mainboard', label: 'MAINBOARD' },
  { value: 'ssd', label: 'SSD drive' },
  { value: 'others', label: 'OTHERS' },
  { value: 'laptop', label: 'LAPTOP' },
  { value: 'printer', label: 'PRINTER' },
  { value: 'computer', label: 'COMPUTER' },
  { value: 'equipment', label: 'EQUIPMENT' },
];

const AREA_OPTIONS: SelectOption[] = [
  { value: 'entrance', label: 'Entrance Area' },
  { value: 'maintenance', label: 'Maintenance Area' },
  { value: 'warehouse', label: 'Warehouse Area' },
];

const STATE_AREA_OPTIONS: SelectOption[] = [
  { value: 'income', label: 'Income' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'warehouse', label: 'Warehouse' },
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
  const [area, setArea] = useState('entrance');
  const [stateArea, setStateArea] = useState('income');
  const [technician, setTechnician] = useState('');
  const [priority, setPriority] = useState('normal');
  const [equipmentCondition, setEquipmentCondition] = useState('');
  const [technicalReport, setTechnicalReport] = useState('');
  const [diagnosis, setDiagnosis] = useState('no');
  const [warranty, setWarranty] = useState('no');
  const [password, setPassword] = useState('');
  const [fianceeDate, setFianceeDate] = useState('');
  const [advancement, setAdvancement] = useState('');
  const [accessories, setAccessories] = useState<Record<string, boolean>>({});
  const [budgetLines, setBudgetLines] = useState<BudgetLineItem[]>([]);
  const [branchError, setBranchError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ branches }, clientsResp, { brands }, { models }, { accessories }, { users }] = await Promise.all([
          getBranches(token),
          getClients(token, { page: 1, limit: 100 }),
          getBrands(token),
          getModels(token),
          getAccessories(token),
          getUsers(token),
        ]);

        if (!mounted) return;

        setBranchOptions(
          branches
            .filter((b) => b.state !== 'inactive')
            .map((b) => ({ value: b.branchName, label: b.branchName }))
        );
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
        setBrandOptions(
          brands
            .filter((b) => b.state !== 'inactive')
            .map((b) => ({ value: b.name, label: b.name }))
        );
        setAllModels(
          models
            .filter((m) => m.state !== 'inactive')
            .map((m) => ({
              brand: String(m.brand ?? '').trim(),
              model: String(m.model ?? '').trim(),
            }))
            .filter((m) => m.brand && m.model)
        );
        setAccessoriesData(accessories.filter((a) => a.state !== 'inactive'));

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
  }, [token]);

  useEffect(() => {
    // If no technician selected yet, default to first available option.
    if (technician) return;
    if (technicianOptions.length === 0) return;
    setTechnician(technicianOptions[0].value);
  }, [technician, technicianOptions]);

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

  const availableServices = useMemo(() => {
    const filtered = branch ? servicesData.filter((s) => s.branch === branch) : servicesData;
    return filtered.filter((s) => s.state !== 'inactive');
  }, [servicesData, branch]);

  useEffect(() => {
    // reset model selection if brand changes and selected model isn't valid anymore
    if (!model) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) {
      setBranchError('Required Branch');
      return;
    }
    setBranchError('');
    setSubmitError('');
    try {
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
        password,
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
      };

      if (!payload.clientId || Number.isNaN(payload.clientId)) throw new Error('Customer is required');
      if (!payload.brand) throw new Error('Brand is required');
      if (!payload.model) throw new Error('Model is required');
      if (!payload.series) throw new Error('Series is required');
      if (!payload.type) throw new Error('Product is required');

      await createOrder(token, payload as any);
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
          { label: 'New Order' },
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
                <div className="flex flex-wrap gap-3 pt-2">
                  {PRODUCT_OPTIONS.map((opt) => (
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
                <label className={labelClass()}>Password</label>
                <Input
                  type="password"
                  leftIcon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
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
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
