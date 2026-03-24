import { apiFetch } from './client';

export interface UserRoleRef {
  id: string;
  name: string;
  slug?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  identification: string;
  phone: string;
  avatar?: string;
  state: 'active' | 'inactive';
  role: UserRoleRef | null;
}

export async function getUsers(token: string | null): Promise<{ users: User[] }> {
  if (!token) return { users: [] };
  const res = await apiFetch('/users', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch users');
  }
  return data;
}

export async function getAssignableTechnicians(token: string | null): Promise<{ users: User[] }> {
  if (!token) return { users: [] };
  const res = await apiFetch('/users/technicians', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch technicians');
  }
  return data;
}

export async function getUserById(
  token: string | null,
  id: string
): Promise<{ user: User }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/users/${id}`, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch user');
  }
  return data;
}

export async function createUser(
  token: string | null,
  body: {
    email: string;
    password: string;
    name?: string;
    identification?: string;
    phone?: string;
    roleId: string;
    state?: 'active' | 'inactive';
    avatar?: string;
  }
): Promise<{ user: User }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create user');
  }
  return data;
}

export async function updateUser(
  token: string | null,
  id: string,
  body: {
    name?: string;
    identification?: string;
    phone?: string;
    roleId?: string;
    password?: string;
    state?: 'active' | 'inactive';
    avatar?: string;
  }
): Promise<{ user: User }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update user');
  }
  return data;
}

export async function deleteUser(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/users/${id}`, { method: 'DELETE', token });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete user');
  }
}
