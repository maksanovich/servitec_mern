import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';

function toResponse(user: {
  _id: unknown;
  email: string;
  name: string;
  identification?: string;
  phone?: string;
  avatar?: string;
  state?: string;
  role?: { _id: unknown; name: string; slug?: string } | null;
}) {
  const role = user.role as { _id: unknown; name: string; slug?: string } | null | undefined;
  return {
    id: user._id,
    email: user.email,
    name: user.name ?? '',
    identification: user.identification ?? '',
    phone: user.phone ?? '',
    avatar: user.avatar ?? '',
    state: user.state === 'inactive' ? 'inactive' : 'active',
    role: role ? { id: role._id, name: role.name, slug: role.slug ?? '' } : null,
  };
}

export async function getAllUsers(_req: Request, res: Response): Promise<Response | void> {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role', 'name slug')
      .sort({ email: 1 })
      .lean();
    res.json({
      users: users.map((u) =>
        toResponse({
          _id: u._id,
          email: u.email,
          name: u.name,
          identification: u.identification,
          phone: u.phone,
          avatar: u.avatar,
          state: u.state,
          role: u.role as { _id: unknown; name: string; slug?: string } | null,
        })
      ),
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getUserById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').populate('role', 'name slug').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: toResponse({
        _id: user._id,
        email: user.email,
        name: user.name,
        identification: user.identification,
        phone: user.phone,
        avatar: user.avatar,
        state: user.state,
        role: user.role as { _id: unknown; name: string; slug?: string } | null,
      }),
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createUser(req: Request, res: Response): Promise<Response | void> {
  try {
    const { email, password, name, identification, phone, roleId, state, avatar } = req.body as {
      email: string;
      password: string;
      name?: string;
      identification?: string;
      phone?: string;
      roleId: string;
      state?: 'active' | 'inactive';
      avatar?: string;
    };
    if (!email || !password || !roleId) {
      return res.status(400).json({ error: 'email, password and roleId are required' });
    }
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.create({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      name: name != null ? String(name).trim() : '',
      identification: identification != null ? String(identification).trim() : '',
      phone: phone != null ? String(phone).trim() : '',
      avatar: avatar != null && typeof avatar === 'string' ? avatar : '',
      role: roleId,
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    await user.populate('role', 'name slug');
    const populated = user.toObject();
    const roleObj = populated.role as { _id: unknown; name: string; slug?: string } | null;
    res.status(201).json({
      user: toResponse({
        _id: user._id,
        email: user.email,
        name: user.name,
        identification: user.identification,
        phone: user.phone,
        avatar: user.avatar,
        state: user.state,
        role: roleObj,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { name, identification, phone, roleId, password, state, avatar } = req.body as {
      name?: string;
      identification?: string;
      phone?: string;
      roleId?: string;
      password?: string;
      state?: 'active' | 'inactive';
      avatar?: string;
    };
    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (name !== undefined) user.name = String(name).trim();
    if (identification !== undefined) user.identification = String(identification).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) user.state = state;
    if (avatar !== undefined) user.avatar = typeof avatar === 'string' ? avatar : '';
    if (roleId !== undefined) {
      const role = await Role.findById(roleId);
      if (!role) return res.status(400).json({ error: 'Invalid role' });
      user.role = roleId as unknown as typeof user.role;
    }
    if (password !== undefined && password !== '') {
      user.password = password;
    }
    await user.save();
    await user.populate('role', 'name slug');
    const populated = user.toObject();
    const roleObj = (populated as { role?: { _id: unknown; name: string; slug?: string } }).role ?? null;
    res.json({
      user: toResponse({
        _id: user._id,
        email: user.email,
        name: user.name,
        identification: user.identification,
        phone: user.phone,
        avatar: user.avatar,
        state: user.state,
        role: roleObj,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
