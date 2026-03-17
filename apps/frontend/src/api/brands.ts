import { apiFetch } from './client';

export interface Brand {
  id: string;
  name: string;
  state: 'active' | 'inactive';
}

export async function getBrands(token: string | null): Promise<{ brands: Brand[] }> {
  if (!token) return { brands: [] };
  const res = await apiFetch('/brands', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch brands');
  }
  return data;
}

export async function getBrandById(
  token: string | null,
  id: string
): Promise<{ brand: Brand }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/brands/${id}`, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch brand');
  }
  return data;
}

export async function createBrand(
  token: string | null,
  body: {
    name: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ brand: Brand }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create brand');
  }
  return data;
}

export async function updateBrand(
  token: string | null,
  id: string,
  body: {
    name?: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ brand: Brand }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/brands/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update brand');
  }
  return data;
}

export async function deleteBrand(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/brands/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete brand');
  }
}

