import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.js';

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'Access denied. Super administrator required.' });
    return;
  }
  next();
}

