/** Digits only, E.164-style without leading + (Ecuador +593 rules preserved). */
export function normalizePhoneForWhatsApp(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('593')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `593${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('9')) return `593${digits}`;
  return digits;
}
