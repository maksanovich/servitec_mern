import { apiFetch } from './client';

export interface Client {
  clientesid: number;
  clientescodigo: string;
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
