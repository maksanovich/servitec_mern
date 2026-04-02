import { Response } from 'express';
import mongoose from 'mongoose';
import { OrderMovement } from '../models/OrderMovement.js';
import type { AuthRequest } from '../middleware/auth.js';

type MovementLean = {
  _id: unknown;
  orderId: unknown;
  orderNo: string;
  orderCode: string;
  orderedByUserId: string;
  orderedByName: string;
  orderedByEmail: string;
  beforeStageKey: string;
  afterStageKey: string;
  beforeStageLabel: string;
  afterStageLabel: string;
  workflow: string;
  createdAt?: Date;
};

export async function listOrderMovements(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const skip = Math.max(0, parseInt(String(req.query.skip ?? '0'), 10) || 0);
    const orderIdRaw = String(req.query.orderId ?? '').trim();
    const orderCode = String(req.query.orderCode ?? '').trim();
    const workflow = String(req.query.workflow ?? '').trim();

    const filter: Record<string, unknown> = {};
    if (orderIdRaw && mongoose.Types.ObjectId.isValid(orderIdRaw)) {
      filter.orderId = new mongoose.Types.ObjectId(orderIdRaw);
    }
    if (orderCode) {
      filter.orderCode = new RegExp(`^${orderCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    if (workflow === 'standard' || workflow === 'warranty') {
      filter.workflow = workflow;
    }

    const [rows, total] = await Promise.all([
      OrderMovement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderMovement.countDocuments(filter),
    ]);

    return res.json({
      movements: (rows as MovementLean[]).map((m) => ({
        id: String(m._id),
        createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : null,
        orderId: String(m.orderId),
        orderNo: m.orderNo,
        orderCode: m.orderCode,
        orderedByUserId: m.orderedByUserId,
        orderedByName: m.orderedByName,
        orderedByEmail: m.orderedByEmail,
        beforeStageKey: m.beforeStageKey,
        afterStageKey: m.afterStageKey,
        beforeStageLabel: m.beforeStageLabel,
        afterStageLabel: m.afterStageLabel,
        workflow: m.workflow,
      })),
      total,
      limit,
      skip,
    });
  } catch (err) {
    console.error('listOrderMovements error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
