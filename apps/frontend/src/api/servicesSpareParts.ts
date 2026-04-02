import { apiFetch } from './client';

export type ServiceSparePartType = 'service' | 'replacement';
export type ServiceSparePartState = 'active' | 'inactive';

export interface ServiceSparePartItem {
  id: string;
  type: ServiceSparePartType;
  name: string;
  amount: number;
  price: number;
  details: string;
  state: ServiceSparePartState;
  /** ISO timestamp — last DB update (e.g. Perseo sync). */
  syncedAt?: string | null;
}

/** Replacement parts with zero catalog stock cannot be added to an order budget. */
export function canAddCatalogItemToBudget(item: Pick<ServiceSparePartItem, 'type' | 'amount'>): boolean {
  if (item.type === 'replacement' && item.amount === 0) return false;
  return true;
}

export async function getServicesSpareParts(token: string | null): Promise<{ items: ServiceSparePartItem[] }> {
  if (!token) return { items: [] };
  const res = await apiFetch('/services-spare-parts', { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch services/spare parts');
  return data;
}

export async function createServiceSparePart(
  token: string | null,
  payload: Omit<ServiceSparePartItem, 'id'>
): Promise<{ item: ServiceSparePartItem }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/services-spare-parts', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create service/spare part');
  return data;
}

export async function updateServiceSparePart(
  token: string | null,
  id: string,
  payload: Partial<Omit<ServiceSparePartItem, 'id'>>
): Promise<{ item: ServiceSparePartItem }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/services-spare-parts/${id}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update service/spare part');
  return data;
}

export async function deleteServiceSparePart(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/services-spare-parts/${id}`, {
    method: 'DELETE',
    token,
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'Failed to delete service/spare part');
}

