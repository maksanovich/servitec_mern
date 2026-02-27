export type OrderArea =
  | 'entrance'
  | 'maintenance'
  | 'warehouse'
  | 'delivery'
  | 'waiting-parts';

export interface Order {
  id: string;
  no: string;
  code: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  state: 'income' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting' | 'no_solution' | 'finished';
  area: OrderArea;
  type: string;
  equipment: string;
  series: string;
  customer: string;
  customerId: string;
  technical: string;
  total: number;
  branch: string;
}
