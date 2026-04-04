/** Slug with implicit full access to all admin pages (including Users & Roles). */
export const SUPER_ADMIN_SLUG = 'super_admin';

/**
 * Slug that keeps legacy behavior when `pages` is empty: all pages except Users/Roles.
 */
export const ADMIN_SLUG = 'admin';

/** Canonical admin sidebar paths (assignable to roles). */
export const ADMIN_PAGE_PATHS: readonly string[] = [
  '/admin',
  '/admin/order',
  '/admin/pre-diagnosis',
  '/admin/clients',
  '/admin/brand',
  '/admin/models',
  '/admin/accessories',
  '/admin/products',
  '/admin/services',
  '/admin/spare',
  '/admin/income',
  '/admin/company',
  '/admin/mail',
  '/admin/docs',
  '/admin/users',
  '/admin/roles',
];

export const SUPER_ADMIN_ONLY_PAGES: readonly string[] = ['/admin/users', '/admin/roles'];

export const ALL_ASSIGNABLE_PAGES: readonly string[] = ADMIN_PAGE_PATHS.filter(
  (p) => !SUPER_ADMIN_ONLY_PAGES.includes(p)
);

export function normalizeAdminPath(path: string): string {
  const p = path.trim();
  if (!p.startsWith('/')) return '/' + p;
  return p.replace(/\/+$/, '') || '/';
}

/** Whether `userPath` (e.g. /admin/order/new) is allowed by a configured page prefix (e.g. /admin/order). */
export function pathMatchesPage(userPath: string, configuredPage: string): boolean {
  const p = normalizeAdminPath(userPath);
  const page = normalizeAdminPath(configuredPage);
  if (page === '/admin') {
    return p === '/admin' || p === '/admin/';
  }
  return p === page || p.startsWith(page + '/');
}

export function getEffectivePages(role: {
  slug: string;
  pages?: string[] | null;
}): string[] {
  if (role.slug === SUPER_ADMIN_SLUG) {
    return [...ADMIN_PAGE_PATHS];
  }
  const raw = role.pages;
  if (role.slug === ADMIN_SLUG && (!raw || raw.length === 0)) {
    return [...ALL_ASSIGNABLE_PAGES];
  }
  return Array.isArray(raw) ? raw.map((x) => normalizeAdminPath(String(x))) : [];
}

export function hasPageAccess(
  roleSlug: string,
  effectivePages: string[],
  requiredPage: string
): boolean {
  if (roleSlug === SUPER_ADMIN_SLUG) return true;
  const req = normalizeAdminPath(requiredPage);
  return effectivePages.some((pg) => pathMatchesPage(req, pg));
}

export function hasAnyPageAccess(
  roleSlug: string,
  effectivePages: string[],
  requiredPages: readonly string[]
): boolean {
  return requiredPages.some((p) => hasPageAccess(roleSlug, effectivePages, p));
}

const ALLOWED_PAGE_SET = new Set(ADMIN_PAGE_PATHS);

/**
 * Accepts only string entries; drops unknown or legacy paths; dedupes.
 * Returns null if `pages` is not an array or any element is not a string.
 */
export function sanitizeRolePages(pages: unknown): string[] | null {
  if (!Array.isArray(pages)) return null;
  const out: string[] = [];
  for (const p of pages) {
    if (typeof p !== 'string') return null;
    const n = normalizeAdminPath(p);
    if (ALLOWED_PAGE_SET.has(n)) out.push(n);
  }
  return [...new Set(out)];
}
