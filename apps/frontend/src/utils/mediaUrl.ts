/**
 * Normalizes stored media values for use in <img src>.
 * Handles `/uploads/...` paths, absolute URLs, blob URLs, data URLs, and legacy raw base64.
 */
export function resolveMediaSrc(src: string | null | undefined): string | null {
  if (src == null) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (
    s.startsWith('data:') ||
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('blob:')
  ) {
    return s;
  }
  if (s.startsWith('/')) return s;
  if (s.startsWith('uploads/')) return `/${s}`;

  const compact = s.replace(/\s/g, '');
  if (compact.length > 80 && /^[A-Za-z0-9+/=]+$/.test(compact)) {
    if (compact.startsWith('iVBOR')) return `data:image/png;base64,${compact}`;
    if (compact.startsWith('/9j/')) return `data:image/jpeg;base64,${compact}`;
    if (compact.startsWith('R0lGOD')) return `data:image/gif;base64,${compact}`;
    if (compact.startsWith('UklGR')) return `data:image/webp;base64,${compact}`;
    return `data:image/jpeg;base64,${compact}`;
  }
  return s;
}
