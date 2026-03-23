import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { hasAnyPageAccess, hasPageAccess, SUPER_ADMIN_SLUG } from '../constants/adminPages.js';

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
