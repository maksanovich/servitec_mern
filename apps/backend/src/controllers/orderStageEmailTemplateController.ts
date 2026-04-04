import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { OrderStageEmailTemplate } from '../models/OrderStageEmailTemplate.js';
import type { OrderState } from '../models/Order.js';
import {
  ORDER_EMAIL_PLACEHOLDERS,
  buildOrderProgressEmailContext,
  resolveOrderProgressEmailContent,
} from '../services/orderProgressEmailTemplate.js';

const SAMPLE_ORDER = {
  no: 'ORD-1001',
  code: 'ABC123',
  clientName: 'Jane Customer',
  brand: 'Acme',
  model: 'X100',
  series: 'Rev B',
  type: 'Laptop',
  technicalReport: 'Board inspection; no liquid damage.',
  equipmentCondition: 'Scratches on lid.',
  total: 199.99,
  fianceeDate: '2026-04-15',
  technician: '',
};

export async function listOrderStageEmailTemplates(_req: AuthRequest, res: Response) {
  const docs = await OrderStageEmailTemplate.find().sort({ stageKey: 1 }).lean();
  return res.json({
    placeholders: ORDER_EMAIL_PLACEHOLDERS,
    templates: docs.map((d) => ({
      id: String(d._id),
      stageKey: d.stageKey,
      subjectTemplate: d.subjectTemplate ?? '',
      bodyTemplate: d.bodyTemplate ?? '',
    })),
  });
}

export async function upsertOrderStageEmailTemplate(req: AuthRequest, res: Response) {
  const stageKey = String(req.params.stageKey ?? '').trim();
  if (!stageKey) return res.status(400).json({ error: 'stageKey is required' });
  const body = req.body as { subjectTemplate?: unknown; bodyTemplate?: unknown };
  const subjectTemplate = String(body.subjectTemplate ?? '');
  const bodyTemplate = String(body.bodyTemplate ?? '');
  const doc = await OrderStageEmailTemplate.findOneAndUpdate(
    { stageKey },
    { $set: { stageKey, subjectTemplate, bodyTemplate } },
    { new: true, upsert: true, runValidators: true }
  );
  return res.json({
    template: {
      id: String(doc._id),
      stageKey: doc.stageKey,
      subjectTemplate: doc.subjectTemplate ?? '',
      bodyTemplate: doc.bodyTemplate ?? '',
    },
  });
}

export async function deleteOrderStageEmailTemplate(req: AuthRequest, res: Response) {
  const stageKey = String(req.params.stageKey ?? '').trim();
  if (!stageKey) return res.status(400).json({ error: 'stageKey is required' });
  await OrderStageEmailTemplate.deleteOne({ stageKey });
  return res.json({ ok: true });
}

export async function previewOrderStageEmailTemplate(req: AuthRequest, res: Response) {
  const body = req.body as {
    stageKey?: unknown;
    subjectTemplate?: unknown;
    bodyTemplate?: unknown;
  };
  const stageKey = String(body.stageKey ?? '').trim() || 'diagnosis';
  const subjectTemplate = String(body.subjectTemplate ?? '');
  const bodyTemplate = String(body.bodyTemplate ?? '');

  const ctx = await buildOrderProgressEmailContext(
    SAMPLE_ORDER,
    'maintenance' as OrderState,
    'warehouse' as OrderState,
    'diagnosis',
    stageKey
  );
  const { subject, text } = await resolveOrderProgressEmailContent(stageKey, ctx, {
    subjectTemplate,
    bodyTemplate,
  });
  return res.json({ subject, text });
}
