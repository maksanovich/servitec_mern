import { Request, Response } from 'express';
import { Product } from '../models/Product.js';

function toResponse(item: { _id: unknown; product: string; state?: string }) {
  return {
    id: item._id,
    product: item.product,
    state: item.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getProducts(req: Request, res: Response): Promise<Response | void> {
  try {
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';

    const filter: Record<string, unknown> = {};
    if (state === 'active' || state === 'inactive') filter.state = state;

    const products = await Product.find(filter).sort({ product: 1 }).lean();
    res.json({ products: products.map(toResponse) });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/** Public: active products only for landing page (no auth). */
export async function getProductsPublic(req: Request, res: Response): Promise<Response | void> {
  try {
    const products = await Product.find({ state: 'active' })
      .sort({ product: 1 })
      .lean();
    res.json({ products: products.map(toResponse) });
  } catch (err) {
    console.error('Get products public error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: toResponse(product as any) });
  } catch (err) {
    console.error('Get product by id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<Response | void> {
  try {
    const { product, state } = req.body as {
      product: string;
      state?: 'active' | 'inactive';
    };

    const trimmedProduct = String(product ?? '').trim();
    const normalizedState = state === 'inactive' ? 'inactive' : 'active';

    if (!trimmedProduct) return res.status(400).json({ error: 'product is required' });

    const doc = await Product.create({
      product: trimmedProduct,
      state: normalizedState,
    });

    res.status(201).json({ product: toResponse(doc.toObject() as any) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This product already exists' });
    }
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { product, state } = req.body as {
      product?: string;
      state?: 'active' | 'inactive';
    };

    const doc: any = await Product.findById(id);
    if (!doc) return res.status(404).json({ error: 'Product not found' });

    if (product !== undefined) doc.product = String(product ?? '').trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) doc.state = state;

    await doc.save();
    res.json({ product: toResponse(doc.toObject() as any) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This product already exists' });
    }
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const doc = await Product.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

