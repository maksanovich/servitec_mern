import { Request, Response } from 'express';
import { Role } from '../models/Role.js';

export async function getAllRoles(_req: Request, res: Response): Promise<Response | void> {
  try {
    const roles = await Role.find().sort({ name: 1 }).lean();
    res.json({
      roles: roles.map((r) => ({
        id: r._id,
        name: r.name,
        slug: r.slug,
        description: r.description ?? '',
        state: r.state ?? 'active',
      })),
    });
  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getRoleById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const role = await Role.findById(id).lean();
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({
      role: {
        id: role._id,
        name: role.name,
        slug: role.slug,
        description: role.description ?? '',
        state: role.state ?? 'active',
      },
    });
  } catch (err) {
    console.error('Get role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createRole(req: Request, res: Response): Promise<Response | void> {
  try {
    const { name, slug, description, state } = req.body as {
      name: string;
      slug: string;
      description?: string;
      state?: 'active' | 'inactive';
    };
    if (!name || !slug) {
      return res.status(400).json({ error: 'name and slug are required' });
    }
    const role = await Role.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      description: description != null ? String(description).trim() : '',
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    res.status(201).json({
      role: {
        id: role._id,
        name: role.name,
        slug: role.slug,
        description: role.description ?? '',
        state: role.state ?? 'active',
      },
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this slug already exists' });
    }
    console.error('Create role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateRole(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { name, slug, description, state } = req.body as {
      name?: string;
      slug?: string;
      description?: string;
      state?: 'active' | 'inactive';
    };
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (name !== undefined) role.name = String(name).trim();
    if (slug !== undefined) role.slug = String(slug).trim().toLowerCase();
    if (description !== undefined) role.description = String(description).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) role.state = state;
    await role.save();
    res.json({
      role: {
        id: role._id,
        name: role.name,
        slug: role.slug,
        description: role.description ?? '',
        state: role.state ?? 'active',
      },
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Role with this slug already exists' });
    }
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteRole(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
