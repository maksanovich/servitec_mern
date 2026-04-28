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

/**
 * Perseo changed `tarifas` shape:
 * - old: `tarifas: [{...}]`
 * - new: `tarifas: { unidadinterna: [{...}] }`
 * This helper normalizes both to a plain array.
 */
export function tarifasArrayFromPayload(payload: Record<string, unknown>): unknown[] {
  const tarifasRaw = payload.tarifas;
  if (Array.isArray(tarifasRaw)) return tarifasRaw;
  if (isRecord(tarifasRaw)) {
    const keysInPriorityOrder = [
      'unidadinterna',
      'unidadventa',
      'unidadcompra',
      'tarifas',
      'items',
      'list',
    ];
    for (const k of keysInPriorityOrder) {
      const v = tarifasRaw[k];
      if (Array.isArray(v)) return v;
    }
    for (const v of Object.values(tarifasRaw)) {
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

const DESC_KEYS = [
  'descripcion',
  'productodescripcion',
  'productosdescripcion',
  'descripcion_larga',
  'descripcioncompleta',
  'descripcion_extendida',
  'descripcionproducto',
  'producto_descripcion',
  'nombre',
  'denominacion',
  'referencia',
  'productonombre',
  'productosnombre',
  'detalle',
  'texto',
  'titulo',
  'observaciones',
  'notas',
  'comentario',
  'contenido',
];

const NESTED_DESC_CONTAINERS = ['producto', 'datos', 'articulo', 'data', 'item', 'registro'] as const;

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
  const tarifas = tarifasArrayFromPayload(payload);
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

function joinCaracteristicas(caracteristicas: unknown): string {
  if (!Array.isArray(caracteristicas) || caracteristicas.length === 0) return '';
  const parts: string[] = [];
  for (const c of caracteristicas) {
    if (!isRecord(c)) continue;
    const nombre = strFromPayload(c, ['nombre', 'clave', 'atributo', 'campo', 'label']);
    const valor = strFromPayload(c, ['valor', 'descripcion', 'texto', 'contenido', 'dato']);
    if (nombre && valor) parts.push(`${nombre}: ${valor}`);
    else if (valor) parts.push(valor);
    else {
      const line = strFromPayload(c, DESC_KEYS);
      if (line) parts.push(line);
    }
  }
  return parts.filter(Boolean).join(' / ');
}

/**
 * Best-effort product description for Perseo `productos_consulta` rows (flat + nested + attribute lists).
 */
export function descriptionFromPayload(payload: Record<string, unknown>): string {
  const direct = strFromPayload(payload, DESC_KEYS);
  if (direct) return direct;

  for (const key of NESTED_DESC_CONTAINERS) {
    const child = payload[key];
    if (!isRecord(child)) continue;
    const fromChild = strFromPayload(child, DESC_KEYS);
    if (fromChild) return fromChild;
  }

  const fromCar = joinCaracteristicas(payload.caracteristicas);
  if (fromCar) return fromCar;

  const attrs = payload.atributos ?? payload.attributes;
  const fromAttrs = joinCaracteristicas(attrs);
  if (fromAttrs) return fromAttrs;

  return '';
}

/** True when the catalog description should be treated as a service line (Perseo sync → ServiceSparePart). */
export function descriptionIndicatesServicio(description: string): boolean {
  return description.toUpperCase().includes('SERVICIO');
}
