import { useMemo, useState, useCallback } from 'react';
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
  DatePicker,
} from '../../components/ui';
import { DataTableWithToolbar } from '../../components/datatable';
import type { TableColumn } from 'react-data-table-component';
import type { SelectOption } from '../../components/ui';
import { sampleServicesSpareParts, type ServiceSparePart } from './orders/servicesSpareParts';

const PRODUCT_OPTIONS: SelectOption[] = [
  { value: 'mainboard', label: 'MAINBOARD' },
  { value: 'ssd', label: 'SSD drive' },
  { value: 'others', label: 'OTHERS' },
  { value: 'laptop', label: 'LAPTOP' },
  { value: 'printer', label: 'PRINTER' },
  { value: 'computer', label: 'COMPUTER' },
  { value: 'equipment', label: 'EQUIPMENT' },
];

const BRANCH_OPTIONS: SelectOption[] = [
  { value: 'digitalserver', label: 'DIGITALSERVER' },
  { value: 'freedom', label: 'FREEDOM' },
];

const CUSTOMER_OPTIONS: SelectOption[] = [
  { value: '1', label: 'CARLOS STEVE TORRES MACIAS' },
  { value: '2', label: 'MARIA LOPEZ GARCIA' },
  { value: '3', label: 'JUAN PEREZ' },
];

const BRAND_OPTIONS: SelectOption[] = [
  { value: 'dell', label: 'DELL' },
  { value: 'asus', label: 'ASUS' },
  { value: 'lenovo', label: 'LENOVO' },
  { value: 'hp', label: 'HP' },
];

const MODEL_OPTIONS: SelectOption[] = [
  { value: '15-da0013la', label: '15-DA0013LA' },
  { value: 'g50-30', label: 'G50-30' },
  { value: '80xr', label: '80XR' },
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

const TECHNICIAN_OPTIONS: SelectOption[] = [
  { value: '1', label: 'BYRON BRIONES RIVAS (0922594478)' },
  { value: '2', label: 'JORGE FERNANDO CARPIO LIBERIO' },
];

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

const ACCESSORIES = [
  { id: 'suitcase', label: 'SUITCASE' },
  { id: 'case', label: 'CASE' },
  { id: 'charger', label: 'CHARGER' },
  { id: 'none', label: 'NONE' },
] as const;

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
  const [branch, setBranch] = useState('');
  const [customer, setCustomer] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [series, setSeries] = useState('');
  const [product, setProduct] = useState('');
  const [area, setArea] = useState('entrance');
  const [stateArea, setStateArea] = useState('income');
  const [technician, setTechnician] = useState('1');
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

  const totalBudget = useMemo(
    () => budgetLines.reduce((sum, line) => sum + line.total, 0),
    [budgetLines]
  );

  const addToBudget = useCallback((item: ServiceSparePart, amount: number = 1) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) {
      setBranchError('Required Branch');
      return;
    }
    setBranchError('');
    // TODO: submit to API
    navigate('/admin/repair-shop');
  };

  const handleCancel = () => {
    navigate('/admin/repair-shop');
  };

  const servicesColumns: TableColumn<ServiceSparePart>[] = useMemo(
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
            <Plus className="w-4 h-4" />
          </Button>
        ),
        ignoreRowClick: true,
      },
    ],
    [addToBudget]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[
          { label: 'Dashboard', icon: Home },
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
                  <Select
                    options={BRANCH_OPTIONS}
                    placeholder="-- Select --"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className={`w-full ${branchError ? 'border-red-500' : ''}`}
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
                  <Select
                    options={CUSTOMER_OPTIONS}
                    placeholder="-- Select --"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Brand <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Tag,
                  <Select
                    options={BRAND_OPTIONS}
                    placeholder="-- Select --"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Model <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Cpu,
                  <Select
                    options={MODEL_OPTIONS}
                    placeholder="-- Select --"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
              <div>
                <label className={labelClass()}>Series <span className="text-red-500 dark:text-red-400">*</span></label>
                {wrapWithIcon(
                  Hash,
                  <Select
                    options={[{ value: 'tzy241545', label: 'TZY241545' }, { value: 'pf01mup5', label: 'PF01MUP5' }]}
                    placeholder="-- Select --"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full"
                  />
                )}
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
                    options={TECHNICIAN_OPTIONS}
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
                {ACCESSORIES.map(({ id, label }) => (
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
              <DataTableWithToolbar<ServiceSparePart>
                data={sampleServicesSpareParts}
                columns={servicesColumns}
                searchFields={['name']}
                searchPlaceholder="Search:"
                pageSizeOptions={[10, 25, 50]}
                defaultPageSize={10}
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
                            <input
                              type="number"
                              min={1}
                              value={line.amount}
                              onChange={(e) =>
                                updateBudgetAmount(line.id, Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                              className="w-20 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 px-2 py-1 text-sm"
                            />
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="red" size="md" onClick={handleCancel} leftIcon={X}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            Keep
          </Button>
        </div>
      </form>
    </div>
  );
}
