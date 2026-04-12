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
import { getOrderProgressStagesPublic, type OrderProgressStage } from '../api/orderProgressStages';
import { stateLabel } from '../pages/admin/orders/constants';

export interface AgendaItem {
  date: string;
  customer: string;
  /** Resolved label for `progressStageKey` (falls back to legacy state label). */
  stage: string;
  state: string;
  service: string;
  advancement: string;
  total: string;
}

const columns: TableColumn<AgendaItem>[] = [
  {
    id: 'date',
    name: 'Fecha',
    selector: (row) => row.date,
    sortable: true,
    sortFunction: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  },
  { id: 'customer', name: 'Cliente', selector: (row) => row.customer, sortable: true },
  { id: 'stage', name: 'Etapa', selector: (row) => row.stage, sortable: true },
  { id: 'state', name: 'Estado', selector: (row) => row.state, sortable: true },
  { id: 'service', name: 'Servicio', selector: (row) => row.service, sortable: true },
  { id: 'advancement', name: 'Avance', selector: (row) => row.advancement, sortable: true },
  {
    id: 'total',
    name: 'Total',
    selector: (row) => row.total,
    sortable: true,
    sortFunction: (a, b) => parseFloat(a.total.replace(/,/g, '')) - parseFloat(b.total.replace(/,/g, '')),
  },
];

const exportOptions = { title: 'Agenda', filename: 'agenda' };

export function AgendaItemsTable() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [stages, setStages] = useState<OrderProgressStage[]>([]);
  const filteredDataRef = useRef<AgendaItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!token) {
        if (mounted) {
          setOrders([]);
          setStages([]);
        }
        return;
      }
      try {
        const [{ orders: list }, { stages: stageList }] = await Promise.all([
          getOrders(token, { limit: 200 }),
          getOrderProgressStagesPublic(),
        ]);
        if (mounted) {
          setOrders(list);
          setStages(stageList);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setOrders([]);
          setStages([]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const stageByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of stages) {
      m.set(s.key, s.label);
    }
    return m;
  }, [stages]);

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

      const stageLabel =
        stageByKey.get((o.progressStageKey ?? '').trim()) ?? stateLabel[o.state] ?? o.state;

      return {
        date: formattedDate,
        customer: o.customer,
        stage: stageLabel,
        state: o.state,
        service: o.type,
        advancement: advancementDisplay,
        total: total.toFixed(2),
      };
    });
  }, [orders, stageByKey]);

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
        searchFields={['customer', 'service', 'stage', 'state']}
        searchPlaceholder="Search..."
        dateColumnId="date"
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
        onFilteredDataChange={onFilteredDataChange}
        rightContent={
          <ButtonGroup>
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={exportPDF} title="Exportar PDF" className="p-2" aria-label="Exportar PDF" />
            <Button variant="secondary" size="sm" leftIcon={FileSpreadsheet} onClick={exportExcel} title="Exportar Excel" className="p-2" aria-label="Exportar Excel" />
          </ButtonGroup>
        }
      />
    </Card>
  );
}
