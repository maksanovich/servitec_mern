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
  income: 'En recepción',
  maintenance: 'En mantenimiento',
  warehouse: 'En almacén',
  delivery: 'En entrega',
  waiting: 'En espera de repuesto',
  no_solution: 'Sin solución',
  finished: 'Finalizado',
};

export const AREA_TABS: { id: OrderArea; label: string; icon: typeof Wrench }[] = [
  { id: 'entrance', label: 'Área de ingreso', icon: DoorOpen },
  { id: 'maintenance', label: 'Área de mantenimiento', icon: Wrench },
  { id: 'warehouse', label: 'Área de almacén', icon: Package },
  { id: 'delivery', label: 'Área de entrega', icon: Truck },
  { id: 'quarantine', label: 'Área de cuarentena', icon: ShieldAlert },
  { id: 'abandonment', label: 'Área de abandono', icon: Archive },
  { id: 'waiting-parts', label: 'Espera de repuestos', icon: Clock },
];
