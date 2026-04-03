import { apiFetch } from './client';

export interface Client {
  clientesid: number;
  clientescodigo: string;
  estado: boolean;
  codigocontable: string;
  clientes_gruposid: number;
  provinciasid: string;
  provincia: string;
  ciudadesid: string;
  ciudad: string;
  razonsocial: string;
  parroquiasid: string;
  clientes_zonasid: number;
  nombrecomercial: string;
  direccion: string;
  identificacion: string;
  tipoidentificacion: string;
  email: string;
  telefono1: string;
  telefono2: string;
  telefono3: string;
  vendedoresid: number;
  cobradoresid: number;
  /** Perseo price list id — selects `tarifas[]` row on spare parts. */
  tarifasid: number;
  creditocupo: number;
  creditodias: number;
  fechamodificacion: string;
  fechacreacion: string;
}

export interface GetClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
}

export async function getClients(
  token: string | null,
  params: GetClientsParams = {}
): Promise<GetClientsResponse> {
  if (!token) return { clients: [], total: 0, page: 1, limit: 10 };
  const sp = new URLSearchParams();
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.search != null && params.search !== '') sp.set('search', params.search);
  const query = sp.toString();
  const url = query ? `/clients?${query}` : '/clients';
  const res = await apiFetch(url, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch clients');
  }
  return data;
}

export async function getClientById(token: string | null, clientesid: number): Promise<Client> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/clients/${clientesid}`, { token });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch client');
  }
  return data;
}

export interface CreateClientPayload {
  razonsocial: string;
  direccion?: string;
  identificacion?: string;
  email?: string;
  telefono1?: string;
  nombrecomercial?: string;
}

export async function createClient(
  token: string | null,
  payload: CreateClientPayload
): Promise<Client> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/clients', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create client');
  }
  return data;
}

export interface UpdateClientPayload {
  razonsocial?: string;
  nombrecomercial?: string;
  email?: string;
  telefono1?: string;
  telefono2?: string;
  telefono3?: string;
  estado?: boolean;
  identificacion?: string;
}

export async function updateClient(
  token: string | null,
  clientesid: number,
  payload: UpdateClientPayload
): Promise<Client> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/clients/${clientesid}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update client');
  }
  return data;
}

export async function deleteClient(
  token: string | null,
  clientesid: number
): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/clients/${clientesid}`, {
    method: 'DELETE',
    token,
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Failed to delete client');
}
