import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { ServiceSparePart } from '../models/ServiceSparePart.js';

function toResponse(item: any) {
  return {
    id: item._id,
    branch: item.branch,
    type: item.type,
    name: item.name,
    amount: item.amount ?? 0,
    price: item.price ?? 0,
    details: item.details ?? '',
    state: item.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllServicesSpareParts(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const isAdmin = authReq.user?.role === 'admin';
    const userBranch = isAdmin ? String(authReq.user?.branch ?? '').trim() : '';
    if (isAdmin && !userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
    const itemsQuery = isAdmin ? { branch: userBranch } : {};

    const items = await ServiceSparePart.find(itemsQuery)
      .sort({ branch: 1, type: 1, name: 1 })
      .lean();
    res.json({ items: items.map(toResponse) });
  } catch (err) {
    console.error('Get services/spare parts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getServiceSparePartById(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const item = await ServiceSparePart.findById(id).lean();
    if (!item) return res.status(404).json({ error: 'Service/spare part not found' });
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || item.branch !== userBranch) {
        return res.status(404).json({ error: 'Service/spare part not found' });
      }
    }
    res.json({ item: toResponse(item) });
  } catch (err) {
    console.error('Get service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { branch, type, name, amount, price, details, state } = req.body as {
      branch: string;
      type: 'service' | 'replacement';
      name: string;
      amount?: number;
      price: number;
      details?: string;
      state?: 'active' | 'inactive';
    };

    let trimmedBranch = String(branch ?? '').trim();
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
      if (trimmedBranch && trimmedBranch !== userBranch) {
        return res.status(403).json({ error: 'Cannot create services for another branch' });
      }
      trimmedBranch = userBranch;
    }
    const trimmedName = String(name ?? '').trim();
    const trimmedDetails = details != null ? String(details).trim() : '';
    const normalizedType = type === 'replacement' ? 'replacement' : 'service';

    if (!trimmedBranch || !trimmedName) {
      return res.status(400).json({ error: 'branch and name are required' });
    }
    if (price == null || Number.isNaN(Number(price))) {
      return res.status(400).json({ error: 'price is required' });
    }

    const doc = await ServiceSparePart.create({
      branch: trimmedBranch,
      type: normalizedType,
      name: trimmedName,
      amount: amount == null ? 0 : Number(amount),
      price: Number(price),
      details: trimmedDetails,
      state: state === 'inactive' ? 'inactive' : 'active',
    });

    res.status(201).json({ item: toResponse(doc.toObject()) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This item already exists for the selected branch' });
    }
    console.error('Create service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { branch, type, name, amount, price, details, state } = req.body as {
      branch?: string;
      type?: 'service' | 'replacement';
      name?: string;
      amount?: number;
      price?: number;
      details?: string;
      state?: 'active' | 'inactive';
    };

    const doc: any = await ServiceSparePart.findById(id);
    if (!doc) return res.status(404).json({ error: 'Service/spare part not found' });

    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || doc.branch !== userBranch) {
        return res.status(404).json({ error: 'Service/spare part not found' });
      }
      // Prevent branch reassignment by admins.
      doc.branch = userBranch;
      if (branch !== undefined && String(branch).trim() !== userBranch) {
        return res.status(403).json({ error: 'Cannot move service/spare part to another branch' });
      }
    } else if (branch !== undefined) {
      doc.branch = String(branch).trim();
    }
    if (type !== undefined) doc.type = type === 'replacement' ? 'replacement' : 'service';
    if (name !== undefined) doc.name = String(name).trim();
    if (amount !== undefined) doc.amount = Number(amount);
    if (price !== undefined) doc.price = Number(price);
    if (details !== undefined) doc.details = String(details).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) doc.state = state;

    await doc.save();
    res.json({ item: toResponse(doc.toObject()) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This item already exists for the selected branch' });
    }
    console.error('Update service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const item = await ServiceSparePart.findById(id);
    if (!item) return res.status(404).json({ error: 'Service/spare part not found' });
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user?.branch ?? '').trim();
      if (!userBranch || item.branch !== userBranch) {
        return res.status(404).json({ error: 'Service/spare part not found' });
      }
    }
    await item.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error('Delete service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

