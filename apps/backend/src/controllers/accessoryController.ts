import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { Accessory } from '../models/Accessory.js';

function toResponse(accessory: { _id: unknown; branch: string; artifact: string; state?: string }) {
  return {
    id: accessory._id,
    branch: accessory.branch,
    artifact: accessory.artifact,
    state: accessory.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllAccessories(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const isAdmin = authReq.user?.role === 'admin';
    const userBranch = isAdmin ? String(authReq.user?.branch ?? '').trim() : '';

    if (isAdmin && !userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
    const query = isAdmin ? { branch: userBranch } : {};
    const accessories = await Accessory.find(query).sort({ branch: 1, artifact: 1 }).lean();
    res.json({
      accessories: accessories.map((a) =>
        toResponse({
          _id: a._id,
          branch: a.branch,
          artifact: a.artifact,
          state: a.state,
        })
      ),
    });
  } catch (err) {
    console.error('Get accessories error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getAccessoryById(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const accessory = await Accessory.findById(id).lean();
    if (!accessory) {
      return res.status(404).json({ error: 'Accessory not found' });
    }
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || accessory.branch !== userBranch) {
        return res.status(404).json({ error: 'Accessory not found' });
      }
    }
    res.json({
      accessory: toResponse({
        _id: accessory._id,
        branch: accessory.branch,
        artifact: accessory.artifact,
        state: accessory.state,
      }),
    });
  } catch (err) {
    console.error('Get accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createAccessory(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { branch, artifact, state } = req.body as {
      branch: string;
      artifact: string;
      state?: 'active' | 'inactive';
    };
    let trimmedBranch = String(branch ?? '').trim();
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
      if (trimmedBranch && trimmedBranch !== userBranch) {
        return res.status(403).json({ error: 'Cannot create accessories for another branch' });
      }
      trimmedBranch = userBranch;
    }

    if (!trimmedBranch || !artifact) {
      return res.status(400).json({ error: 'branch and artifact are required' });
    }
    const doc = await Accessory.create({
      branch: trimmedBranch,
      artifact: String(artifact).trim(),
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    const obj = doc.toObject();
    res.status(201).json({
      accessory: toResponse({
        _id: obj._id,
        branch: obj.branch,
        artifact: obj.artifact,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This accessory already exists for the selected branch' });
    }
    console.error('Create accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateAccessory(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { branch, artifact, state } = req.body as {
      branch?: string;
      artifact?: string;
      state?: 'active' | 'inactive';
    };
    const doc: any = await Accessory.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Accessory not found' });
    }

    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || doc.branch !== userBranch) {
        return res.status(404).json({ error: 'Accessory not found' });
      }
      // Prevent branch reassignment by admins.
      doc.branch = userBranch;
      if (branch !== undefined && String(branch).trim() !== userBranch) {
        return res.status(403).json({ error: 'Cannot move accessory to another branch' });
      }
    } else if (branch !== undefined) {
      doc.branch = String(branch).trim();
    }
    if (artifact !== undefined) doc.artifact = String(artifact).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) {
      doc.state = state;
    }
    await doc.save();
    const obj = doc.toObject();
    res.json({
      accessory: toResponse({
        _id: obj._id,
        branch: obj.branch,
        artifact: obj.artifact,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This accessory already exists for the selected branch' });
    }
    console.error('Update accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteAccessory(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const accessory = await Accessory.findById(id);
    if (!accessory) return res.status(404).json({ error: 'Accessory not found' });

    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || accessory.branch !== userBranch) {
        return res.status(404).json({ error: 'Accessory not found' });
      }
    }

    await accessory.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error('Delete accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

