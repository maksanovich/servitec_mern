import { apiFetch, publicApiFetch } from './client';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OrderArea = 'entrance' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting-parts';
export type OrderState = 'income' | 'maintenance' | 'warehouse' | 'delivery' | 'waiting' | 'no_solution' | 'finished';
export type OrderWorkflow = 'standard' | 'warranty';

export interface OrderListItem {
  id: string;
  no: string;
  code: string;
  createdAt?: string;
  priority: OrderPriority;
  state: OrderState;
  area: OrderArea;
  progressStageKey?: string;
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
  advancement: number;
}

export async function getOrders(
  token: string | null,
  params: { area?: string; state?: string; search?: string; limit?: number; workflow?: OrderWorkflow } = {}
): Promise<{ orders: OrderListItem[] }> {
  if (!token) return { orders: [] };
  const sp = new URLSearchParams();
  if (params.area) sp.set('area', params.area);
  if (params.state) sp.set('state', params.state);
  if (params.search) sp.set('search', params.search);
  if (params.workflow) sp.set('workflow', params.workflow);
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
  fianceeDate?: string;
  advancement?: number | string;
  accessories?: string[];
  budgetLines?: Array<{ serviceId: string; name: string; price: number; amount: number; total: number }>;
  /** One URL (legacy) or several image URLs */
  photoBeforeRepair?: string | string[];
  photoAfterRepair?: string | string[];
}

export class CreateOrderError extends Error {
  readonly code?: string;
  readonly clientId?: number;

  constructor(message: string, opts?: { code?: string; clientId?: number }) {
    super(message);
    this.name = 'CreateOrderError';
    Object.setPrototypeOf(this, CreateOrderError.prototype);
    this.code = opts?.code;
    this.clientId = opts?.clientId;
  }
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
    if (data?.code === 'CLIENT_CONTACT_REQUIRED') {
      const cid = Number(data.clientId);
      throw new CreateOrderError(data.error || 'Client phone and email are required', {
        code: data.code,
        clientId: Number.isFinite(cid) ? cid : undefined,
      });
    }
    throw new Error(data.error || 'Failed to create order');
  }
  return data;
}

export interface OrderBudgetLine {
  serviceId: string;
  name: string;
  price: number;
  amount: number;
  total: number;
}

export interface OrderDetail {
  id: string;
  no: string;
  code: string;
  createdAt?: string;
  priority: OrderPriority;
  state: OrderState;
  area: OrderArea;
  progressStageKey?: string;
  type: string;

  clientId: number;
  customer: string;
  customerId: string;
  customerPhone?: string;

  brand: string;
  model: string;
  series: string;

  technicianId: string;
  technical?: string;

  equipmentCondition: string;
  technicalReport: string;
  diagnosis: boolean;
  warranty: boolean;
  fianceeDate: string;
  advancement: number;

  accessories: string[];
  budgetLines: OrderBudgetLine[];
  total: number;

  photoBeforeRepair: string[];
  photoAfterRepair: string[];
}

/** Public tracking response (by code, no auth) */
export interface OrderTrackPublic {
  code: string;
  state: OrderState;
  area: OrderArea;
  progressStageKey?: string;
  workflow?: OrderWorkflow;
  type: string;
  customer: string;
  brand: string;
  model: string;
  series: string;
  equipment: string;
  createdAt?: string;
  photoBeforeRepair: string[];
  photoAfterRepair: string[];
  equipmentCondition?: string;
  technicalReport?: string;
  warranty?: boolean;
  whatsappLink?: string;
}

/** Order showcase item for landing page */
export interface OrderShowcaseItem {
  code: string;
  type: string;
  brand: string;
  model: string;
  series: string;
  photoBeforeRepair: string[];
  photoAfterRepair: string[];
  equipmentCondition: string;
  technicalReport: string;
  createdAt?: string;
}

export type UpdateOrderPayload = Partial<{
  clientId: number;
  brand: string;
  model: string;
  series: string;
  type: string;
  progressStageKey: string;
  area: OrderArea;
  state: OrderState;
  technician: string;
  priority: OrderPriority;
  equipmentCondition: string;
  technicalReport: string;
  diagnosis: 'yes' | 'no' | boolean;
  warranty: 'yes' | 'no' | boolean;
  fianceeDate: string;
  advancement: number | string;
  accessories: string[];
  budgetLines: Array<{ serviceId: string; name: string; price: number; amount: number; total: number }>;
  photoBeforeRepair?: string | string[] | null;
  photoAfterRepair?: string | string[] | null;
}>;

export async function getOrderById(
  token: string | null,
  id: string
): Promise<{ order: OrderDetail }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/orders/${id}`, { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
  return data;
}

export async function updateOrder(
  token: string | null,
  id: string,
  payload: UpdateOrderPayload
): Promise<{ order: OrderDetail; whatsappLink?: string }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/orders/${id}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update order');
  return data;
}

export async function deleteOrder(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/orders/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete order');
  }
}

export async function trackOrderByCode(code: string): Promise<{ order: OrderTrackPublic }> {
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Tracking code is required');
  const res = await publicApiFetch(`/orders/track/${encodeURIComponent(trimmed)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to track order');
  return data;
}

/** Same rules as backend: warehouse / delivery / finished, or warehouse area. */
export function isOrderEligibleForTechnicalReport(o: Pick<OrderTrackPublic, 'state' | 'area'>): boolean {
  return (
    o.state === 'warehouse' ||
    o.state === 'delivery' ||
    o.state === 'finished' ||
    o.area === 'warehouse'
  );
}

export async function downloadTechnicalReportDocx(code: string): Promise<void> {
  const trimmed = code.trim();
  if (!trimmed) throw new Error('Tracking code is required');
  const res = await publicApiFetch(`/orders/track/${encodeURIComponent(trimmed)}/technical-report`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Failed to download report');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-tecnico-${trimmed}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function getOrdersShowcase(limit = 6): Promise<{ orders: OrderShowcaseItem[] }> {
  const res = await publicApiFetch(`/orders/showcase?limit=${limit}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch showcase');
  return data;
}

export async function getOrderShowcaseByCode(
  code: string
): Promise<{ order: OrderShowcaseItem } | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const res = await publicApiFetch(`/orders/showcase/${encodeURIComponent(trimmed)}`);
  const data = await res.json();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(data.error || 'Failed to fetch showcase entry');
  return data;
}

