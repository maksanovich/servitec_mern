import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import {
  hasAnyPageAccess,
  hasPageAccess,
  normalizeAdminPath,
  SUPER_ADMIN_SLUG,
  ADMIN_SLUG,
} from '../constants/adminPages.js';

/** Catalog modules used by order create/edit (lead/outsourced technicians often only have `/admin/order`). */
export const ORDER_WORKFLOW_CATALOG_PAGES: readonly string[] = [
  '/admin/clients',
  '/admin/brand',
  '/admin/models',
  '/admin/accessories',
  '/admin/products',
  '/admin/services',
  '/admin/spare',
];

export function hasOrderWorkflowPageAccess(roleSlug: string, effectivePages: string[]): boolean {
  return (
    hasPageAccess(roleSlug, effectivePages, '/admin/order') ||
    hasPageAccess(roleSlug, effectivePages, '/admin/income')
  );
}

/** Full module access, or order/income role using catalog APIs only for the order form. */
export function hasPageOrOrderWorkflowCatalogAccess(
  roleSlug: string,
  effectivePages: string[],
  requiredPage: string
): boolean {
  if (hasPageAccess(roleSlug, effectivePages, requiredPage)) return true;
  if (!hasOrderWorkflowPageAccess(roleSlug, effectivePages)) return false;
  const req = normalizeAdminPath(requiredPage);
  return ORDER_WORKFLOW_CATALOG_PAGES.some((p) => normalizeAdminPath(p) === req);
}

export function requireSuperAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== SUPER_ADMIN_SLUG) {
    return res.status(403).json({ error: 'Super administrator privileges required' });
  }
  next();
}

/** Only `super_admin` or legacy full `admin` role (not custom roles / technicians). */
export function requireSuperAdminOrAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const slug = req.user.role;
  if (slug !== SUPER_ADMIN_SLUG && slug !== ADMIN_SLUG) {
    return res.status(403).json({ error: 'Administrator privileges required' });
  }
  next();
}

export function requirePage(requiredPage: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!hasPageAccess(req.user.role, req.user.pages, requiredPage)) {
      return res.status(403).json({ error: 'You do not have access to this resource' });
    }
    next();
  };
}

export function requireAnyPage(requiredPages: readonly string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!hasAnyPageAccess(req.user.role, req.user.pages, requiredPages)) {
      return res.status(403).json({ error: 'You do not have access to this resource' });
    }
    next();
  };
}

/** Like `requirePage`, but users with `/admin/order` or `/admin/income` may call catalog APIs for the order form. */
export function requirePageOrOrderWorkflow(requiredPage: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!hasPageOrOrderWorkflowCatalogAccess(req.user.role, req.user.pages, requiredPage)) {
      return res.status(403).json({ error: 'You do not have access to this resource' });
    }
    next();
  };
}

/** Like `requireAnyPage`, with order-workflow catalog fallback for each listed path. */
export function requireAnyPageOrOrderWorkflow(requiredPages: readonly string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const ok = requiredPages.some((p) =>
      hasPageOrOrderWorkflowCatalogAccess(user.role, user.pages, p)
    );
    if (!ok) {
      return res.status(403).json({ error: 'You do not have access to this resource' });
    }
    next();
  };
}

/** Upload categories: avatar = any logged-in user; company-logo = company page; order images = orders or income. */
export function requireUploadPageAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  const raw = String(req.query.category ?? '').trim();
  if (raw === 'avatar') return next();
  if (raw === 'company-logo') return requirePage('/admin/company')(req, res, next);
  if (raw === 'order-before' || raw === 'order-after') {
    return requireAnyPage(['/admin/order', '/admin/income'])(req, res, next);
  }
  return next();
}
