import { Request, Response } from 'express';

import { SpareServer } from '../models/SpareServer.js';

import { getProductImage } from '../services/perseoService.js';

import {

  descriptionFromPayload,

  precioFromPayload,

  tarifasArrayFromPayload,

  stockFromPayload,

} from '../services/perseoProductFields.js';



function mapSpareDocToItem(d: {

  _id: unknown;

  productosid: number;

  productocodigo?: string;

  payload?: Record<string, unknown>;

  updatedAt?: Date;

}) {

  const payload = (d.payload ?? {}) as Record<string, unknown>;

  const updated = d.updatedAt;

  const productosid = typeof d.productosid === 'number' ? d.productosid : Number(d.productosid);

  const tarifas = tarifasArrayFromPayload(payload);

  return {

    id: String(d._id),

    productosid: Number.isFinite(productosid) ? productosid : 0,

    productocodigo: d.productocodigo ?? '',

    description: descriptionFromPayload(payload),

    precio: precioFromPayload(payload),

    tarifas,

    stock: stockFromPayload(payload),

    updatedAt: updated ? new Date(updated).toISOString() : null,

  };

}



/**

 * Perseo `productos_consulta` — price from first tarifas row; stock from existenciastotales or ubicaciones/root fallbacks.

 */

export async function listSpareServer(_req: Request, res: Response): Promise<Response | void> {

  try {

    const docs = await SpareServer.find().sort({ productocodigo: 1 }).lean();

    const items = docs.map((d) => mapSpareDocToItem(d));

    return res.json({ items });

  } catch (err) {

    console.error('listSpareServer error:', err);

    return res.status(500).json({ error: 'Failed to list spare server catalog' });

  }

}



/** Single product: mapped fields plus raw arrays / payload for detail modal. */

export async function getSpareServerByProductId(req: Request, res: Response): Promise<Response | void> {

  try {

    const productosid = Number(req.params.productosid);

    if (!Number.isFinite(productosid) || productosid <= 0) {

      return res.status(400).json({ error: 'Invalid product id' });

    }

    const doc = await SpareServer.findOne({ productosid }).lean();

    if (!doc) {

      return res.status(404).json({ error: 'Product not found' });

    }

    const payload = (doc.payload ?? {}) as Record<string, unknown>;

    const tarifas = tarifasArrayFromPayload(payload);

    const ubicaciones = Array.isArray(payload.ubicaciones) ? payload.ubicaciones : [];

    return res.json({

      item: {

        ...mapSpareDocToItem(doc),

        tarifas,

        ubicaciones,

        payload,

      },

    });

  } catch (err) {

    console.error('getSpareServerByProductId error:', err);

    return res.status(500).json({ error: 'Failed to load spare server product' });

  }

}



/** Perseo product image for admin spare-parts table (lazy-loaded from frontend). */

export async function getSpareServerProductImage(req: Request, res: Response): Promise<Response | void> {

  try {

    const id = Number(req.params.productosid);

    if (!Number.isFinite(id) || id <= 0) {

      return res.status(400).json({ error: 'Invalid product id' });

    }

    const result = await getProductImage(id);

    if (!result.ok) {

      return res.json({ src: null });

    }

    return res.json({ src: result.src });

  } catch (err) {

    console.error('getSpareServerProductImage error:', err);

    return res.status(500).json({ error: 'Failed to load product image' });

  }

}

