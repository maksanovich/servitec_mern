import { apiFetch } from './client';

export type OrderWorkflow = 'standard' | 'warranty';

export type OrderMovementRow = {
  id: string;
  createdAt: string | null;
  orderId: string;
  orderNo: string;
  orderCode: string;
  orderedByUserId: string;
  orderedByName: string;
  orderedByEmail: string;
  beforeStageKey: string;
  afterStageKey: string;
  beforeStageLabel: string;
  afterStageLabel: string;
  workflow: OrderWorkflow;
};

export type ListOrderMovementsResult = {
  movements: OrderMovementRow[];
  total: number;
  limit: number;
  skip: number;
};

export async function listOrderMovements(
  token: string,
  params: {
    limit?: number;
    skip?: number;
    /** Tracking code (`Order.code`) or numeric order number (`Order.no`, digits only). */
    orderCode?: string;
    orderId?: string;
    workflow?: OrderWorkflow | '';
  }
): Promise<ListOrderMovementsResult> {
  const sp = new URLSearchParams();
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.skip != null) sp.set('skip', String(params.skip));
  if (params.orderCode?.trim()) sp.set('orderCode', params.orderCode.trim());
  if (params.orderId?.trim()) sp.set('orderId', params.orderId.trim());
  if (params.workflow === 'standard' || params.workflow === 'warranty') sp.set('workflow', params.workflow);
  const q = sp.toString();
  const res = await apiFetch(`/order-movements${q ? `?${q}` : ''}`, { token });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(String((err as { error?: string }).error ?? res.statusText));
  }
  return res.json() as Promise<ListOrderMovementsResult>;
}
