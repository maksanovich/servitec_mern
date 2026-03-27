import { Request, Response } from 'express';
import { Accessory } from '../models/Accessory.js';

function toResponse(accessory: { _id: unknown; artifact: string; state?: string }) {
  return {
    id: accessory._id,
    artifact: accessory.artifact,
    state: accessory.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllAccessories(_req: Request, res: Response): Promise<Response | void> {
  try {
    const accessories = await Accessory.find().sort({ artifact: 1 }).lean();
    res.json({
      accessories: accessories.map((a) =>
        toResponse({
          _id: a._id,
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
    const { id } = req.params;
    const accessory = await Accessory.findById(id).lean();
    if (!accessory) {
      return res.status(404).json({ error: 'Accessory not found' });
    }
    res.json({
      accessory: toResponse({
        _id: accessory._id,
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
    const { artifact, state } = req.body as {
      artifact: string;
      state?: 'active' | 'inactive';
    };
    if (!artifact) {
      return res.status(400).json({ error: 'artifact is required' });
    }
    const doc = await Accessory.create({
      artifact: String(artifact).trim(),
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    const obj = doc.toObject();
    res.status(201).json({
      accessory: toResponse({
        _id: obj._id,
        artifact: obj.artifact,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This accessory already exists' });
    }
    console.error('Create accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateAccessory(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { artifact, state } = req.body as {
      artifact?: string;
      state?: 'active' | 'inactive';
    };
    const doc: any = await Accessory.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Accessory not found' });
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
        artifact: obj.artifact,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This accessory already exists' });
    }
    console.error('Update accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteAccessory(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const accessory = await Accessory.findByIdAndDelete(id);
    if (!accessory) {
      return res.status(404).json({ error: 'Accessory not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete accessory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

