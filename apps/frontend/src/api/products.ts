import { apiFetch, publicApiFetch } from './client';

export type ProductState = 'active' | 'inactive';

export interface Product {
  id: string;
  branch: string;
  product: string;
  state: ProductState;
}

export async function getProductsPublic(): Promise<{ products: Product[] }> {
  const res = await publicApiFetch('/products/public');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
  return data;
}

export async function getProducts(
  token: string | null,
  params: { branch?: string; state?: ProductState } = {}
): Promise<{ products: Product[] }> {
  if (!token) return { products: [] };

  const sp = new URLSearchParams();
  if (params.branch) sp.set('branch', params.branch);
  if (params.state) sp.set('state', params.state);

  const qs = sp.toString();
  const res = await apiFetch(qs ? `/products?${qs}` : '/products', { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
  return data;
}

export async function getProductById(
  token: string | null,
  id: string
): Promise<{ product: Product }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/products/${id}`, { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch product');
  return data;
}

export async function createProduct(
  token: string | null,
  body: { branch: string; product: string; state?: ProductState }
): Promise<{ product: Product }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/products', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data;
}

export async function updateProduct(
  token: string | null,
  id: string,
  body: Partial<{ branch: string; product: string; state: ProductState }>
): Promise<{ product: Product }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/products/${id}`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data;
}

export async function deleteProduct(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/products/${id}`, { method: 'DELETE', token });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'Failed to delete product');
}

