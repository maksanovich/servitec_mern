import { apiFetch } from './client';

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  pages: string[];
  state: 'active' | 'inactive';
}

export async function getRoles(token: string | null): Promise<{ roles: Role[] }> {
  if (!token) return { roles: [] };
  const res = await apiFetch('/roles', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch roles');
  }
  return data;
}

export async function getRoleById(
  token: string | null,
  id: string
): Promise<{ role: Role }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/roles/${id}`, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch role');
  }
  return data;
}

export async function createRole(
  token: string | null,
  body: {
    name: string;
    slug: string;
    description?: string;
    state?: 'active' | 'inactive';
    pages?: string[];
  }
): Promise<{ role: Role }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create role');
  }
  return data;
}

export async function updateRole(
  token: string | null,
  id: string,
  body: {
    name?: string;
    slug?: string;
    description?: string;
    state?: 'active' | 'inactive';
    pages?: string[];
  }
): Promise<{ role: Role }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/roles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update role');
  }
  return data;
}

export async function deleteRole(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/roles/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete role');
  }
}
