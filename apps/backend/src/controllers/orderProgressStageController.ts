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
    label: 'Recepción / Ingreso',
    description: 'Su equipo fue recibido y registrado por nuestro equipo.',
    sortOrder: 0,
    workflow: 'standard',
    legacyArea: 'entrance',
  },
  {
    key: 'diagnosis',
    label: 'Diagnóstico',
    description: 'Los técnicos revisan la falla y definen el plan de reparación.',
    sortOrder: 1,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'approval',
    label: 'Aprobación',
    description: 'Confirmación de la aprobación de la reparación o repuestos sugeridos.',
    sortOrder: 2,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'waiting-parts',
    label: 'Espera de repuestos',
    description: 'Estamos a la espera de que lleguen los repuestos necesarios.',
    sortOrder: 3,
    workflow: 'standard',
    legacyArea: 'waiting-parts',
  },
  {
    key: 'repair',
    label: 'Reparación',
    description: 'Reparación en curso y sustitución de piezas.',
    sortOrder: 4,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'testing',
    label: 'Pruebas',
    description: 'Pruebas finales y control de calidad antes del almacén.',
    sortOrder: 5,
    workflow: 'standard',
    legacyArea: 'maintenance',
  },
  {
    key: 'warehouse-ready',
    label: 'Almacén / Listo para entrega',
    description: 'El equipo está listo en almacén para su entrega.',
    sortOrder: 6,
    workflow: 'standard',
    legacyArea: 'warehouse',
  },
  {
    key: 'delivery',
    label: 'Entrega',
    description: 'Su equipo está listo para retiro o ya fue entregado.',
    sortOrder: 7,
    workflow: 'standard',
    legacyArea: 'delivery',
  },
];

/** Etapas por defecto del flujo de garantía (español). */
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
    label: 'Recepción del equipo',
    description: 'Producto recibido con detalle de la falla y datos del cliente.',
    sortOrder: 0,
    workflow: 'warranty',
    legacyArea: 'entrance',
  },
  {
    key: 'warranty-diagnosis',
    label: 'En diagnóstico',
    description: 'Revisión inicial para confirmar la falla y el estado físico.',
    sortOrder: 1,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-validation',
    label: 'Validación de garantía',
    description: 'Confirmar elegibilidad: factura, plazos y condiciones de garantía.',
    sortOrder: 2,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-transferred-asc',
    label: 'Transferido a centro de servicio autorizado',
    description: 'Enviado al distribuidor o fabricante.',
    sortOrder: 3,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-waiting-provider-approval',
    label: 'En espera de aprobación',
    description: 'El proveedor revisa y decide si aplica la garantía.',
    sortOrder: 4,
    workflow: 'warranty',
    legacyArea: 'waiting-parts',
  },
  {
    key: 'warranty-approved',
    label: 'Aprobado',
    description: 'La garantía fue aceptada.',
    sortOrder: 5,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-rejected',
    label: 'Rechazado',
    description: 'No aplica garantía; incluir el motivo.',
    sortOrder: 6,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-solution-in-progress',
    label: 'En proceso de solución',
    description: 'Reparación, reemplazo o nota de crédito.',
    sortOrder: 7,
    workflow: 'warranty',
    legacyArea: 'maintenance',
  },
  {
    key: 'warranty-solution-done',
    label: 'Solución implementada',
    description: 'Equipo reparado o reemplazo recibido.',
    sortOrder: 8,
    workflow: 'warranty',
    legacyArea: 'warehouse',
  },
  {
    key: 'warranty-ready-pickup',
    label: 'Listo para entrega',
    description: 'Disponible para que el cliente lo retire.',
    sortOrder: 9,
    workflow: 'warranty',
    legacyArea: 'delivery',
  },
];

/** Etiquetas en inglés anteriores: solo las filas que coincidan se migran al español actual. */
const WARRANTY_LEGACY_ENGLISH_LABELS: Record<string, string> = {
  'warranty-receiving': 'Equipment intake',
  'warranty-diagnosis': 'In diagnosis',
  'warranty-validation': 'Warranty validation',
  'warranty-transferred-asc': 'Transferred to authorized service center',
  'warranty-waiting-provider-approval': 'Awaiting approval',
  'warranty-approved': 'Approved',
  'warranty-rejected': 'Rejected',
  'warranty-solution-in-progress': 'Solution in progress',
  'warranty-solution-done': 'Solution completed',
  'warranty-ready-pickup': 'Ready for pickup',
};

