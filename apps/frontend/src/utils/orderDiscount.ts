export type DiscountType = 'none' | 'percentage' | 'amount';

export function normalizeDiscountValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

export function discountAmountForSubtotal(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  const base = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  if (base <= 0) return 0;
  const v = normalizeDiscountValue(discountValue);
  if (discountType === 'percentage') {
    const pct = Math.max(0, Math.min(100, v));
    return Math.round((base * pct) / 100 * 100) / 100;
  }
  if (discountType === 'amount') {
    return Math.min(base, v);
  }
  return 0;
}

export function totalAfterDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  const base = Number.isFinite(subtotal) && subtotal > 0 ? subtotal : 0;
  const disc = discountAmountForSubtotal(base, discountType, discountValue);
  return Math.max(0, Math.round((base - disc) * 100) / 100);
}
