import { useRef, useCallback } from 'react';
import { Home, DollarSign, FileText, FileSpreadsheet, LayoutGrid } from 'lucide-react';
import { PageHeader, KpiCard, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { incomeColumns } from './income/incomeColumns';
import type { DailyIncomeEntry } from './income/types';

const revenueKpis = [
  { label: 'Income', value: '$0.00', sublabel: 'Daily' as const, icon: DollarSign },
  { label: 'Weekly Income', value: '$0.00', sublabel: 'Total' as const, icon: DollarSign },
  { label: 'Monthly Income', value: '$1650.00', sublabel: null, icon: DollarSign },
  { label: 'Total Revenue', value: '$150.00', sublabel: null, icon: DollarSign },
];

const sampleDailyIncome: DailyIncomeEntry[] = [
  { id: '1', date: '2026-02-28', user: 'Maria García', customer: 'Juan Pérez', order: 'ORD-2847' },
  { id: '2', date: '2026-02-28', user: 'Carlos López', customer: 'Tech Solutions SAC', order: 'ORD-2848' },
  { id: '3', date: '2026-02-27', user: 'Ana Martínez', customer: 'Edson Espinoza', order: 'ORD-2845' },
  { id: '4', date: '2026-02-27', user: 'Maria García', customer: 'Joffre Murrieta', order: 'ORD-2846' },
  { id: '5', date: '2026-02-26', user: 'Carlos López', customer: 'Xavier Medina', order: 'ORD-2842' },
  { id: '6', date: '2026-02-26', user: 'Pedro Sánchez', customer: 'Ken Marcelino Ortiz', order: 'ORD-2843' },
  { id: '7', date: '2026-02-25', user: 'Ana Martínez', customer: 'Corporación ABC', order: 'ORD-2839' },
  { id: '8', date: '2026-02-25', user: 'Maria García', customer: 'Taller El Rápido', order: 'ORD-2840' },
  { id: '9', date: '2026-02-24', user: 'Carlos López', customer: 'Juan Pérez', order: 'ORD-2836' },
  { id: '10', date: '2026-02-24', user: 'Pedro Sánchez', customer: 'Tech Solutions SAC', order: 'ORD-2837' },
];

const exportOptions = { title: 'Daily Income', filename: 'daily-income' };

export function IncomePage() {
  const filteredDataRef = useRef<DailyIncomeEntry[]>([]);

  const onFilteredDataChange = useCallback(
    (_filters: DataTableFilterState, filteredData: DailyIncomeEntry[]) => {
      filteredDataRef.current = filteredData;
    },
    []
  );

  const exportPDF = () =>
    exportTableToPDF(incomeColumns, filteredDataRef.current, exportOptions);
  const exportExcel = () =>
    exportTableToExcel(incomeColumns, filteredDataRef.current, exportOptions);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Revenue - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[{ label: 'Catalog & Finance', icon: Home }, { label: 'Income' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueKpis.map(({ label, value, sublabel, icon }) => (
          <KpiCard key={label} label={label} value={value} sublabel={sublabel} icon={icon} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Daily Income
          </h2>
        </div>
        <DataTableWithToolbar<DailyIncomeEntry>
          data={sampleDailyIncome}
          columns={incomeColumns}
          searchFields={['date', 'user', 'customer', 'order']}
          searchPlaceholder="Look for:"
          dateColumnId="date"
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={10}
          onFilteredDataChange={onFilteredDataChange}
          rightContent={
            <ButtonGroup>
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
                leftIcon={FileText}
                onClick={exportPDF}
                title="Export PDF"
                className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                aria-label="Export PDF"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={LayoutGrid}
                title="Columns"
                className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                aria-label="Columns"
              />
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  );
}
