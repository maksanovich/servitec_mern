import { apiFetch, publicApiFetch } from './client';
import type { OrderArea, OrderState, OrderWorkflow } from './orders';

export type OrderProgressStageLegacyArea = OrderArea;

export interface OrderProgressStage {
  id: string;
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  workflow: OrderWorkflow;
  legacyArea: OrderProgressStageLegacyArea;
  legacyState: OrderState;
  budgetEditable: boolean;
  requiresAfterRepairPhoto: boolean;
  requiresDeliveryAdvance: boolean;
}

export async function getOrderProgressStagesPublic(
  workflow?: OrderWorkflow
): Promise<{ stages: OrderProgressStage[] }> {
  const qs = workflow ? `?workflow=${encodeURIComponent(workflow)}` : '';
  const res = await publicApiFetch(`/order-progress-stages/public${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to fetch order progress stages');
  return data;
}

export async function getOrderProgressStagesAdmin(
  token: string | null,
  workflow?: OrderWorkflow
): Promise<{ stages: OrderProgressStage[] }> {
  if (!token) throw new Error('Not authenticated');
  const qs = workflow ? `?workflow=${encodeURIComponent(workflow)}` : '';
  const res = await apiFetch(`/order-progress-stages${qs}`, { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to fetch order progress stages');
  return data;
}

export async function createOrderProgressStage(
  token: string | null,
  payload: {
    key: string;
    label: string;
    description?: string;
    sortOrder?: number;
    legacyArea: OrderArea;
    workflow?: OrderWorkflow;
  }
): Promise<{ stage: OrderProgressStage }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/order-progress-stages', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to create order progress stage');
  return data;
}

export async function updateOrderProgressStage(
  token: string | null,
  id: string,
  payload: Partial<{ label: string; description?: string; sortOrder: number; legacyArea: OrderArea; workflow: OrderWorkflow }>
): Promise<{ stage: OrderProgressStage }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/order-progress-stages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to update order progress stage');
  return data;
}

export async function deleteOrderProgressStage(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/order-progress-stages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || 'Failed to delete order progress stage');
  }
}

