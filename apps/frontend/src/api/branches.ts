import { apiFetch } from './client';

export interface Branch {
  id: string;
  branchName: string;
  email: string;
  phone: string;
  address: string;
  state: 'active' | 'inactive';
}

export async function getBranches(token: string | null): Promise<{ branches: Branch[] }> {
  if (!token) return { branches: [] };
  const res = await apiFetch('/branches', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch branches');
  }
  return data;
}

export async function getBranchById(
  token: string | null,
  id: string
): Promise<{ branch: Branch }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/branches/${id}`, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch branch');
  }
  return data;
}

export async function createBranch(
  token: string | null,
  body: {
    branchName: string;
    email: string;
    phone?: string;
    address?: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ branch: Branch }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create branch');
  }
  return data;
}

export async function updateBranch(
  token: string | null,
  id: string,
  body: {
    branchName?: string;
    email?: string;
    phone?: string;
    address?: string;
    state?: 'active' | 'inactive';
  }
): Promise<{ branch: Branch }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/branches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update branch');
  }
  return data;
}

export async function deleteBranch(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/branches/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete branch');
  }
}
