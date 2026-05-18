const DEFAULT_PUBLIC_TRACK_BASE_URL = 'https://tecnico.digitalserver.com.ec';

/**
 * Public SPA URL for customer order tracking, e.g.
 * https://tecnico.digitalserver.com.ec/track/2JSNPN98T
 */
export function buildPublicOrderTrackUrl(trackingCode: string): string {
  const code = String(trackingCode ?? '').trim();
  if (!code) return '';

  const base = (process.env.PUBLIC_TRACK_BASE_URL ?? DEFAULT_PUBLIC_TRACK_BASE_URL).trim().replace(/\/+$/, '');
  const safeBase = base || DEFAULT_PUBLIC_TRACK_BASE_URL;
  return `${safeBase}/track/${encodeURIComponent(code)}`;
}
