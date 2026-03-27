import { Request, Response } from 'express';
import { ServiceSparePart } from '../models/ServiceSparePart.js';

function toResponse(item: any) {
  return {
    id: item._id,
    type: item.type,
    name: item.name,
    amount: item.amount ?? 0,
    price: item.price ?? 0,
    details: item.details ?? '',
    state: item.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllServicesSpareParts(_req: Request, res: Response): Promise<Response | void> {
  try {
    const items = await ServiceSparePart.find()
      .sort({ type: 1, name: 1 })
      .lean();
    res.json({ items: items.map(toResponse) });
  } catch (err) {
    console.error('Get services/spare parts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getServiceSparePartById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const item = await ServiceSparePart.findById(id).lean();
    if (!item) return res.status(404).json({ error: 'Service/spare part not found' });
    res.json({ item: toResponse(item) });
  } catch (err) {
    console.error('Get service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const { type, name, amount, price, details, state } = req.body as {
      type: 'service' | 'replacement';
      name: string;
      amount?: number;
      price: number;
      details?: string;
      state?: 'active' | 'inactive';
    };

    const trimmedName = String(name ?? '').trim();
    const trimmedDetails = details != null ? String(details).trim() : '';
    const normalizedType = type === 'replacement' ? 'replacement' : 'service';

    if (!trimmedName) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (price == null || Number.isNaN(Number(price))) {
      return res.status(400).json({ error: 'price is required' });
    }

    const doc = await ServiceSparePart.create({
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
      return res.status(409).json({ error: 'This item already exists' });
    }
    console.error('Create service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { type, name, amount, price, details, state } = req.body as {
      type?: 'service' | 'replacement';
      name?: string;
      amount?: number;
      price?: number;
      details?: string;
      state?: 'active' | 'inactive';
    };

    const doc: any = await ServiceSparePart.findById(id);
    if (!doc) return res.status(404).json({ error: 'Service/spare part not found' });

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
      return res.status(409).json({ error: 'This item already exists' });
    }
    console.error('Update service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteServiceSparePart(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const item = await ServiceSparePart.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: 'Service/spare part not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Delete service/spare part error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

