import { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { OrderProgressStage } from '../models/OrderProgressStage.js';
import type { OrderArea, OrderState } from '../models/Order.js';

type StageLegacyArea = OrderArea;

function deriveLegacyStateFromArea(area: StageLegacyArea): OrderState {
  switch (area) {
    case 'entrance':
      return 'income';
    case 'maintenance':
      return 'maintenance';
    case 'warehouse':
      return 'warehouse';
    case 'delivery':
      return 'delivery';
    case 'waiting-parts':
      return 'waiting';
    default:
      return 'maintenance';
  }
}

function toStageResponse(stage: {
  _id: unknown;
  key: string;
  label: string;
  description?: string;
  sortOrder: number;
  legacyArea: StageLegacyArea;
}) {
  const legacyState = deriveLegacyStateFromArea(stage.legacyArea);
  return {
    id: String(stage._id),
    key: stage.key,
    label: stage.label,
    description: String(stage.description ?? ''),
    sortOrder: Number(stage.sortOrder ?? 0),
    legacyArea: stage.legacyArea,
    legacyState,
    budgetEditable: stage.legacyArea === 'maintenance',
    requiresAfterRepairPhoto: stage.legacyArea === 'warehouse',
    requiresDeliveryAdvance: stage.legacyArea === 'delivery',
  };
}

const DEFAULT_STAGES: Array<{
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  legacyArea: StageLegacyArea;
}> = [
  {
    key: 'inbound-receiving',
    label: 'Inbound/Receiving',
    description: 'Your equipment was received and registered by our team.',
    sortOrder: 0,
    legacyArea: 'entrance',
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    description: 'Technicians are checking the issue and defining the repair plan.',
    sortOrder: 1,
    legacyArea: 'maintenance',
  },
  {
    key: 'approval',
    label: 'Approval',
    description: 'Confirming approval for the suggested repair/parts.',
    sortOrder: 2,
    legacyArea: 'maintenance',
  },
  {
    key: 'waiting-parts',
    label: 'Waiting for spare parts',
    description: 'We are waiting for the required spare parts to arrive.',
    sortOrder: 3,
    legacyArea: 'waiting-parts',
  },
  {
    key: 'repair',
    label: 'Repair',
    description: 'Repair in progress and parts replacement.',
    sortOrder: 4,
    legacyArea: 'maintenance',
  },
  {
    key: 'testing',
    label: 'Testing',
    description: 'Final testing and quality check before warehouse prep.',
    sortOrder: 5,
    legacyArea: 'maintenance',
  },
  {
    key: 'warehouse-ready',
    label: 'Warehouse/Ready for delivery',
    description: 'The equipment is ready in the warehouse for delivery.',
    sortOrder: 6,
    legacyArea: 'warehouse',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Your equipment is ready for pickup or already delivered.',
    sortOrder: 7,
    legacyArea: 'delivery',
  },
];

export async function seedDefaultStagesIfEmpty(): Promise<void> {
  const count = await OrderProgressStage.countDocuments();
  if (count > 0) return;
  await OrderProgressStage.insertMany(DEFAULT_STAGES);
}

export async function getOrderProgressStagesPublic(_req: Request, res: Response): Promise<Response | void> {
  try {
    await seedDefaultStagesIfEmpty();
    const stages = await OrderProgressStage.find().sort({ sortOrder: 1 }).lean();
    return res.json({ stages: stages.map(toStageResponse) });
  } catch (err) {
    console.error('Get public order progress stages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function validateStageLegacyArea(raw: unknown): raw is StageLegacyArea {
  const v = String(raw ?? '').trim();
  return ['entrance', 'maintenance', 'warehouse', 'delivery', 'waiting-parts'].includes(v);
}

function normalizeKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getOrderProgressStagesAdmin(_req: Request, res: Response): Promise<Response | void> {
  try {
    await seedDefaultStagesIfEmpty();
    const stages = await OrderProgressStage.find().sort({ sortOrder: 1 }).lean();
    return res.json({ stages: stages.map(toStageResponse) });
  } catch (err) {
    console.error('Get admin order progress stages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createOrderProgressStage(req: Request, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;

    const key = normalizeKey(body.key);
    const label = String(body.label ?? '').trim();
    const description = String(body.description ?? '').trim();
    const legacyArea = String(body.legacyArea ?? '').trim();
    const sortOrderRaw = body.sortOrder;

    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!label) return res.status(400).json({ error: 'label is required' });
    if (!validateStageLegacyArea(legacyArea)) return res.status(400).json({ error: 'legacyArea is invalid' });

    const max = await OrderProgressStage.findOne().sort({ sortOrder: -1 }).lean();
    const maxSort = Number(max?.sortOrder ?? 0);
    const finalSort = sortOrderRaw == null ? maxSort + 1 : Number(sortOrderRaw);
    const doc = await OrderProgressStage.create({ key, label, description, sortOrder: finalSort, legacyArea });
    return res.status(201).json({ stage: toStageResponse(doc.toObject() as any) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error?.message?.includes('E11000')) {
      return res.status(409).json({ error: 'A stage with this key already exists' });
    }
    console.error('Create order progress stage error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function updateOrderProgressStage(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const doc = await OrderProgressStage.findById(id);
    if (!doc) return res.status(404).json({ error: 'Stage not found' });

    const body = req.body as Record<string, unknown>;
    const nextLabel = body.label != null ? String(body.label ?? '').trim() : undefined;
    const nextDescription = body.description != null ? String(body.description ?? '').trim() : undefined;
    const nextLegacyArea = body.legacyArea != null ? String(body.legacyArea ?? '').trim() : undefined;
    const nextSortOrder = body.sortOrder != null ? Number(body.sortOrder) : undefined;

    if (nextLabel !== undefined) {
      if (!nextLabel) return res.status(400).json({ error: 'label cannot be empty' });
      doc.label = nextLabel;
    }
    if (nextDescription !== undefined) doc.description = nextDescription;
    if (nextLegacyArea !== undefined) {
      if (!validateStageLegacyArea(nextLegacyArea)) return res.status(400).json({ error: 'legacyArea is invalid' });
      doc.legacyArea = nextLegacyArea;
    }
    if (nextSortOrder !== undefined) {
      if (!Number.isFinite(nextSortOrder)) return res.status(400).json({ error: 'sortOrder must be a number' });
      doc.sortOrder = nextSortOrder;
    }

    await doc.save();
    return res.json({ stage: toStageResponse(doc.toObject() as any) });
  } catch (err) {
    console.error('Update order progress stage error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteOrderProgressStage(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    await seedDefaultStagesIfEmpty();

    const total = await OrderProgressStage.countDocuments();
    if (total <= 1) return res.status(400).json({ error: 'Cannot delete the last stage' });

    const deleted = await OrderProgressStage.findById(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Stage not found' });

    const remaining = await OrderProgressStage.find({ _id: { $ne: id } }).sort({ sortOrder: 1 }).lean();
    if (remaining.length === 0) return res.status(400).json({ error: 'No remaining stages' });

    const replacement = (() => {
      const less = remaining.filter((s) => Number(s.sortOrder ?? 0) < Number(deleted.sortOrder ?? 0));
      if (less.length > 0) return less[less.length - 1]; // nearest previous
      return remaining[0]; // fallback to earliest
    })();

    const replacementLegacyArea = String(replacement.legacyArea) as StageLegacyArea;
    const replacementLegacyState = deriveLegacyStateFromArea(replacementLegacyArea);

    await Order.updateMany(
      { progressStageKey: String(deleted.key) },
      {
        $set: {
          progressStageKey: String(replacement.key),
          area: replacementLegacyArea,
          state: replacementLegacyState,
        },
      }
    );

    await OrderProgressStage.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete order progress stage error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

