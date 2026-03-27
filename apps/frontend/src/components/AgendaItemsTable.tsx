import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DataTableWithToolbar,
  exportTableToPDF,
  exportTableToExcel,
  type TableColumn,
  type DataTableFilterState,
} from './datatable';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, Button, ButtonGroup } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { getOrders, type OrderListItem } from '../api/orders';

export interface AgendaItem {
  date: string;
  customer: string;
  area: string;
  state: string;
  service: string;
  advancement: string;
  total: string;
}

const columns: TableColumn<AgendaItem>[] = [
  {
    id: 'date',
    name: 'Date',
    selector: (row) => row.date,
    sortable: true,
    sortFunction: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  },
  { id: 'customer', name: 'Customer', selector: (row) => row.customer, sortable: true },
  { id: 'area', name: 'Area', selector: (row) => row.area, sortable: true },
  { id: 'state', name: 'State', selector: (row) => row.state, sortable: true },
  { id: 'service', name: 'Service', selector: (row) => row.service, sortable: true },
  { id: 'advancement', name: 'Advancement', selector: (row) => row.advancement, sortable: true },
  {
    id: 'total',
    name: 'Total',
    selector: (row) => row.total,
    sortable: true,
    sortFunction: (a, b) => parseFloat(a.total.replace(/,/g, '')) - parseFloat(b.total.replace(/,/g, '')),
  },
];

const exportOptions = { title: 'Agenda Items', filename: 'agenda-items' };

export function AgendaItemsTable() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const filteredDataRef = useRef<AgendaItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        if (mounted) setOrders([]);
        return;
      }
      try {
        const { orders: list } = await getOrders(token, { limit: 200 });
        if (mounted) setOrders(list);
      } catch (err) {
        console.error(err);
        if (mounted) setOrders([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const data: AgendaItem[] = useMemo(() => {
    if (!orders.length) return [];

    return orders.map((o) => {
      const total = Number.isFinite(Number(o.total)) ? Number(o.total) : 0;
      const advancementNum = Number.isFinite(Number(o.advancement)) ? Number(o.advancement) : 0;
      const advancementPercent = total > 0 ? `${Math.round((advancementNum / total) * 100)}%` : '0%';
      const advancementDisplay = `${advancementNum.toFixed(2)} (${advancementPercent})`;

      const created = o.createdAt ? new Date(o.createdAt) : null;
      const yyyy = created ? created.getFullYear() : '';
      const mm = created ? String(created.getMonth() + 1).padStart(2, '0') : '';
      const dd = created ? String(created.getDate()).padStart(2, '0') : '';
      const formattedDate = created ? `${yyyy}-${mm}-${dd}` : '';

      return {
        date: formattedDate,
        customer: o.customer,
        area: o.area,
        state: o.state,
        service: o.type,
        advancement: advancementDisplay,
        total: total.toFixed(2),
      };
    });
  }, [orders]);

  const defaultStartDate = useMemo(() => {
    if (!data.length) return undefined;
    const dates = data
      .map((d) => new Date(d.date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    if (!dates.length) return undefined;
    const first = dates[0];
    const yyyy = first.getFullYear();
    const mm = String(first.getMonth() + 1).padStart(2, '0');
    const dd = String(first.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [data]);

  const defaultEndDate = useMemo(() => {
    if (!data.length) return undefined;
    const dates = data
      .map((d) => new Date(d.date))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    if (!dates.length) return undefined;
    const last = dates[0];
    const yyyy = last.getFullYear();
    const mm = String(last.getMonth() + 1).padStart(2, '0');
    const dd = String(last.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [data]);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: AgendaItem[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(columns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(columns, filteredDataRef.current, exportOptions);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Agenda Items" />
      <DataTableWithToolbar<AgendaItem>
        data={data}
        columns={columns}
        searchFields={['customer', 'service', 'state']}
        searchPlaceholder="Search..."
        dateColumnId="date"
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
        onFilteredDataChange={onFilteredDataChange}
        rightContent={
          <ButtonGroup>
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={exportPDF} title="Export PDF" className="p-2" aria-label="Export PDF" />
            <Button variant="secondary" size="sm" leftIcon={FileSpreadsheet} onClick={exportExcel} title="Export Excel" className="p-2" aria-label="Export Excel" />
          </ButtonGroup>
        }
      />
    </Card>
  );
}
