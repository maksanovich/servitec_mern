/** Normalize order repair photos from DB (legacy single string or string[]). */
export function normalizeStoredOrderPhotos(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u ?? '').trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  return s ? [s] : [];
}

/** API create body: string | string[] | undefined */
export function normalizeOrderPhotoListForCreate(
  raw: unknown
): { ok: true; value: string[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (typeof raw === 'string') {
    const v = raw.trim();
    return { ok: true, value: v ? [v] : [] };
  }
  if (Array.isArray(raw)) {
    const value = raw.map((u) => String(u ?? '').trim()).filter(Boolean);
    return { ok: true, value };
  }
  return { ok: false, error: 'Photos must be a string URL or an array of URLs' };
}

/** PATCH: undefined = omit; null or [] = clear */
export function normalizeOrderPhotoListForPatch(
  raw: unknown
): { ok: true; value: string[]; omit: boolean } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, value: [], omit: true };
  if (raw === null) return { ok: true, value: [], omit: false };
  if (typeof raw === 'string') {
    const v = raw.trim();
    return { ok: true, value: v ? [v] : [], omit: false };
  }
  if (Array.isArray(raw)) {
    const value = raw.map((u) => String(u ?? '').trim()).filter(Boolean);
    return { ok: true, value, omit: false };
  }
  return { ok: false, error: 'Photos must be a string URL or an array of URLs' };
}

export function firstStoredPhotoBufferSource(raw: unknown): string {
  const list = normalizeStoredOrderPhotos(raw);
  return list[0] ?? '';
}
