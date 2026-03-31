export type OrderArea =
  | 'entrance'
  | 'maintenance'
  | 'warehouse'
  | 'delivery'
  | 'waiting-parts';

export type OrderWorkflow = 'standard' | 'warranty';

export interface Order {
  id: string;
  no: string;
  code: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  state: 'income' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting' | 'no_solution' | 'finished';
  area: OrderArea;
  progressStageKey?: string;
  /** Standard repair vs warranty pipeline (from API). */
  workflow?: OrderWorkflow;
  type: string;
  equipment: string;
  series: string;
  customer: string;
  customerId: string;
  customerPhone?: string;
  technical: string;
  equipmentCondition: string;
  technicalReport: string;
  total: number;
  createdAt?: string;
}
