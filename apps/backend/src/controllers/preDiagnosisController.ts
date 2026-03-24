import { Request, Response } from 'express';
import { PreDiagnosisRule } from '../models/PreDiagnosisRule.js';

type Rule = {
  id?: string;
  device: string;
  symptom: string;
  probableIssue: string;
  estimateMin: number;
  estimateMax: number;
  etaHours: number;
  state?: 'active' | 'inactive';
};

function toRuleResponse(rule: {
  _id: unknown;
  device: string;
  symptom: string;
  probableIssue: string;
  estimateMin: number;
  estimateMax: number;
  etaHours: number;
  state?: string;
}): Rule {
  return {
    id: String(rule._id),
    device: String(rule.device ?? '').trim().toLowerCase(),
    symptom: String(rule.symptom ?? '').trim().toLowerCase(),
    probableIssue: String(rule.probableIssue ?? '').trim(),
    estimateMin: Number(rule.estimateMin ?? 0),
    estimateMax: Number(rule.estimateMax ?? 0),
    etaHours: Number(rule.etaHours ?? 0),
    state: rule.state === 'inactive' ? 'inactive' : 'active',
  };
}

function validateRulePayload(body: Record<string, unknown>): { value?: Omit<Rule, 'id'>; error?: string } {
  const device = String(body.device ?? '').trim().toLowerCase();
  const symptom = String(body.symptom ?? '').trim().toLowerCase();
  const probableIssue = String(body.probableIssue ?? '').trim();
  const estimateMin = Number(body.estimateMin);
  const estimateMax = Number(body.estimateMax);
  const etaHours = Number(body.etaHours);
  const state = String(body.state ?? 'active').trim().toLowerCase();

  if (!device) return { error: 'device is required' };
  if (!symptom) return { error: 'symptom is required' };
  if (!probableIssue) return { error: 'probableIssue is required' };
  if (!Number.isFinite(estimateMin) || estimateMin < 0) return { error: 'estimateMin must be a valid positive number' };
  if (!Number.isFinite(estimateMax) || estimateMax < 0) return { error: 'estimateMax must be a valid positive number' };
  if (estimateMax < estimateMin) return { error: 'estimateMax must be greater than or equal to estimateMin' };
  if (!Number.isFinite(etaHours) || etaHours < 0) return { error: 'etaHours must be a valid positive number' };
  if (state !== 'active' && state !== 'inactive') return { error: 'state must be active or inactive' };

  return {
    value: {
      device,
      symptom,
      probableIssue,
      estimateMin,
      estimateMax,
      etaHours,
      state,
    },
  };
}

export async function getPreDiagnosisRulesPublic(_req: Request, res: Response): Promise<Response | void> {
  try {
    const rules = await PreDiagnosisRule.find({ state: 'active' }).sort({ device: 1, symptom: 1 }).lean();
    return res.json({ rules: rules.map((r) => toRuleResponse(r)) });
  } catch (err) {
    console.error('Get public pre-diagnosis rules error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function getPreDiagnosisRulesAdmin(_req: Request, res: Response): Promise<Response | void> {
  try {
    const rules = await PreDiagnosisRule.find().sort({ device: 1, symptom: 1 }).lean();
    return res.json({ rules: rules.map((r) => toRuleResponse(r)) });
  } catch (err) {
    console.error('Get admin pre-diagnosis rules error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createPreDiagnosisRule(req: Request, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;
    const parsed = validateRulePayload(body);
    if (!parsed.value) return res.status(400).json({ error: parsed.error || 'Invalid payload' });

    const doc = await PreDiagnosisRule.create(parsed.value);
    return res.status(201).json({ rule: toRuleResponse(doc.toObject()) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A rule with this device and symptom already exists' });
    }
    console.error('Create pre-diagnosis rule error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function updatePreDiagnosisRule(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const body = req.body as Record<string, unknown>;
    const parsed = validateRulePayload(body);
    if (!parsed.value) return res.status(400).json({ error: parsed.error || 'Invalid payload' });

    const doc = await PreDiagnosisRule.findById(id);
    if (!doc) return res.status(404).json({ error: 'Rule not found' });

    doc.device = parsed.value.device;
    doc.symptom = parsed.value.symptom;
    doc.probableIssue = parsed.value.probableIssue;
    doc.estimateMin = parsed.value.estimateMin;
    doc.estimateMax = parsed.value.estimateMax;
    doc.etaHours = parsed.value.etaHours;
    doc.state = parsed.value.state === 'inactive' ? 'inactive' : 'active';
    await doc.save();

    return res.json({ rule: toRuleResponse(doc.toObject()) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A rule with this device and symptom already exists' });
    }
    console.error('Update pre-diagnosis rule error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deletePreDiagnosisRule(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });
    const doc = await PreDiagnosisRule.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Rule not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('Delete pre-diagnosis rule error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function evaluatePreDiagnosis(req: Request, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;
    const device = String(body.device ?? '').trim().toLowerCase();
    const symptom = String(body.symptom ?? '').trim().toLowerCase();
    if (!device || !symptom) {
      return res.status(400).json({ error: 'device and symptom are required' });
    }

    const hit = await PreDiagnosisRule.findOne({ device, symptom, state: 'active' }).lean();
    if (!hit) {
      return res.json({
        result: {
          probableIssue: 'General diagnostic required',
          estimateMin: 20,
          estimateMax: 120,
          etaHours: 24,
          confidence: 'medium',
        },
      });
    }

    return res.json({
      result: {
        probableIssue: hit.probableIssue,
        estimateMin: hit.estimateMin,
        estimateMax: hit.estimateMax,
        etaHours: hit.etaHours,
        confidence: 'high',
      },
    });
  } catch (err) {
    console.error('Pre-diagnosis error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
