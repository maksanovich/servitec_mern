import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { Branch } from '../models/Branch.js';

function toResponse(branch: {
  _id: unknown;
  branchName: string;
  email: string;
  phone?: string;
  address?: string;
  state?: string;
}) {
  return {
    id: branch._id,
    branchName: branch.branchName,
    email: branch.email,
    phone: branch.phone ?? '',
    address: branch.address ?? '',
    state: branch.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllBranches(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const isAdmin = authReq.user?.role === 'admin';
    const userBranch = isAdmin ? String(authReq.user?.branch ?? '').trim() : '';

    if (isAdmin && !userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
    const branches = isAdmin
      ? await Branch.find({ branchName: userBranch }).sort({ branchName: 1 }).lean()
      : await Branch.find().sort({ branchName: 1 }).lean();

    res.json({
      branches: branches.map((b) =>
        toResponse({
          _id: b._id,
          branchName: b.branchName,
          email: b.email,
          phone: b.phone,
          address: b.address,
          state: b.state,
        })
      ),
    });
  } catch (err) {
    console.error('Get branches error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getBranchById(req: Request, res: Response): Promise<Response | void> {
  try {
    // Keep handler compatible with Express's `Request` type.
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const branch = await Branch.findById(id).lean();
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user.branch ?? '').trim();
      if (!userBranch || branch.branchName !== userBranch) {
        return res.status(404).json({ error: 'Branch not found' });
      }
    }
    res.json({
      branch: toResponse({
        _id: branch._id,
        branchName: branch.branchName,
        email: branch.email,
        phone: branch.phone,
        address: branch.address,
        state: branch.state,
      }),
    });
  } catch (err) {
    console.error('Get branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createBranch(req: Request, res: Response): Promise<Response | void> {
  try {
    const { branchName, email, phone, address, state } = req.body as {
      branchName: string;
      email: string;
      phone?: string;
      address?: string;
      state?: 'active' | 'inactive';
    };
    if (!branchName || !email) {
      return res.status(400).json({ error: 'branchName and email are required' });
    }
    const branch = await Branch.create({
      branchName: String(branchName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone != null ? String(phone).trim() : '',
      address: address != null ? String(address).trim() : '',
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    const doc = branch.toObject();
    res.status(201).json({
      branch: toResponse({
        _id: doc._id,
        branchName: doc.branchName,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
        state: doc.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A branch with this name or email already exists' });
    }
    console.error('Create branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateBranch(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { branchName, email, phone, address, state } = req.body as {
      branchName?: string;
      email?: string;
      phone?: string;
      address?: string;
      state?: 'active' | 'inactive';
    };
    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    if (branchName !== undefined) branch.branchName = String(branchName).trim();
    if (email !== undefined) branch.email = String(email).trim().toLowerCase();
    if (phone !== undefined) branch.phone = String(phone).trim();
    if (address !== undefined) branch.address = String(address).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) branch.state = state;
    await branch.save();
    const doc = branch.toObject();
    res.json({
      branch: toResponse({
        _id: doc._id,
        branchName: doc.branchName,
        email: doc.email,
        phone: doc.phone,
        address: doc.address,
        state: doc.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A branch with this name or email already exists' });
    }
    console.error('Update branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteBranch(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
