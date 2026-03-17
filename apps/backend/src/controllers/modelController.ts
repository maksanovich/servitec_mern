import { Request, Response } from 'express';
import { EquipmentModel } from '../models/Model.js';

function toResponse(model: { _id: unknown; brand: string; model: string; state?: string }) {
  return {
    id: model._id,
    brand: model.brand,
    model: model.model,
    state: model.state === 'inactive' ? 'inactive' : 'active',
  };
}

export async function getAllModels(_req: Request, res: Response): Promise<Response | void> {
  try {
    const models = await EquipmentModel.find().sort({ brand: 1, model: 1 }).lean();
    res.json({
      models: models.map((m) =>
        toResponse({
          _id: m._id,
          brand: m.brand,
          model: m.model,
          state: m.state,
        })
      ),
    });
  } catch (err) {
    console.error('Get models error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getModelById(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const model = await EquipmentModel.findById(id).lean();
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json({
      model: toResponse({
        _id: model._id,
        brand: model.brand,
        model: model.model,
        state: model.state,
      }),
    });
  } catch (err) {
    console.error('Get model error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createModel(req: Request, res: Response): Promise<Response | void> {
  try {
    const { brand, model, state } = req.body as {
      brand: string;
      model: string;
      state?: 'active' | 'inactive';
    };
    if (!brand || !model) {
      return res.status(400).json({ error: 'brand and model are required' });
    }
    const doc = await EquipmentModel.create({
      brand: String(brand).trim(),
      model: String(model).trim(),
      state: state === 'inactive' ? 'inactive' : 'active',
    });
    const obj = doc.toObject();
    res.status(201).json({
      model: toResponse({
        _id: obj._id,
        brand: obj.brand,
        model: obj.model,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A model with this name already exists' });
    }
    console.error('Create model error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateModel(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const { brand, model, state } = req.body as {
      brand?: string;
      model?: string;
      state?: 'active' | 'inactive';
    };
    const doc: any = await EquipmentModel.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Model not found' });
    }
    if (brand !== undefined) doc.brand = String(brand).trim();
    if (model !== undefined) doc.model = String(model).trim();
    if (state !== undefined && (state === 'active' || state === 'inactive')) {
      doc.state = state;
    }
    await doc.save();
    const obj = doc.toObject();
    res.json({
      model: toResponse({
        _id: obj._id,
        brand: obj.brand,
        model: obj.model,
        state: obj.state,
      }),
    });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A model with this name already exists' });
    }
    console.error('Update model error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteModel(req: Request, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const model = await EquipmentModel.findByIdAndDelete(id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete model error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

