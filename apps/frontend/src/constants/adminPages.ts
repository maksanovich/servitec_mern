import type { User } from '../api/auth';

export const SUPER_ADMIN_SLUG = 'super_admin';

/** Same canonical paths as backend `ADMIN_PAGE_PATHS`. */
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
  '/admin/income',
  '/admin/company',
  '/admin/docs',
  '/admin/users',
  '/admin/roles',
];

export const ADMIN_PAGE_OPTIONS: readonly { path: string; label: string }[] = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/order', label: 'Orders' },
  { path: '/admin/pre-diagnosis', label: 'Pre-Diagnosis' },
  { path: '/admin/clients', label: 'Clients' },
  { path: '/admin/brand', label: 'Brand' },
  { path: '/admin/models', label: 'Models' },
  { path: '/admin/accessories', label: 'Accessories' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/services', label: 'Services' },
  { path: '/admin/income', label: 'Income' },
  { path: '/admin/company', label: 'Company' },
  { path: '/admin/docs', label: 'Documentation' },
  { path: '/admin/users', label: 'Users (super admin)' },
  { path: '/admin/roles', label: 'Roles (super admin)' },
];

export function normalizeAdminPath(path: string): string {
  const p = path.trim();
  if (!p.startsWith('/')) return '/' + p;
  return p.replace(/\/+$/, '') || '/';
}

export function pathMatchesPage(userPath: string, configuredPage: string): boolean {
  const p = normalizeAdminPath(userPath);
  const page = normalizeAdminPath(configuredPage);
  if (page === '/admin') {
    return p === '/admin' || p === '/admin/';
  }
  return p === page || p.startsWith(page + '/');
}

export function userCanAccessPage(user: User | null, requiredPage: string): boolean {
  if (!user?.role) return false;
  if (user.role.slug === SUPER_ADMIN_SLUG) return true;
  const req = normalizeAdminPath(requiredPage);
  return (user.role.pages ?? []).some((pg) => pathMatchesPage(req, pg));
}

/** Profile is always allowed for logged-in staff. */
export function isProfilePath(pathname: string): boolean {
  const p = normalizeAdminPath(pathname);
  return p === '/admin/profile' || p.startsWith('/admin/profile/');
}

export function firstAccessiblePagePath(user: User | null): string {
  const pages = user?.role?.pages ?? [];
  if (pages.length === 0) return '/admin';
  if (pages.some((p) => normalizeAdminPath(p) === '/admin')) return '/admin';
  return normalizeAdminPath(pages[0]);
}

export function userCanAccessPath(user: User | null, pathname: string): boolean {
  if (!user?.role) return false;
  if (isProfilePath(pathname)) return true;
  if (user.role.slug === SUPER_ADMIN_SLUG) return true;
  const p = normalizeAdminPath(pathname);
  return (user.role.pages ?? []).some((pg) => pathMatchesPage(p, pg));
}
