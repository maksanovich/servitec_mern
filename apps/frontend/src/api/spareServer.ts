import { apiFetch } from './client';

/** Dedupe concurrent / in-flight fetches for the same Perseo product id. */
const productImageCache = new Map<number, Promise<string | null>>();

/**
 * Perseo may return raw base64; `<img src>` needs a data URL or http(s) URL.
 * Mirrors backend `normalizePerseoImageSrc` enough for browser display.
 */
function normalizeImageSrcForImg(raw: string): string {
  const s = raw.trim();
  if (
    s.startsWith('data:') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('blob:')
  ) {
    return s;
  }
  if (s.startsWith('/') && !s.startsWith('/9j/')) return s;

  let payload = s.replace(/\s/g, '');
  const lower = payload.toLowerCase();
  const b64Marker = ';base64,';
  const idx = lower.indexOf(b64Marker);
  if (idx !== -1) {
    payload = payload.slice(idx + b64Marker.length);
  } else if (lower.startsWith('base64,')) {
    payload = payload.slice(7);
  }
  payload = payload.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/=]+$/.test(payload) || payload.length < 4) return s;

  if (payload.startsWith('/9j/')) return `data:image/jpeg;base64,${payload}`;
  if (payload.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${payload}`;
  if (payload.startsWith('R0lGOD')) return `data:image/gif;base64,${payload}`;
  if (payload.startsWith('UklGR')) return `data:image/webp;base64,${payload}`;
  return `data:image/jpeg;base64,${payload}`;
}

export interface SpareServerRow {
  id: string;
  productosid: number;
  productocodigo: string;
  description: string;
  precio: number | null;
  stock: number | null;
  updatedAt: string | null;
}

/** Detail response: list row fields plus Perseo arrays and full payload for the modal. */
export interface SpareServerDetail extends SpareServerRow {
  tarifas: unknown[];
  ubicaciones: unknown[];
  payload: Record<string, unknown>;
}

export async function getSpareServerCatalog(token: string | null): Promise<{ items: SpareServerRow[] }> {
  if (!token) return { items: [] };
  const res = await apiFetch('/spare-server', { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch spare server catalog');
  return data;
}

export async function getSpareServerDetail(
  token: string | null,
  productosid: number
): Promise<{ item: SpareServerDetail }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/spare-server/${productosid}`, { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load product detail');
  return data;
}

/** Perseo product image URL/data URL for admin thumbnails. Returns null if none. */
export async function getSpareServerProductImage(
  token: string | null,
  productosid: number
): Promise<string | null> {
  if (!token) return null;
  if (!Number.isFinite(productosid) || productosid <= 0) return null;
  let pending = productImageCache.get(productosid);
  if (!pending) {
    pending = (async () => {
      const res = await apiFetch(`/spare-server/${productosid}/image`, { token });
      const data = (await res.json()) as { src?: unknown; error?: string };
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load image');
      return typeof data.src === 'string' ? normalizeImageSrcForImg(data.src) : null;
    })();
    productImageCache.set(productosid, pending);
  }
  return pending;
}
