import { apiFetch } from './client';

export interface UserRole {
  id: string;
  slug: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole | null;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  branch?: string;
  role: UserRole | null;
}

/** Display string for user role (name or slug with underscores replaced) */
export function roleDisplay(role: UserRole | null | undefined): string {
  if (!role) return 'User';
  return role.name || role.slug.replace(/_/g, ' ') || 'User';
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function me(token: string): Promise<{ user: User }> {
  const res = await apiFetch('/auth/me', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch user');
  }
  return data;
}

export async function updateProfile(
  token: string,
  data: { name?: string; phone?: string }
): Promise<{ user: User }> {
  const res = await apiFetch('/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    token,
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to update profile');
  }
  return result;
}
