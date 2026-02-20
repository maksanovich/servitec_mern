import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: { _id: string; email: string; name: string; role: string };
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
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
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
