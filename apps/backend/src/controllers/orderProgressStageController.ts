import { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { OrderProgressStage, type OrderProgressStageWorkflow } from '../models/OrderProgressStage.js';
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
    case 'quarantine':
    case 'abandonment':
      return 'delivery';
    case 'waiting-parts':
      return 'waiting';
    default:
      return 'maintenance';
  }
}

function stageWorkflow(stage: { workflow?: OrderProgressStageWorkflow }): OrderProgressStageWorkflow {
  const w = String(stage.workflow ?? 'standard').trim();
  return w === 'warranty' ? 'warranty' : 'standard';
}

function toStageResponse(stage: {
  _id: unknown;
  key: string;
  label: string;
  description?: string;
  sortOrder: number;
  workflow?: OrderProgressStageWorkflow;
  legacyArea: StageLegacyArea;
}) {
  const legacyState = deriveLegacyStateFromArea(stage.legacyArea);
  const wf = stageWorkflow(stage);
  return {
    id: String(stage._id),
    key: stage.key,
    label: stage.label,
    description: String(stage.description ?? ''),
    sortOrder: Number(stage.sortOrder ?? 0),
    workflow: wf,
    legacyArea: stage.legacyArea,
    legacyState,
    budgetEditable: wf === 'standard' && stage.legacyArea === 'maintenance',
    requiresAfterRepairPhoto: stage.legacyArea === 'warehouse',
    requiresDeliveryAdvance:
      stage.legacyArea === 'delivery' ||
      stage.legacyArea === 'quarantine' ||
      stage.legacyArea === 'abandonment',
  };
}

const DEFAULT_STAGES: Array<{
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  workflow: OrderProgressStageWorkflow;
  legacyArea: StageLegacyArea;
}> = [
  {
    key: 'inbound-receiving',
    label: 'Inbound/Receiving',
    description: 'Your equipment was received and registered by our team.',
    sortOrder: 0,
    workflow: 'standard',
    legacyArea: 'entrance',
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    description: 'Technicians are checking the issue and defining the repair plan.',
    sortOrder: 1,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'approval',
    label: 'Approval',
    description: 'Confirming approval for the suggested repair/parts.',
    sortOrder: 2,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'waiting-parts',
    label: 'Waiting for spare parts',
    description: 'We are waiting for the required spare parts to arrive.',
    sortOrder: 3,
    workflow: 'standard',
    legacyArea: 'waiting-parts',
  },
  {
    key: 'repair',
    label: 'Repair',
    description: 'Repair in progress and parts replacement.',
    sortOrder: 4,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'testing',
    label: 'Testing',
    description: 'Final testing and quality check before warehouse prep.',
    sortOrder: 5,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'warehouse-ready',
    label: 'Warehouse/Ready for delivery',
    description: 'The equipment is ready in the warehouse for delivery.',
    sortOrder: 6,
    workflow: 'standard',
    legacyArea: 'warehouse',
  },
  {
    key: 'delivery',
    label: 'Delivery',
    description: 'Your equipment is ready for pickup or already delivered.',
    sortOrder: 7,
    workflow: 'standard',
    legacyArea: 'delivery',
  },
];

