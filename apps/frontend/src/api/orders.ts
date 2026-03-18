import { apiFetch } from './client';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OrderArea = 'entrance' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting-parts';
export type OrderState = 'income' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting' | 'no_solution' | 'finished';

export interface OrderListItem {
  id: string;
  no: string;
  code: string;
  priority: OrderPriority;
  state: OrderState;
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

export async function getOrders(
  token: string | null,
  params: { area?: string; state?: string; search?: string; limit?: number } = {}
): Promise<{ orders: OrderListItem[] }> {
  if (!token) return { orders: [] };
  const sp = new URLSearchParams();
  if (params.area) sp.set('area', params.area);
  if (params.state) sp.set('state', params.state);
  if (params.search) sp.set('search', params.search);
  if (params.limit != null) sp.set('limit', String(params.limit));
  const qs = sp.toString();
  const res = await apiFetch(qs ? `/orders?${qs}` : '/orders', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch orders');
  }
  return data;
}

export interface CreateOrderPayload {
  branch: string;
  clientId: number;
  brand: string;
  model: string;
  series: string;
  type: string;
  area: OrderArea;
  state: OrderState;
  technician: string;
  priority: OrderPriority;
  equipmentCondition?: string;
  technicalReport?: string;
  diagnosis?: 'yes' | 'no' | boolean;
  warranty?: 'yes' | 'no' | boolean;
  password?: string;
  fianceeDate?: string;
  advancement?: number | string;
  accessories?: string[];
  budgetLines?: Array<{ serviceId: string; name: string; price: number; amount: number; total: number }>;
}

export async function createOrder(
  token: string | null,
  payload: CreateOrderPayload
): Promise<{ order: OrderListItem }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/orders', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create order');
  }
  return data;
}

