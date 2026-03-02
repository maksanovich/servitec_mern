import { apiFetch } from './client';

export interface Company {
  id: string;
  ruc: string;
  companyName: string;
  web?: string;
  email: string;
  phone: string;
  address: string;
  googleMaps?: string;
  companyInformation?: string;
  logo?: string;
  state: 'active' | 'inactive';
}

export async function getCompany(token: string | null): Promise<{ company: Company | null }> {
  if (!token) return { company: null };
  const res = await apiFetch('/company', { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch company');
  }
  return data;
}

export async function updateCompany(
  token: string | null,
  data: Partial<Omit<Company, 'id'>>
): Promise<{ company: Company }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/company', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    token,
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to update company');
  }
  return result;
}
