/** Shared field extraction from Perseo `productos_consulta` payloads (SpareServer + hourly sync). */

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

/** Price: first `tarifas[]` object (Perseo), then root-level fallbacks. */
export function precioFromPayload(payload: Record<string, unknown>): number | null {
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

/** Stock: Perseo `existenciastotales` when present; else sum `ubicaciones[].saldo` (etc.); else root fields. */
export function stockFromPayload(payload: Record<string, unknown>): number | null {
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

export function descriptionFromPayload(payload: Record<string, unknown>): string {
  return strFromPayload(payload, DESC_KEYS);
}

/** True when the catalog description should be treated as a service line (Perseo sync → ServiceSparePart). */
export function descriptionIndicatesServicio(description: string): boolean {
  return description.toUpperCase().includes('SERVICIO');
}
