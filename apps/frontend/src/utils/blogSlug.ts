import type { OrderShowcaseItem, OrderTrackPublic } from '../api/orders';

const READABLE_SLUG_MAX_LEN = 110;

type BlogSlugInput = Pick<OrderShowcaseItem, 'code' | 'type' | 'brand' | 'model' | 'series'> & {
  diagnosis?: boolean;
  sparePartNames?: string[];
};

function slugifySegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueSpareNamesFromTrack(order: OrderTrackPublic): string[] | undefined {
  const lines = order.budgetLines;
  if (!lines?.length) return undefined;
  const names = lines.map((l) => l.name.trim()).filter(Boolean);
  return [...new Set(names)].slice(0, 5);
}

function toBlogSlugInput(order: OrderShowcaseItem | OrderTrackPublic): BlogSlugInput {
  const base: BlogSlugInput = {
    code: order.code,
    type: order.type,
    brand: order.brand,
    model: order.model,
    series: order.series,
    diagnosis: order.diagnosis,
  };
  if ('sparePartNames' in order && Array.isArray(order.sparePartNames) && order.sparePartNames.length > 0) {
    return { ...base, sparePartNames: order.sparePartNames };
  }
  const sparePartNames = uniqueSpareNamesFromTrack(order as OrderTrackPublic);
  return sparePartNames?.length ? { ...base, sparePartNames } : base;
}

export function buildBlogPostSlug(order: OrderShowcaseItem | OrderTrackPublic): string {
  const input = toBlogSlugInput(order);
  const segments: string[] = [];

  if (input.diagnosis) {
    segments.push('diagnostico');
  }
  segments.push(input.type, input.brand, input.model, input.series);
  if (input.sparePartNames?.length) {
    segments.push('repuestos', ...input.sparePartNames);
  }

  let readablePart = slugifySegment(segments.filter(Boolean).join(' '));
  if (readablePart.length > READABLE_SLUG_MAX_LEN) {
    readablePart = readablePart.slice(0, READABLE_SLUG_MAX_LEN).replace(/-+$/, '');
  }

  const code = input.code.trim();
  return readablePart ? `${readablePart}--${code}` : code;
}

export function extractOrderCodeFromBlogSlug(slugOrCode: string): string {
  const trimmed = slugOrCode.trim();
  if (!trimmed) return '';
  const separatorIndex = trimmed.lastIndexOf('--');
  return separatorIndex >= 0 ? trimmed.slice(separatorIndex + 2).trim() : trimmed;
}
