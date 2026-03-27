import { apiFetch } from './client';

export interface Accessory {
  id: string;
  artifact: string;
  state: 'active' | 'inactive';
}

export async function getAccessories(token: string | null): Promise<{ accessories: Accessory[] }> {
  if (!token) return { accessories: [] };
  const res = await apiFetch('/accessories', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch accessories');
  }
  return data;
}

export async function createAccessory(
  token: string | null,
  body: { artifact: string; state?: 'active' | 'inactive' }
): Promise<{ accessory: Accessory }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/accessories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create accessory');
  }
  return data;
}

export async function updateAccessory(
  token: string | null,
  id: string,
  body: { artifact?: string; state?: 'active' | 'inactive' }
): Promise<{ accessory: Accessory }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/accessories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update accessory');
  }
  return data;
}

export async function deleteAccessory(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/accessories/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete accessory');
  }
}

