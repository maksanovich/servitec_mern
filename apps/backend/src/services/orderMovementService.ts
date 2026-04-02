import mongoose from 'mongoose';
import { OrderMovement } from '../models/OrderMovement.js';
import { OrderProgressStage } from '../models/OrderProgressStage.js';
import type { OrderWorkflow } from '../models/Order.js';
import type { AuthRequest } from '../middleware/auth.js';

async function labelsForKeys(keys: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(keys.map((k) => String(k ?? '').trim()).filter(Boolean))];
  if (uniq.length === 0) return new Map();
  const stages = await OrderProgressStage.find({ key: { $in: uniq } }).select('key label').lean();
  const m = new Map<string, string>();
  for (const s of stages) {
    const k = String((s as { key?: string }).key ?? '');
    if (k) m.set(k, String((s as { label?: string }).label ?? k));
  }
  for (const k of uniq) {
    if (!m.has(k)) m.set(k, k);
  }
  return m;
}

/**
 * Persists one row when an order’s progress stage key changes (standard or warranty pipeline).
 */
export async function recordOrderStageChange(params: {
  orderId: string;
  orderNo: string;
  orderCode: string;
  beforeStageKey: string;
  afterStageKey: string;
  workflow: OrderWorkflow;
  req: AuthRequest;
}): Promise<void> {
  const before = String(params.beforeStageKey ?? '').trim();
  const after = String(params.afterStageKey ?? '').trim();
  if (before === after) return;
  const labelMap = await labelsForKeys([before, after]);
  const beforeLabel = before ? (labelMap.get(before) ?? before) : '—';
  const afterLabel = after ? (labelMap.get(after) ?? after) : '—';
  const user = params.req.user;
  await OrderMovement.create({
    orderId: new mongoose.Types.ObjectId(params.orderId),
    orderNo: String(params.orderNo ?? '').trim(),
    orderCode: String(params.orderCode ?? '').trim(),
    orderedByUserId: user?._id ?? '',
    orderedByName: String(user?.name ?? '').trim() || '—',
    orderedByEmail: String(user?.email ?? '').trim(),
    beforeStageKey: before,
    afterStageKey: after,
    beforeStageLabel: beforeLabel,
    afterStageLabel: afterLabel,
    workflow: params.workflow,
  });
}
