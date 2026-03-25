import mongoose from 'mongoose';
import { ServiceSparePart } from '../models/ServiceSparePart.js';
import type { IOrderBudgetLine } from '../models/Order.js';

function sumQtyForReplacementLines(lines: IOrderBudgetLine[], replacementIds: Set<string>): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) {
    const sid = String(l.serviceId ?? '').trim();
    if (!replacementIds.has(sid)) continue;
    const q = Math.max(0, Math.floor(Number(l.amount) || 0));
    m.set(sid, (m.get(sid) ?? 0) + q);
  }
  return m;
}

async function loadReplacementIdSet(lineIds: string[]): Promise<Set<string>> {
  const oids = lineIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
  if (!oids.length) return new Set();
  const parts = await ServiceSparePart.find({ _id: { $in: oids }, type: 'replacement' })
    .select('_id')
    .lean();
  return new Set(parts.map((p) => String(p._id)));
}

/**
 * Adjusts catalog `amount` for replacement spare parts when order budget lines change.
 * `previousLines` → `nextLines`: stock changes by -(nextQty - prevQty) per replacement serviceId.
 */
export async function applyBudgetLinesReplacementStockDelta(
  previousLines: IOrderBudgetLine[],
  nextLines: IOrderBudgetLine[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const idSet = new Set<string>();
  for (const l of [...previousLines, ...nextLines]) {
    const sid = String(l.serviceId ?? '').trim();
    if (sid && mongoose.isValidObjectId(sid)) idSet.add(sid);
  }
  if (idSet.size === 0) return { ok: true };

  const replacementIds = await loadReplacementIdSet([...idSet]);
  if (replacementIds.size === 0) return { ok: true };

  const prevMap = sumQtyForReplacementLines(previousLines, replacementIds);
  const nextMap = sumQtyForReplacementLines(nextLines, replacementIds);
  const allKeys = new Set<string>([...prevMap.keys(), ...nextMap.keys()]);

  type Applied = { serviceId: string; prevQty: number; nextQty: number };
  const applied: Applied[] = [];

  try {
    for (const sid of allKeys) {
      const prevQty = prevMap.get(sid) ?? 0;
      const nextQty = nextMap.get(sid) ?? 0;
      const delta = nextQty - prevQty;
      if (delta === 0) continue;

      const oid = new mongoose.Types.ObjectId(sid);
      if (delta > 0) {
        const updated = await ServiceSparePart.findOneAndUpdate(
          { _id: oid, type: 'replacement', amount: { $gte: delta } },
          { $inc: { amount: -delta } },
          { new: true }
        );
        if (!updated) {
          const part = await ServiceSparePart.findById(oid).select('name amount').lean();
          const name = part ? String((part as { name?: string }).name ?? '').trim() : '';
          const available =
            part && typeof (part as { amount?: number }).amount === 'number'
              ? (part as { amount: number }).amount
              : 0;
          throw new Error(
            `Insufficient stock for replacement "${name || sid}" (need ${delta} unit(s), ${available} available).`
          );
        }
      } else {
        await ServiceSparePart.updateOne({ _id: oid, type: 'replacement' }, { $inc: { amount: -delta } });
      }
      applied.push({ serviceId: sid, prevQty, nextQty });
    }
  } catch (e) {
    for (const a of applied.reverse()) {
      const d = a.nextQty - a.prevQty;
      if (d === 0) continue;
      try {
        await ServiceSparePart.updateOne(
          { _id: new mongoose.Types.ObjectId(a.serviceId), type: 'replacement' },
          { $inc: { amount: d } }
        );
      } catch (rollbackErr) {
        console.error('Replacement stock rollback failed:', rollbackErr);
      }
    }
    const message = e instanceof Error ? e.message : 'Failed to update replacement stock';
    return { ok: false, error: message };
  }

  return { ok: true };
}
