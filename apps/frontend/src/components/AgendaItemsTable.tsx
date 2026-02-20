import { useMemo, useState } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BarChart3, FileText, List, CalendarDays, Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader } from './ui';
import { Button, ButtonGroup } from './ui';
import { DateRangePicker } from './ui';
import { Input } from './ui';
import { useTheme } from '../contexts/ThemeContext';

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
  { name: 'Branch', selector: (row) => row.branch, sortable: true },
  { name: 'Date', selector: (row) => row.date, sortable: true },
  { name: 'Customer', selector: (row) => row.customer, sortable: true },
  { name: 'Area', selector: (row) => row.area, sortable: true },
  { name: 'State', selector: (row) => row.state, sortable: true },
  { name: 'Service', selector: (row) => row.service, sortable: true },
  { name: 'Advancement', selector: (row) => row.advancement, sortable: true },
  { name: 'Total', selector: (row) => row.total, sortable: true },
  { name: 'Debt', selector: (row) => row.debt, sortable: true },
];

// Sample data - replace with API data when available
const sampleData: AgendaItem[] = [];

const customStyles = {
  headCells: {
    style: {
      backgroundColor: 'rgb(241 245 249)',
      color: 'rgb(15 23 42)',
      fontWeight: 600,
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
    },
  },
  cells: {
    style: {
      fontSize: '0.875rem',
      padding: '0.75rem 1rem',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
    },
  },
};

const darkCustomStyles = {
  headCells: {
    style: {
      backgroundColor: 'rgb(30 41 59)',
      color: 'rgb(248 250 252)',
      fontWeight: 600,
      fontSize: '0.8125rem',
      padding: '0.75rem 1rem',
    },
  },
  cells: {
    style: {
      fontSize: '0.875rem',
      padding: '0.75rem 1rem',
      color: 'rgb(226 232 240)',
    },
  },
  rows: {
    style: {
      minHeight: '48px',
      backgroundColor: 'rgb(15 23 42)',
      '&:hover': {
        backgroundColor: 'rgb(30 41 59)',
      },
    },
  },
};

export function AgendaItemsTable() {
  const { isDark } = useTheme();
  const [startDate, setStartDate] = useState('2026-02-20');
  const [endDate, setEndDate] = useState('2026-02-20');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sampleData;
    const q = searchQuery.toLowerCase();
    return sampleData.filter(
      (row) =>
        row.branch.toLowerCase().includes(q) ||
        row.customer.toLowerCase().includes(q) ||
        row.service.toLowerCase().includes(q) ||
        row.state.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const getRowValues = (row: AgendaItem) =>
    columns.map((col) => {
      const val = col.selector ? (col.selector as (r: AgendaItem) => unknown)(row) : '';
      return String(val ?? '');
    });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Agenda Items', 14, 20);
    autoTable(doc, {
      head: [columns.map((c) => (c.name as string) || '')],
      body: filteredData.map(getRowValues),
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save('agenda-items.pdf');
  };

  const exportExcel = () => {
    const wsData = [
      columns.map((c) => c.name as string),
      ...filteredData.map(getRowValues),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agenda Items');
    XLSX.writeFile(wb, 'agenda-items.xlsx');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Agenda Items"
        actions={
          <>
            <ButtonGroup>
              <Button variant="emerald" size="sm" leftIcon={BarChart3}>
                Chart
              </Button>
              <Button variant="red" size="sm" leftIcon={FileText}>
                Document
              </Button>
              <Button variant="amber" size="sm" leftIcon={List}>
                List
              </Button>
              <Button variant="orange" size="sm" leftIcon={CalendarDays}>
                Calendar
              </Button>
            </ButtonGroup>
            <ButtonGroup>
            <Button variant="secondary" size="sm" leftIcon={Download} onClick={exportPDF}>
              Export PDF
            </Button>
            <Button variant="secondary" size="sm" leftIcon={FileSpreadsheet} onClick={exportExcel}>
              Export Excel
            </Button>
            </ButtonGroup>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1.5 text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
            />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40"
            />
          </>
        }
      />
      <div className="px-5 pb-5">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={pageSize}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          noDataComponent={
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              No data available in this table.
            </div>
          }
          theme={isDark ? 'dark' : 'light'}
          customStyles={isDark ? darkCustomStyles : customStyles}
          paginationComponentOptions={{
            rowsPerPageText: 'Show',
            rangeSeparatorText: 'of',
            selectAllRowsItem: true,
            selectAllRowsItemText: 'All',
          }}
        />
      </div>
    </Card>
  );
}
