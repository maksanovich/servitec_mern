import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { getEffectivePages } from '../constants/adminPages.js';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
    /** Role display name (for slug/name-based checks, e.g. technician). */
    roleName: string;
    roleId: string;
    pages: string[];
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = auth.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).populate('role');
    if (!user) return res.status(401).json({ error: 'User not found' });

    const role = user.role as unknown as {
      _id: unknown;
      name?: string;
      slug: string;
      pages?: string[];
    } | null;
    const slug = role?.slug ?? '';
    const pages = role ? getEffectivePages({ slug: role.slug, pages: role.pages }) : [];
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: slug,
      roleName: String(role?.name ?? '').trim(),
      roleId: role?._id != null ? String(role._id) : '',
      pages,
    };
    next();
  } catch (err) {
    const error = err as Error & { name?: string };
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
}
