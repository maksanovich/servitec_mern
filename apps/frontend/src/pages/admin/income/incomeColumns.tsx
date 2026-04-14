import type { TableColumn } from '../../../components/datatable';
import type { DailyIncomeEntry } from './types';

export const incomeColumns: TableColumn<DailyIncomeEntry>[] = [
  {
    id: 'date',
    name: 'Fecha',
    selector: (row) => row.date,
    sortable: true,
    width: '180px',
  },
  {
    id: 'user',
    name: 'Usuario',
    selector: (row) => row.user,
    sortable: true,
    minWidth: '160px',
  },
  {
    id: 'customer',
    name: 'Cliente',
    selector: (row) => row.customer,
    sortable: true,
    minWidth: '200px',
  },
  {
    id: 'order',
    name: 'Orden',
    selector: (row) => row.order,
    sortable: true,
    minWidth: '140px',
  },
  {
    id: 'amount',
    name: 'Importe',
    selector: (row) => row.amount,
    sortable: true,
    sortFunction: (a, b) => a.amount - b.amount,
    width: '140px',
    cell: (row) => <span className="font-medium">${row.amount.toFixed(2)}</span>,
  },
];
