import { Request, Response } from 'express';
import { SpareServer } from '../models/SpareServer.js';
import { getProductImage } from '../services/perseoService.js';

function strFromPayload(p: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function numFromPayload(p: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(',', '.'));
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

const DESC_KEYS = [
  'descripcion',
  'productodescripcion',
  'productosdescripcion',
  'nombre',
  'denominacion',
  'referencia',
  'productonombre',
  'productosnombre',
];

const PRICE_KEYS = [
  'precio',
  'precioventa',
  'pvp',
  'valor',
  'preciolista',
  'tarifaprecio',
  'importe',
  'precio_unitario',
  'preciounitario',
];

const STOCK_KEYS = [
  'existenciastotales',
  'saldo',
  'existencia',
  'stock',
  'cantidad',
  'disponible',
  'invfisico',
  'inventario',
];

/**
 * Price: first `tarifas[]` object (Perseo), then root-level fallbacks.
 */
function precioFromPayload(payload: Record<string, unknown>): number | null {
  const tarifas = payload.tarifas;
  if (Array.isArray(tarifas) && tarifas.length > 0) {
    const first = tarifas[0];
    if (isRecord(first)) {
      const p = numFromPayload(first, PRICE_KEYS);
      if (p != null) return p;
    }
  }
  return numFromPayload(payload, PRICE_KEYS);
}

/**
 * Stock: Perseo `existenciastotales` when present; else sum `ubicaciones[].saldo` (etc.); else root fields.
 */
function stockFromPayload(payload: Record<string, unknown>): number | null {
  const fromTotal = numFromPayload(payload, ['existenciastotales']);
  if (fromTotal != null) return fromTotal;
  const ubicaciones = payload.ubicaciones;
  if (Array.isArray(ubicaciones) && ubicaciones.length > 0) {
    let sum = 0;
    let any = false;
    for (const u of ubicaciones) {
      if (!isRecord(u)) continue;
      const n = numFromPayload(u, STOCK_KEYS);
      if (n != null) {
        sum += n;
        any = true;
      }
    }
    if (any) return sum;
  }
  return numFromPayload(payload, STOCK_KEYS);
}

function descriptionFromPayload(payload: Record<string, unknown>): string {
  return strFromPayload(payload, DESC_KEYS);
}

function mapSpareDocToItem(d: {
  _id: unknown;
  productosid: number;
  productocodigo?: string;
  payload?: Record<string, unknown>;
  updatedAt?: Date;
}) {
  const payload = (d.payload ?? {}) as Record<string, unknown>;
  const updated = d.updatedAt;
  const productosid = typeof d.productosid === 'number' ? d.productosid : Number(d.productosid);
  return {
    id: String(d._id),
    productosid: Number.isFinite(productosid) ? productosid : 0,
    productocodigo: d.productocodigo ?? '',
    description: descriptionFromPayload(payload),
    precio: precioFromPayload(payload),
    stock: stockFromPayload(payload),
    updatedAt: updated ? new Date(updated).toISOString() : null,
  };
}

/**
 * Perseo `productos_consulta` — price from first tarifas row; stock from existenciastotales or ubicaciones/root fallbacks.
 */
export async function listSpareServer(_req: Request, res: Response): Promise<Response | void> {
  try {
    const docs = await SpareServer.find().sort({ productocodigo: 1 }).lean();
    const items = docs.map((d) => mapSpareDocToItem(d));
    return res.json({ items });
  } catch (err) {
    console.error('listSpareServer error:', err);
    return res.status(500).json({ error: 'Failed to list spare server catalog' });
  }
}

/** Single product: mapped fields plus raw arrays / payload for detail modal. */
export async function getSpareServerByProductId(req: Request, res: Response): Promise<Response | void> {
  try {
    const productosid = Number(req.params.productosid);
    if (!Number.isFinite(productosid) || productosid <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const doc = await SpareServer.findOne({ productosid }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const payload = (doc.payload ?? {}) as Record<string, unknown>;
    const tarifas = Array.isArray(payload.tarifas) ? payload.tarifas : [];
    const ubicaciones = Array.isArray(payload.ubicaciones) ? payload.ubicaciones : [];
    return res.json({
      item: {
        ...mapSpareDocToItem(doc),
        tarifas,
        ubicaciones,
        payload,
      },
    });
  } catch (err) {
    console.error('getSpareServerByProductId error:', err);
    return res.status(500).json({ error: 'Failed to load spare server product' });
  }
}

/** Perseo product image for admin spare-parts table (lazy-loaded from frontend). */
export async function getSpareServerProductImage(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = Number(req.params.productosid);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    const result = await getProductImage(id);
    if (!result.ok) {
      return res.json({ src: null });
    }
    return res.json({ src: result.src });
  } catch (err) {
    console.error('getSpareServerProductImage error:', err);
    return res.status(500).json({ error: 'Failed to load product image' });
  }
}
