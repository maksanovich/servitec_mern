import { useMemo, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Wrench, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { PageHeader, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
  exportTableToCSV,
} from '../../components/datatable';
import {
  type Order,
  type OrderArea,
  AREA_TABS,
  sampleOrders,
  ordersColumns,
} from './orders';
import { OrderExpandedRow } from './orders/OrderExpandedRow';
import { Plus, Minus } from 'lucide-react';

export type { Order, OrderArea };

const exportOptions = { title: 'Orders', filename: 'orders' };

export function OrdersPage() {
  const [activeArea, setActiveArea] = useState<OrderArea>('waiting-parts');
  const filteredDataRef = useRef<Order[]>([]);

  const dataByArea = useMemo(() => {
    return sampleOrders.filter((o) => o.area === activeArea);
  }, [activeArea]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: Order[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(ordersColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(ordersColumns, filteredDataRef.current, exportOptions);
  const exportCSV = () => exportTableToCSV(ordersColumns, filteredDataRef.current, exportOptions);

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
          columns={ordersColumns}
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
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Download}
                onClick={exportCSV}
                title="Export CSV"
                className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                aria-label="Export CSV"
              />
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  );
}
