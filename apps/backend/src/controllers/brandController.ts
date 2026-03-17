import { Request, Response } from 'express';
import { Brand } from '../models/Brand.js';

function toResponse(brand: { _id: unknown; name: string; state?: string }) {
  return {
    id: brand._id,
    name: brand.name,
    state: brand.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllBrands(_req: Request, res: Response): Promise<Response | void> {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    res.json({
      brands: brands.map((b) =>
        toResponse({
          _id: b._id,
          name: b.name,
          state: b.state,
        })
      ),
    });
  } catch (err) {
    console.error('Get brands error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getBrandById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id).lean();
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.json({
      brand: toResponse({
        _id: brand._id,
        name: brand.name,
        state: brand.state,
      }),
    });
  } catch (err) {
    console.error('Get brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createBrand(req: Request, res: Response): Promise<Response | void> {
  try {
    const { name, state } = req.body as {
      name: string;
      state?: 'active' | 'inactive';
    };
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const brand = await Brand.create({
      name: String(name).trim(),
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    const doc = brand.toObject();
    res.status(201).json({
      brand: toResponse({
        _id: doc._id,
        name: doc.name,
        state: doc.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A brand with this name already exists' });
    }
    console.error('Create brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateBrand(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { name, state } = req.body as {
      name?: string;
      state?: 'active' | 'inactive';
    };
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    if (name !== undefined) brand.name = String(name).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) brand.state = state;
    await brand.save();
    const doc = brand.toObject();
    res.json({
      brand: toResponse({
        _id: doc._id,
        name: doc.name,
        state: doc.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A brand with this name already exists' });
    }
    console.error('Update brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteBrand(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete brand error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

