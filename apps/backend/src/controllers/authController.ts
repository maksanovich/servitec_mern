import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function login(req: Request, res: Response): Promise<Response | void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpires as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
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
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
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
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
