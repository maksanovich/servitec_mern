import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Home, DollarSign, FileText, FileSpreadsheet } from 'lucide-react';
import { PageHeader, KpiCard, Card, Button, ButtonGroup } from '../../components/ui';
import {
  DataTableWithToolbar,
  type DataTableFilterState,
  exportTableToPDF,
  exportTableToExcel,
} from '../../components/datatable';
import { incomeColumns } from './income/incomeColumns';
import type { DailyIncomeEntry } from './income/types';
import { useAuth } from '../../contexts/AuthContext';
import { getOrders, type OrderListItem } from '../../api/orders';

const exportOptions = { title: 'Daily Income', filename: 'daily-income' };

export function IncomePage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const filteredDataRef = useRef<DailyIncomeEntry[]>([]);
  const todayFilter = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        if (mounted) {
          setOrders([]);
        }
        return;
      }
      setLoading(true);
      try {
        const { orders: list } = await getOrders(token, { limit: 200 });
        if (mounted) {
          setOrders(list);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setOrders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const { revenueKpis, dailyIncomeRows } = useMemo(() => {
    if (!orders.length) {
      return {
        revenueKpis: [
          { label: 'Income', value: '$0.00', sublabel: 'Daily' as const, icon: DollarSign },
          { label: 'Weekly Income', value: '$0.00', sublabel: 'Total' as const, icon: DollarSign },
          { label: 'Monthly Income', value: '$0.00', sublabel: null, icon: DollarSign },
          { label: 'Total Revenue', value: '$0.00', sublabel: null, icon: DollarSign },
        ],
        dailyIncomeRows: [] as DailyIncomeEntry[],
      };
    }

    const safeTotal = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 6);
    const endOfWeek = new Date(endOfToday);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    let dailyIncome = 0;
    let weeklyIncome = 0;
    let monthlyIncome = 0;
    let totalRevenue = 0;

    const rows: DailyIncomeEntry[] = [];

    const toDateOnly = (value?: string) => {
      if (!value) return '-';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '-';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    for (const o of orders) {
      const amount = safeTotal(o.total);
      totalRevenue += amount;

      const createdAt = o.createdAt ? new Date(o.createdAt) : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        if (createdAt >= startOfToday && createdAt < endOfToday) {
          dailyIncome += amount;
        }
        if (createdAt >= startOfWeek && createdAt < endOfWeek) {
          weeklyIncome += amount;
        }
        if (createdAt >= startOfMonth && createdAt < endOfMonth) {
          monthlyIncome += amount;
        }

        rows.push({
          id: o.id,
          date: toDateOnly(o.createdAt),
          user: o.technical || '',
          customer: o.customer,
          order: o.no || o.code,
          amount,
        });
      }
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const kpis = [
      { label: 'Income', value: `$${dailyIncome.toFixed(2)}`, sublabel: 'Daily' as const, icon: DollarSign },
      {
        label: 'Weekly Income',
        value: `$${weeklyIncome.toFixed(2)}`,
        sublabel: 'Total' as const,
        icon: DollarSign,
      },
      {
        label: 'Monthly Income',
        value: `$${monthlyIncome.toFixed(2)}`,
        sublabel: null,
        icon: DollarSign,
      },
      {
        label: 'Total Revenue',
        value: `$${totalRevenue.toFixed(2)}`,
        sublabel: null,
        icon: DollarSign,
      },
    ];

    return {
      revenueKpis: kpis,
      dailyIncomeRows: rows,
    };
  }, [orders]);

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
          <KpiCard
            key={label}
            label={label}
            value={loading && value !== '$0.00' ? 'Loading…' : value}
            sublabel={sublabel}
            icon={icon}
          />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Daily Income
          </h2>
        </div>
        <DataTableWithToolbar<DailyIncomeEntry>
          data={dailyIncomeRows}
          columns={incomeColumns}
          searchFields={['date', 'user', 'customer', 'order', 'amount']}
          searchPlaceholder="Look for:"
          dateColumnId="date"
          defaultStartDate={todayFilter}
          defaultEndDate={todayFilter}
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
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  );
}
