import { useRef, useCallback } from 'react';
import {
  DataTableWithToolbar,
  exportTableToPDF,
  exportTableToExcel,
  type TableColumn,
  type DataTableFilterState,
} from './datatable';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, Button, ButtonGroup } from './ui';

export interface AgendaItem {
  branch: string;
  date: string;
  customer: string;
  area: string;
  state: string;
  service: string;
  advancement: string;
  total: string;
  debt: string;
}

const columns: TableColumn<AgendaItem>[] = [
  { id: 'branch', name: 'Branch', selector: (row) => row.branch, sortable: true },
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
  {
    id: 'debt',
    name: 'Debt',
    selector: (row) => row.debt,
    sortable: true,
    sortFunction: (a, b) => parseFloat(a.debt.replace(/,/g, '')) - parseFloat(b.debt.replace(/,/g, '')),
  },
];

const sampleData: AgendaItem[] = [
  { branch: 'Central', date: '2026-02-20', customer: 'Acme Corp', area: 'North', state: 'Scheduled', service: 'Maintenance', advancement: '25%', total: '1,200', debt: '0' },
  { branch: 'East', date: '2026-02-21', customer: 'Tech Solutions', area: 'South', state: 'In Progress', service: 'Installation', advancement: '60%', total: '3,500', debt: '500' },
  { branch: 'West', date: '2026-02-22', customer: 'Global Industries', area: 'Central', state: 'Pending', service: 'Repair', advancement: '0%', total: '890', debt: '0' },
  { branch: 'Central', date: '2026-02-23', customer: 'Metro Services', area: 'East', state: 'Completed', service: 'Inspection', advancement: '100%', total: '450', debt: '0' },
  { branch: 'North', date: '2026-02-24', customer: 'Prime Logistics', area: 'West', state: 'Scheduled', service: 'Maintenance', advancement: '10%', total: '2,100', debt: '200' },
  { branch: 'South', date: '2026-02-25', customer: 'City Utilities', area: 'North', state: 'In Progress', service: 'Upgrade', advancement: '75%', total: '5,800', debt: '1,200' },
];

const exportOptions = { title: 'Agenda Items', filename: 'agenda-items' };

export function AgendaItemsTable() {
  const filteredDataRef = useRef<AgendaItem[]>(sampleData);

  const onFilteredDataChange = useCallback((_filters: DataTableFilterState, filteredData: AgendaItem[]) => {
    filteredDataRef.current = filteredData;
  }, []);

  const exportPDF = () => exportTableToPDF(columns, filteredDataRef.current, exportOptions);
  const exportExcel = () => exportTableToExcel(columns, filteredDataRef.current, exportOptions);

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Agenda Items" />
      <DataTableWithToolbar<AgendaItem>
        data={sampleData}
        columns={columns}
        searchFields={['branch', 'customer', 'service', 'state']}
        searchPlaceholder="Search..."
        dateColumnId="date"
        defaultStartDate="2026-02-20"
        defaultEndDate="2026-02-25"
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
