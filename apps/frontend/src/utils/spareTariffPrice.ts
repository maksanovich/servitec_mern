import type { SpareServerRow } from '../api/spareServer';
import type { ServiceSparePartItem } from '../api/servicesSpareParts';

/** VAT included in unit prices shown and stored for spare budget lines (Ecuador-style 15%). */
const VAT_FACTOR = 1.15;

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
] as const;

const TARIFA_ID_KEYS = ['tarifasid', 'tarifas_id', 'tarifasId'] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function numFromRecord(r: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(',', '.'));
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function tarifaIdFromRow(r: Record<string, unknown>): number | null {
  for (const k of TARIFA_ID_KEYS) {
    const v = r[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

/** Base list price (ex-VAT) from Perseo `tarifas[]`, matching the client's tariff id. */
export function spareBasePriceForTarifa(
  row: Pick<SpareServerRow, 'precio' | 'tarifas'>,
  clientTarifasid: number
): number {
  const fallback = row.precio != null && !Number.isNaN(Number(row.precio)) ? Number(row.precio) : 0;
  const tarifas = row.tarifas;
  if (!Array.isArray(tarifas) || tarifas.length === 0) return fallback;

  if (clientTarifasid > 0) {
    for (const t of tarifas) {
      if (!isRecord(t)) continue;
      const tid = tarifaIdFromRow(t);
      if (tid != null && tid === clientTarifasid) {
        const p = numFromRecord(t, PRICE_KEYS);
        if (p != null) return p;
      }
    }
  }

  const first = tarifas[0];
  if (isRecord(first)) {
    const p = numFromRecord(first, PRICE_KEYS);
    if (p != null) return p;
  }
  return fallback;
}

/** Unit price for budget lines: base tariff price with 15% VAT included. */
export function spareUnitPriceInclVat(
  row: Pick<SpareServerRow, 'precio' | 'tarifas'>,
  clientTarifasid: number
): number {
  const base = spareBasePriceForTarifa(row, clientTarifasid);
  return Math.round(base * VAT_FACTOR * 100) / 100;
}

/** Distinct Perseo tariff ids from spare catalog and from synced servicios rows. */
export function collectTarifaIdsFromSparesAndServices(
  catalog: Pick<SpareServerRow, 'precio' | 'tarifas'>[],
  services: Pick<ServiceSparePartItem, 'price' | 'tarifas' | 'type'>[]
): number[] {
  const ids = new Set<number>();
  for (const id of collectSpareTarifaIdsFromCatalog(catalog)) ids.add(id);
  for (const s of services) {
    if (s.type !== 'service') continue;
    const row: Pick<SpareServerRow, 'precio' | 'tarifas'> = {
      precio: s.price ?? null,
      tarifas: Array.isArray(s.tarifas) ? s.tarifas : [],
    };
    for (const id of collectSpareTarifaIdsFromCatalog([row])) ids.add(id);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/** Servicio row visible for the selected tariff filter (legacy rows without `tarifas` stay visible). */
export function serviceRowVisibleForSelectedTarifa(
  item: Pick<ServiceSparePartItem, 'type' | 'price' | 'tarifas' | 'state'>,
  selectedTarifaId: number
): boolean {
  if (item.type !== 'service' || item.state === 'inactive') return false;
  const tarifas = Array.isArray(item.tarifas) ? item.tarifas : [];
  if (tarifas.length === 0) return true;
  return spareRowHasTarifaId({ precio: item.price ?? null, tarifas }, selectedTarifaId);
}

/** Catalog unit price for services: uses selected Perseo tariff when `tarifas` present; else IVA on single `price`. */
export function serviceCatalogUnitPriceInclVat(
  item: Pick<ServiceSparePartItem, 'type' | 'price' | 'tarifas'>,
  selectedTarifaId = 0
): number {
  const safeBase = Number(item.price);
  const baseIn = Number.isFinite(safeBase) ? safeBase : 0;
  if (item.type === 'replacement') {
    return Math.round(baseIn * 100) / 100;
  }
  const tarifas = Array.isArray(item.tarifas) ? item.tarifas : [];
  if (tarifas.length === 0) {
    return Math.round(baseIn * VAT_FACTOR * 100) / 100;
  }
  const base = spareBasePriceForTarifa(
    { precio: item.price ?? null, tarifas } as Pick<SpareServerRow, 'precio' | 'tarifas'>,
    selectedTarifaId
  );
  return Math.round(base * VAT_FACTOR * 100) / 100;
}

export interface SpareTariffPriceEntry {
  tarifasid: number | null;
  /** Base list price (ex-VAT) from Perseo `tarifas[]`. */
  base: number;
}

/** Every tariff line from Perseo `tarifas[]` (ex-VAT; catalog display). */
export function spareAllTariffPrices(row: Pick<SpareServerRow, 'precio' | 'tarifas'>): SpareTariffPriceEntry[] {
  const tarifas = row.tarifas;
  const fallback = row.precio != null && !Number.isNaN(Number(row.precio)) ? Number(row.precio) : null;
  if (!Array.isArray(tarifas) || tarifas.length === 0) {
    if (fallback != null) {
      return [{ tarifasid: null, base: Math.round(fallback * 100) / 100 }];
    }
    return [];
  }
  const out: SpareTariffPriceEntry[] = [];
  for (const t of tarifas) {
    if (!isRecord(t)) continue;
    const tid = tarifaIdFromRow(t);
    const p = numFromRecord(t, PRICE_KEYS);
    if (p == null) continue;
    out.push({
      tarifasid: tid,
      base: Math.round(p * 100) / 100,
    });
  }
  if (out.length === 0 && fallback != null) {
    return [{ tarifasid: null, base: Math.round(fallback * 100) / 100 }];
  }
  return out;
}

/** Distinct Perseo tariff ids present in the catalog (sorted ascending). */
export function collectSpareTarifaIdsFromCatalog(
  catalog: Pick<SpareServerRow, 'precio' | 'tarifas'>[]
): number[] {
  const ids = new Set<number>();
  for (const row of catalog) {
    for (const e of spareAllTariffPrices(row)) {
      if (e.tarifasid != null) ids.add(e.tarifasid);
    }
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/** Row has an explicit price line for this tariff id (or any row when `tarifasid <= 0`). */
export function spareRowHasTarifaId(
  row: Pick<SpareServerRow, 'precio' | 'tarifas'>,
  tarifasid: number
): boolean {
  if (tarifasid <= 0) return true;
  return spareAllTariffPrices(row).some((e) => e.tarifasid === tarifasid);
}

/** For table sort / export: lowest ex-VAT tariff price on the row. */
export function spareTariffPriceListSortKey(row: Pick<SpareServerRow, 'precio' | 'tarifas'>): number {
  const list = spareAllTariffPrices(row);
  if (list.length === 0) return -Infinity;
  return Math.min(...list.map((e) => e.base));
}

/** Plain text for PDF/Excel export (semicolon-separated). */
export function formatSpareTariffPriceListPlain(row: Pick<SpareServerRow, 'precio' | 'tarifas'>): string {
  const list = spareAllTariffPrices(row);
  if (list.length === 0) return '—';
  return list
    .map((e) => {
      const label = e.tarifasid != null ? `T${e.tarifasid}` : 'Tariff';
      return `${label}: ${e.base.toFixed(2)}`;
    })
    .join('; ');
}

export function recalculateSpareBudgetLines<T extends { serviceId: string; amount: number; price: number; total: number }>(
  lines: T[],
  spareById: Map<string, SpareServerRow>,
  clientTarifasid: number
): T[] {
  return lines.map((line) => {
    const spare = spareById.get(line.serviceId);
    if (!spare) return line;
    const price = spareUnitPriceInclVat(spare, clientTarifasid);
    return { ...line, price, total: Math.round(price * line.amount * 100) / 100 };
  });
}

export function recalculateServiceBudgetLines<
  T extends { serviceId: string; amount: number; price: number; total: number },
>(
  lines: T[],
  servicesById: Map<string, Pick<ServiceSparePartItem, 'type' | 'price' | 'tarifas'>>,
  selectedTarifaId: number
): T[] {
  return lines.map((line) => {
    const item = servicesById.get(line.serviceId);
    if (!item || item.type !== 'service') return line;
    const price = serviceCatalogUnitPriceInclVat(item, selectedTarifaId);
    return { ...line, price, total: Math.round(price * line.amount * 100) / 100 };
  });
}
