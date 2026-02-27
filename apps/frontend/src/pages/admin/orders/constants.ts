import { DoorOpen, Wrench, Package, Truck, Clock } from 'lucide-react';
import type { Order, OrderArea } from './types';

export const priorityVariant: Record<Order['priority'], 'neutral' | 'success' | 'warning' | 'error'> = {
  low: 'neutral',
  normal: 'success',
  high: 'warning',
  urgent: 'error',
};

export const stateVariant: Record<Order['state'], 'success' | 'info' | 'warning' | 'neutral' | 'error'> = {
  income: 'success',
  maintenance: 'info',
  warehouse: 'warning',
  delivery: 'success',
  waiting: 'neutral',
  no_solution: 'error',
  finished: 'success',
};

export const stateLabel: Record<Order['state'], string> = {
  income: 'Income',
  maintenance: 'Maintenance',
  warehouse: 'Warehouse',
  delivery: 'Delivery',
  waiting: 'Waiting',
  no_solution: 'No Solution',
  finished: 'Finished',
};

export const AREA_TABS: { id: OrderArea; label: string; icon: typeof Wrench }[] = [
  { id: 'entrance', label: 'Entrance Area', icon: DoorOpen },
  { id: 'maintenance', label: 'Maintenance Area', icon: Wrench },
  { id: 'warehouse', label: 'Warehouse Area', icon: Package },
  { id: 'delivery', label: 'Delivery Area', icon: Truck },
  { id: 'waiting-parts', label: 'Waiting Area Spare Parts', icon: Clock },
];
