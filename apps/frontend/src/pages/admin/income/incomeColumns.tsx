import type { TableColumn } from '../../../components/datatable';
import type { DailyIncomeEntry } from './types';

export const incomeColumns: TableColumn<DailyIncomeEntry>[] = [
  {
    id: 'date',
    name: 'Date',
    selector: (row) => row.date,
    sortable: true,
    width: '180px',
  },
  {
    id: 'user',
    name: 'User',
    selector: (row) => row.user,
    sortable: true,
    minWidth: '160px',
  },
  {
    id: 'customer',
    name: 'Customer',
    selector: (row) => row.customer,
    sortable: true,
    minWidth: '200px',
  },
  {
    id: 'order',
    name: 'Order',
    selector: (row) => row.order,
    sortable: true,
    minWidth: '140px',
  },
];