/** Default warranty pipeline (English labels). */
const DEFAULT_WARRANTY_STAGES: Array<{
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  workflow: OrderProgressStageWorkflow;
  legacyArea: StageLegacyArea;
}> = [
  {
    key: 'warranty-receiving',
    label: 'Equipment intake',
    description: 'Product received with fault details and customer information.',
    sortOrder: 0,
    workflow: 'warranty',
    legacyArea: 'entrance',
  },
  {
    key: 'warranty-diagnosis',
    label: 'In diagnosis',
    description: 'Initial review to confirm the fault and physical condition.',
    sortOrder: 1,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-validation',
    label: 'Warranty validation',
    description: 'Confirm warranty eligibility: invoice, timeframe, and conditions.',
    sortOrder: 2,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-transferred-asc',
    label: 'Transferred to authorized service center',
    description: 'Sent to the distributor or manufacturer.',
    sortOrder: 3,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-waiting-provider-approval',
    label: 'Awaiting approval',
    description: 'The provider reviews and decides whether warranty applies.',
    sortOrder: 4,
    workflow: 'warranty',
    legacyArea: 'waiting-parts',
  },
  {
    key: 'warranty-approved',
    label: 'Approved',
    description: 'Warranty was accepted.',
    sortOrder: 5,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-rejected',
    label: 'Rejected',
    description: 'Warranty does not apply — include the reason.',
    sortOrder: 6,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-solution-in-progress',
    label: 'Solution in progress',
    description: 'Repair, replacement, or credit note.',
    sortOrder: 7,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-solution-done',
    label: 'Solution completed',
    description: 'Equipment repaired or replacement received.',
    sortOrder: 8,
    workflow: 'warranty',
    legacyArea: 'warehouse',
  },
  {
    key: 'warranty-ready-pickup',
    label: 'Ready for pickup',
    description: 'Available for the customer to collect.',
    sortOrder: 9,
    workflow: 'warranty',
    legacyArea: 'delivery',
  },
];

/** Previous default Spanish labels — only rows that still match are migrated to English. */
const WARRANTY_LEGACY_SPANISH_LABELS: Record<string, string> = {
  'warranty-receiving': 'Recepción del equipo',
  'warranty-diagnosis': 'En diagnóstico',
  'warranty-validation': 'Validación de garantía',
  'warranty-transferred-asc': 'Transferido a centro de servicio autorizado',
  'warranty-waiting-provider-approval': 'En espera de aprobación',
  'warranty-approved': 'Aprobado',
  'warranty-rejected': 'Rechazado',
  'warranty-solution-in-progress': 'En proceso de solución',
  'warranty-solution-done': 'Solución implementada',
  'warranty-ready-pickup': 'Listo para entrega',
};

export async function seedDefaultStagesIfEmpty(): Promise<void> {
  const count = await OrderProgressStage.countDocuments();
  if (count > 0) return;
  await OrderProgressStage.insertMany(DEFAULT_STAGES);
}

/** Ensures warranty stages exist and legacy rows have `workflow: standard`. */
export async function ensureWarrantyStages(): Promise<void> {
  await seedDefaultStagesIfEmpty();
  await OrderProgressStage.updateMany(
    { $or: [{ workflow: { $exists: false } }, { workflow: null }, { workflow: '' }] },
    { $set: { workflow: 'standard' } }
  );
  for (const row of DEFAULT_WARRANTY_STAGES) {
    const oldLabel = WARRANTY_LEGACY_SPANISH_LABELS[row.key];
    if (oldLabel) {
      await OrderProgressStage.updateOne(
        { key: row.key, label: oldLabel },
        { $set: { label: row.label, description: row.description } }
      );
    }
  }
  for (const row of DEFAULT_WARRANTY_STAGES) {
    const exists = await OrderProgressStage.findOne({ key: row.key }).lean();
    if (!exists) {
      await OrderProgressStage.create(row);
    }
  }
  await ensureQuarantineAbandonmentStages();
}