export async function seedDefaultStagesIfEmpty(): Promise<void> {
  const count = await OrderProgressStage.countDocuments();
  if (count > 0) return;
  await OrderProgressStage.insertMany(DEFAULT_STAGES);
}

/** Asegura que existan las etapas de garantía y que las filas heredadas tengan `workflow: standard`. */
export async function ensureWarrantyStages(): Promise<void> {
  await seedDefaultStagesIfEmpty();
  await OrderProgressStage.updateMany(
    { $or: [{ workflow: { $exists: false } }, { workflow: null }, { workflow: '' }] },
    { $set: { workflow: 'standard' } }
  );
  for (const row of DEFAULT_WARRANTY_STAGES) {
    const oldLabel = WARRANTY_LEGACY_ENGLISH_LABELS[row.key];
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
  await syncCanonicalStageSortOrders();
}

/** Etapas de cuarentena / abandono automáticos tras largo tiempo sin retiro (ver cron de cuarentena en entrega). */
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
    label: 'Cuarentena',
    description:
      'Equipo sin reclamar; pasado a cuarentena tras dos meses en entrega sin retiro.',
    sortOrder: 8,
    workflow: 'standard',
    legacyArea: 'quarantine',
  },
  {
    key: 'delivery-abandonment',
    label: 'Abandono',
    description: 'Equipo trasladado a almacén de abandono tras cuatro meses sin retiro.',
    sortOrder: 9,
    workflow: 'standard',
    legacyArea: 'abandonment',
  },
  {
    key: 'warranty-quarantine',
    label: 'Cuarentena',
    description:
      'Equipo sin reclamar; pasado a cuarentena tras dos meses en entrega sin retiro.',
    sortOrder: 10,
    workflow: 'warranty',
    legacyArea: 'quarantine',
  },
  {
    key: 'warranty-abandonment',
    label: 'Abandono',
    description: 'Equipo trasladado a almacén de abandono tras cuatro meses sin retiro.',
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

/** Devuelve etiquetas cortas si una versión anterior las alargó en BD. */
async function revertExpandedStageLabelsIfPresent(): Promise<void> {
  await OrderProgressStage.updateMany(
    { key: 'waiting-parts', label: 'Espera de repuestos (si aplica)' },
    { $set: { label: 'Espera de repuestos' } }
  );
  await OrderProgressStage.updateMany(
    { key: 'delivery-quarantine', label: 'Cuarentena (observación final opcional)' },
    {
      $set: {
        label: 'Cuarentena',
        description:
          'Equipo sin reclamar; pasado a cuarentena tras dos meses en entrega sin retiro.',
      },
    }
  );
  await OrderProgressStage.updateMany(
    { key: 'delivery-abandonment', label: 'Abandono (estado aparte para equipos no retirados)' },
    {
      $set: {
        label: 'Abandono',
        description: 'Equipo trasladado a almacén de abandono tras cuatro meses sin retiro.',
      },
    }
  );
  await OrderProgressStage.updateMany(
    { key: 'warranty-quarantine', label: 'Cuarentena (observación final opcional)' },
    {
      $set: {
        label: 'Cuarentena',
        description:
          'Equipo sin reclamar; pasado a cuarentena tras dos meses en entrega sin retiro.',
      },
    }
  );
  await OrderProgressStage.updateMany(
    { key: 'warranty-abandonment', label: 'Abandono (estado aparte para equipos no retirados)' },
    {
      $set: {
        label: 'Abandono',
        description: 'Equipo trasladado a almacén de abandono tras cuatro meses sin retiro.',
      },
    }
  );
}

/** Mantiene solo el orden de pestañas (`sortOrder`) y metadatos; no modifica etiquetas mostradas en la UI. */
async function syncCanonicalStageSortOrders(): Promise<void> {
  await revertExpandedStageLabelsIfPresent();
  for (const row of DEFAULT_STAGES) {
    await OrderProgressStage.updateOne(
      { key: row.key },
      { $set: { sortOrder: row.sortOrder, legacyArea: row.legacyArea, workflow: row.workflow } }
    );
  }
  for (const row of DEFAULT_WARRANTY_STAGES) {
    await OrderProgressStage.updateOne(
      { key: row.key },
      { $set: { sortOrder: row.sortOrder, legacyArea: row.legacyArea, workflow: row.workflow } }
    );
  }
  for (const row of QUARANTINE_ABANDONMENT_STAGES) {
    await OrderProgressStage.updateOne(
      { key: row.key },
      { $set: { sortOrder: row.sortOrder, legacyArea: row.legacyArea, workflow: row.workflow } }
    );
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
    console.error('Error al obtener etapas públicas de progreso de orden:', err);
    return res.status(500).json({ error: 'Error del servidor' });
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
    console.error('Error al obtener etapas de progreso de orden (admin):', err);
    return res.status(500).json({ error: 'Error del servidor' });
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

    if (!key) return res.status(400).json({ error: 'La clave (key) es obligatoria' });
    if (!label) return res.status(400).json({ error: 'La etiqueta (label) es obligatoria' });
    if (!validateStageLegacyArea(legacyArea))
      return res.status(400).json({ error: 'legacyArea no es válido' });
    if (!validateStageWorkflow(workflowRaw))
      return res.status(400).json({ error: 'workflow no es válido' });
    const workflow = workflowRaw as OrderProgressStageWorkflow;

    const max = await OrderProgressStage.findOne({ workflow }).sort({ sortOrder: -1 }).lean();
    const maxSort = Number(max?.sortOrder ?? 0);
    const finalSort = sortOrderRaw == null ? maxSort + 1 : Number(sortOrderRaw);
    const doc = await OrderProgressStage.create({ key, label, description, sortOrder: finalSort, legacyArea, workflow });
    return res.status(201).json({ stage: toStageResponse(doc.toObject() as any) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error?.message?.includes('E11000')) {
      return res.status(409).json({ error: 'Ya existe una etapa con esta clave' });
    }
    console.error('Error al crear etapa de progreso de orden:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

export async function updateOrderProgressStage(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'El id es obligatorio' });

    const doc = await OrderProgressStage.findById(id);
    if (!doc) return res.status(404).json({ error: 'Etapa no encontrada' });

    const body = req.body as Record<string, unknown>;
    const nextLabel = body.label != null ? String(body.label ?? '').trim() : undefined;
    const nextDescription = body.description != null ? String(body.description ?? '').trim() : undefined;
    const nextLegacyArea = body.legacyArea != null ? String(body.legacyArea ?? '').trim() : undefined;
    const nextSortOrder = body.sortOrder != null ? Number(body.sortOrder) : undefined;

    if (nextLabel !== undefined) {
      if (!nextLabel) return res.status(400).json({ error: 'La etiqueta no puede estar vacía' });
      doc.label = nextLabel;
    }
    if (nextDescription !== undefined) doc.description = nextDescription;
    if (nextLegacyArea !== undefined) {
      if (!validateStageLegacyArea(nextLegacyArea))
        return res.status(400).json({ error: 'legacyArea no es válido' });
      doc.legacyArea = nextLegacyArea;
    }
    if (nextSortOrder !== undefined) {
      if (!Number.isFinite(nextSortOrder))
        return res.status(400).json({ error: 'sortOrder debe ser un número' });
      doc.sortOrder = nextSortOrder;
    }

    await doc.save();
    return res.json({ stage: toStageResponse(doc.toObject() as any) });
  } catch (err) {
    console.error('Error al actualizar etapa de progreso de orden:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

export async function deleteOrderProgressStage(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'El id es obligatorio' });

    await ensureWarrantyStages();

    const deleted = await OrderProgressStage.findById(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Etapa no encontrada' });

    const wf = stageWorkflow(deleted);
    const totalInWorkflow = await OrderProgressStage.countDocuments({ workflow: wf });
    if (totalInWorkflow <= 1)
      return res.status(400).json({ error: 'No se puede eliminar la última etapa de este flujo' });

    const remaining = await OrderProgressStage.find({ _id: { $ne: id }, workflow: wf }).sort({ sortOrder: 1 }).lean();
    if (remaining.length === 0) return res.status(400).json({ error: 'No quedan etapas' });

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
    console.error('Error al eliminar etapa de progreso de orden:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}

