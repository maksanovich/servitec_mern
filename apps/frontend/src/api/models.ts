import { apiFetch } from './client';

export interface EquipmentModel {
  id: string;
  brand: string;
  model: string;
  state: 'active' | 'inactive';
}

export async function getModels(token: string | null): Promise<{ models: EquipmentModel[] }> {
  if (!token) return { models: [] };
  const res = await apiFetch('/models', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch models');
  }
  return data;
}

export async function createModel(
  token: string | null,
  body: {
    brand: string;
    model: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ model: EquipmentModel }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create model');
  }
  return data;
}

export async function updateModel(
  token: string | null,
  id: string,
  body: {
    brand?: string;
    model?: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ model: EquipmentModel }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/models/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update model');
  }
  return data;
}

export async function deleteModel(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/models/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete model');
  }
}