/** Stages for automated quarantine / abandonment after long non-pickup (see delivery quarantine cron). */
const QUARANTINE_ABANDONMENT_STAGES: Array<{
  key: string;
  label: string;
  description: string;
  sortOrder: number;
  workflow: OrderProgressStageWorkflow;
  legacyArea: StageLegacyArea;
}> = [
  {
    key: 'delivery-quarantine',
    label: 'Quarantine',
    description: 'Equipment unclaimed; moved to quarantine after two months in delivery without pickup.',
    sortOrder: 8,
    workflow: 'standard',
    legacyArea: 'quarantine',
  },
  {
    key: 'delivery-abandonment',
    label: 'Abandonment',
    description: 'Equipment moved to abandonment storage after four months without pickup.',
    sortOrder: 9,
    workflow: 'standard',
    legacyArea: 'abandonment',
  },
  {
    key: 'warranty-quarantine',
    label: 'Quarantine',
    description: 'Equipment unclaimed; moved to quarantine after two months in delivery without pickup.',
    sortOrder: 10,
    workflow: 'warranty',
    legacyArea: 'quarantine',
  },
  {
    key: 'warranty-abandonment',
    label: 'Abandonment',
    description: 'Equipment moved to abandonment storage after four months without pickup.',
    sortOrder: 11,
    workflow: 'warranty',
    legacyArea: 'abandonment',
  },
];

export async function ensureQuarantineAbandonmentStages(): Promise<void> {
  for (const row of QUARANTINE_ABANDONMENT_STAGES) {
    const exists = await OrderProgressStage.findOne({ key: row.key }).lean();
    if (!exists) {
      await OrderProgressStage.create(row);
    }
  }
}

function parseWorkflowQuery(raw: unknown): OrderProgressStageWorkflow | null {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'standard' || v === 'warranty') return v;
  return null;
}

export async function getOrderProgressStagesPublic(req: Request, res: Response): Promise<Response | void> {
  try {
    await ensureWarrantyStages();
    const wf = parseWorkflowQuery(req.query.workflow);
    const q = wf ? { workflow: wf } : {};
    const stages = await OrderProgressStage.find(q).sort({ workflow: 1, sortOrder: 1 }).lean();
    return res.json({ stages: stages.map(toStageResponse) });
  } catch (err) {
    console.error('Get public order progress stages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function validateStageLegacyArea(raw: unknown): raw is StageLegacyArea {
  const v = String(raw ?? '').trim();
  return [
    'entrance',
    'maintenance',
    'warehouse',
    'delivery',
    'quarantine',
    'abandonment',
    'waiting-parts',
  ].includes(v);
}

function validateStageWorkflow(raw: unknown): raw is OrderProgressStageWorkflow {
  const v = String(raw ?? '').trim().toLowerCase();
  return v === 'standard' || v === 'warranty';
}

function normalizeKey(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getOrderProgressStagesAdmin(req: Request, res: Response): Promise<Response | void> {
  try {
    await ensureWarrantyStages();
    const wf = parseWorkflowQuery(req.query.workflow);
    const q = wf ? { workflow: wf } : {};
    const stages = await OrderProgressStage.find(q).sort({ workflow: 1, sortOrder: 1 }).lean();
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
    const workflowRaw = body.workflow != null ? body.workflow : 'standard';

    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!label) return res.status(400).json({ error: 'label is required' });
    if (!validateStageLegacyArea(legacyArea)) return res.status(400).json({ error: 'legacyArea is invalid' });
    if (!validateStageWorkflow(workflowRaw)) return res.status(400).json({ error: 'workflow is invalid' });
    const workflow = workflowRaw as OrderProgressStageWorkflow;

    const max = await OrderProgressStage.findOne({ workflow }).sort({ sortOrder: -1 }).lean();
    const maxSort = Number(max?.sortOrder ?? 0);
    const finalSort = sortOrderRaw == null ? maxSort + 1 : Number(sortOrderRaw);
    const doc = await OrderProgressStage.create({ key, label, description, sortOrder: finalSort, legacyArea, workflow });
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

    await ensureWarrantyStages();

    const deleted = await OrderProgressStage.findById(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Stage not found' });

    const wf = stageWorkflow(deleted);
    const totalInWorkflow = await OrderProgressStage.countDocuments({ workflow: wf });
    if (totalInWorkflow <= 1) return res.status(400).json({ error: 'Cannot delete the last stage in this workflow' });

    const remaining = await OrderProgressStage.find({ _id: { $ne: id }, workflow: wf }).sort({ sortOrder: 1 }).lean();
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

