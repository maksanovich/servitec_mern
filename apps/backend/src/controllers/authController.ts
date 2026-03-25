import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { getEffectivePages, SUPER_ADMIN_SLUG } from '../constants/adminPages.js';

export async function login(req: Request, res: Response): Promise<Response | void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password').populate('role');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const roleDoc = user.role as { slug?: string; name?: string; pages?: string[]; state?: string } | null;
    const roleSlug = roleDoc?.slug;
    if (!roleSlug) {
      return res.status(403).json({ error: 'Access denied. No role assigned.' });
    }
    if (roleDoc?.state === 'inactive') {
      return res.status(403).json({ error: 'This role is inactive.' });
    }
    if (user.state === 'inactive') {
      return res.status(403).json({ error: 'Your account is inactive.' });
    }

    const effectivePages = roleDoc ? getEffectivePages({ slug: roleSlug, pages: roleDoc.pages }) : [];
    if (roleSlug !== SUPER_ADMIN_SLUG && effectivePages.length === 0) {
      return res.status(403).json({
        error: 'No pages assigned to your role. Ask a super administrator to grant access.',
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpires as jwt.SignOptions['expiresIn'] }
    );

    const role = user.role as unknown as { _id: unknown; slug: string; name: string };
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
        role: role
          ? {
              id: role._id,
              slug: role.slug,
              name: role.name,
              pages: effectivePages,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(req.user._id).select('-password').populate('role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const role = user.role as unknown as {
      _id: unknown;
      slug: string;
      name: string;
      pages?: string[];
    } | null;
    const effectivePages = role ? getEffectivePages({ slug: role.slug, pages: role.pages }) : [];
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
        role: role
          ? { id: role._id, slug: role.slug, name: role.name, pages: effectivePages }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, phone } = req.body as { name?: string; phone?: string };
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name !== undefined) user.name = String(name).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    await user.save();
    await user.populate('role');
    const role = user.role as unknown as {
      _id: unknown;
      slug: string;
      name: string;
      pages?: string[];
    } | null;
    const effectivePages = role ? getEffectivePages({ slug: role.slug, pages: role.pages }) : [];
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        role: role
          ? { id: role._id, slug: role.slug, name: role.name, pages: effectivePages }
          : null,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
