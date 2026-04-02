/** Normalize API field that may be a legacy single URL or an array. */
export function normalizeOrderPhotoListFromApi(raw: string | string[] | null | undefined): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((u) => String(u ?? '').trim()).filter(Boolean);
  const s = String(raw).trim();
  return s ? [s] : [];
}

export function hasOrderPhotos(list: string[] | undefined | null): boolean {
  return normalizeOrderPhotoListFromApi(list ?? []).length > 0;
}

export const MAX_ORDER_PHOTOS_PER_SIDE = 24;

export function newLocalPhotoId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random()}`;
}

export type LocalOrderPhoto = {
  id: string;
  displayUrl: string;
  remoteUrl?: string;
  file?: File;
};
