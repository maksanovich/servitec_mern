import { DoorOpen, Wrench, Package, Truck, Clock, ShieldAlert, Archive } from 'lucide-react';
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
  income: 'En recepcion',
  maintenance: 'En mantenimiento',
  warehouse: 'En almacen',
  delivery: 'En entrega',
  waiting: 'En espera de repuesto',
  no_solution: 'Sin solucion',
  finished: 'Finalizado',
};

export const AREA_TABS: { id: OrderArea; label: string; icon: typeof Wrench }[] = [
  { id: 'entrance', label: 'Entrance Area', icon: DoorOpen },
  { id: 'maintenance', label: 'Maintenance Area', icon: Wrench },
  { id: 'warehouse', label: 'Warehouse Area', icon: Package },
  { id: 'delivery', label: 'Delivery Area', icon: Truck },
  { id: 'quarantine', label: 'Quarantine Area', icon: ShieldAlert },
  { id: 'abandonment', label: 'Abandonment Area', icon: Archive },
  { id: 'waiting-parts', label: 'Waiting for spare parts', icon: Clock },
];
