import type { User } from '../api/auth';

export const SUPER_ADMIN_SLUG = 'super_admin';

/** Legacy full-access role (empty `pages` = all assignable pages). */
export const ADMIN_SLUG = 'admin';

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
  '/admin/spare',
  '/admin/income',
  '/admin/company',
  '/admin/mail',
  '/admin/docs',
  '/admin/users',
  '/admin/roles',
];

export const ADMIN_PAGE_OPTIONS: readonly { path: string; label: string }[] = [
  { path: '/admin', label: 'Panel' },
  { path: '/admin/order', label: 'Órdenes' },
  { path: '/admin/pre-diagnosis', label: 'Pre-diagnóstico' },
  { path: '/admin/clients', label: 'Clientes' },
  { path: '/admin/brand', label: 'Marcas' },
  { path: '/admin/models', label: 'Modelos' },
  { path: '/admin/accessories', label: 'Accesorios' },
  { path: '/admin/products', label: 'Productos' },
  { path: '/admin/services', label: 'Servicios' },
  { path: '/admin/spare', label: 'Repuestos' },
  { path: '/admin/income', label: 'Ingresos' },
  { path: '/admin/company', label: 'Empresa' },
  { path: '/admin/mail', label: 'Correo' },
  { path: '/admin/docs', label: 'Documentación' },
  { path: '/admin/users', label: 'Usuarios (super admin)' },
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

/** Built-in administrator roles only (excludes technicians and custom roles). */
export function userIsSuperAdminOrAdmin(user: User | null): boolean {
  const slug = user?.role?.slug;
  return slug === SUPER_ADMIN_SLUG || slug === ADMIN_SLUG;
}

/** Spare Parts page: assignable as /admin/spare, or legacy access via Services only. */
export function userHasSparePartsAccess(user: User | null): boolean {
  return (
    userCanAccessPage(user, '/admin/spare') || userCanAccessPage(user, '/admin/services')
  );
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
  if (p === '/admin/spare' || p.startsWith('/admin/spare/')) {
    return userHasSparePartsAccess(user);
  }
  return (user.role.pages ?? []).some((pg) => pathMatchesPage(p, pg));
}
