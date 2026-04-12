import { useEffect, useMemo, useState } from 'react';
import { Home, DollarSign, Wrench } from 'lucide-react';
import {
  PageHeader,
  KpiCard,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from '../../components/ui';
import { AgendaItemsTable } from '../../components/AgendaItemsTable';
import { useAuth } from '../../contexts/AuthContext';
import { getOrders, type OrderListItem } from '../../api/orders';

interface LargestInvestmentRow {
  date: string;
  customer: string;
  id: string;
  amount: number;
}

interface MostOrdersRow {
  date: string;
  customer: string;
  id: string;
  orders: number;
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function DashboardPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        if (mounted) setOrders([]);
        return;
      }
      setLoading(true);
      try {
        const { orders: list } = await getOrders(token, { limit: 200 });
        if (mounted) setOrders(list);
      } catch (err) {
        console.error(err);
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const { kpiData, largestInvestmentData, mostOrdersData } = useMemo(() => {
    if (!orders.length) {
      return {
        kpiData: [
          { label: 'Ingresos', value: '$0.00', sublabel: 'Total' as const, icon: DollarSign },
          { label: 'Pedidos', value: '0', sublabel: 'Total' as const, icon: Wrench },
          { label: 'En mantenimiento', value: '0', sublabel: null, icon: Wrench },
          { label: 'En entrega', value: '0', sublabel: null, icon: Wrench },
        ],
        largestInvestmentData: [] as LargestInvestmentRow[],
        mostOrdersData: [] as MostOrdersRow[],
      };
    }

    const safeTotal = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const totalIncome = orders.reduce((sum, o) => sum + safeTotal(o.total), 0);
    const totalOrders = orders.length;
    const maintenanceOrders = orders.filter((o) => o.area === 'maintenance').length;
    const deliveredOrders = orders.filter((o) => o.state === 'delivery').length;

    const kpiDataComputed = [
      { label: 'Ingresos', value: `$${totalIncome.toFixed(2)}`, sublabel: 'Total' as const, icon: DollarSign },
      { label: 'Pedidos', value: String(totalOrders), sublabel: 'Total' as const, icon: Wrench },
      { label: 'En mantenimiento', value: String(maintenanceOrders), sublabel: null, icon: Wrench },
      { label: 'En entrega', value: String(deliveredOrders), sublabel: null, icon: Wrench },
    ];

    const byCustomer = new Map<
      string,
      { customer: string; id: string; amount: number; orders: number; lastDate?: string }
    >();

    for (const o of orders) {
      const id = o.customerId || o.customer;
      const key = id || o.customer || 'unknown';
      const entry = byCustomer.get(key) ?? {
        customer: o.customer,
        id,
        amount: 0,
        orders: 0,
        lastDate: o.createdAt,
      };
      entry.amount += safeTotal(o.total);
      entry.orders += 1;
      if (o.createdAt) {
        if (!entry.lastDate || new Date(o.createdAt) > new Date(entry.lastDate)) {
          entry.lastDate = o.createdAt;
        }
      }
      byCustomer.set(key, entry);
    }

    const largestInvestmentDataComputed: LargestInvestmentRow[] = Array.from(byCustomer.values())
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((r) => ({
        date: formatDateTime(r.lastDate),
        customer: r.customer,
        id: r.id,
        amount: r.amount,
      }));

    const mostOrdersDataComputed: MostOrdersRow[] = Array.from(byCustomer.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)
      .map((r) => ({
        date: formatDateTime(r.lastDate),
        customer: r.customer,
        id: r.id,
        orders: r.orders,
      }));

    return {
      kpiData: kpiDataComputed,
      largestInvestmentData: largestInvestmentDataComputed,
      mostOrdersData: mostOrdersDataComputed,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel - DIGITALSERVER TECHNICAL SERVICE"
        breadcrumb={[{ label: 'Panel', icon: Home }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map(({ label, value, sublabel, icon }) => (
          <KpiCard
            key={label}
            label={label}
            value={loading && value !== '$0.00' ? 'Cargando…' : value}
            sublabel={sublabel}
            icon={icon}
          />
        ))}
      </div>

      <AgendaItemsTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader title="Cliente con mayor inversión" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader columns={['Fecha', 'Cliente', 'Inversión']} />
              <TableBody>
                {largestInvestmentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No hay datos disponibles.</TableCell>
                  </TableRow>
                ) : (
                  largestInvestmentData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        {row.customer} ({row.id})
                      </TableCell>
                      <TableCell>
                        <Badge>${row.amount.toFixed(2)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Cliente con más pedidos" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader columns={['Fecha', 'Cliente', 'Pedidos']} />
              <TableBody>
                {mostOrdersData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No hay datos disponibles.</TableCell>
                  </TableRow>
                ) : (
                  mostOrdersData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        {row.customer} ({row.id})
                      </TableCell>
                      <TableCell>
                        <Badge>{row.orders}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

