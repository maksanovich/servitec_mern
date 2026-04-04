import { Order } from '../../models/Order.js';
import { ensureWarrantyStages } from '../../controllers/orderProgressStageController.js';
import { recordSystemOrderStageChange } from '../../services/orderMovementService.js';
import type { OrderWorkflow } from '../../models/Order.js';

const MS_PER_DAY = 86_400_000;
/** Two months without pickup — move from delivery area to quarantine (60 days from arrival). */
const QUARANTINE_AFTER_DAYS = 60;
/** Four months without pickup — move to abandonment (120 days from arrival). */
const ABANDONMENT_AFTER_DAYS = 120;

function stageKeyForWorkflow(wf: OrderWorkflow, kind: 'quarantine' | 'abandonment'): string {
  if (wf === 'warranty') {
    return kind === 'quarantine' ? 'warranty-quarantine' : 'warranty-abandonment';
  }
  return kind === 'quarantine' ? 'delivery-quarantine' : 'delivery-abandonment';
}

function normalizeWorkflow(o: { workflow?: unknown; warranty?: unknown }): OrderWorkflow {
  const w = String(o?.workflow ?? '').trim();
  if (w === 'warranty' || w === 'standard') return w;
  return o?.warranty === true || String(o?.warranty ?? '') === 'yes' ? 'warranty' : 'standard';
}

export async function runDeliveryQuarantineMoves(): Promise<void> {
  await ensureWarrantyStages();

  const start = Date.now();
  console.log('[Cron] Delivery quarantine / abandonment moves started');

  try {
    const now = Date.now();
    let movedQuarantine = 0;
    let movedAbandonment = 0;

    const inDelivery = await Order.find({
      state: 'delivery',
      area: 'delivery',
      deliveryArrivedAt: { $exists: true, $ne: null },
    }).lean();

    for (const o of inDelivery) {
      const arrived = o.deliveryArrivedAt ? new Date(o.deliveryArrivedAt).getTime() : NaN;
      if (!Number.isFinite(arrived)) continue;

      const wf = normalizeWorkflow(o);
      const beforeKey = String(o.progressStageKey ?? '').trim();

      if (now >= arrived + ABANDONMENT_AFTER_DAYS * MS_PER_DAY) {
        const nextKey = stageKeyForWorkflow(wf, 'abandonment');
        try {
          await Order.updateOne(
            { _id: o._id },
            { $set: { area: 'abandonment', state: 'delivery', progressStageKey: nextKey } }
          );
          await recordSystemOrderStageChange({
            orderId: String(o._id),
            orderNo: String(o.no ?? ''),
            orderCode: String(o.code ?? ''),
            beforeStageKey: beforeKey,
            afterStageKey: nextKey,
            workflow: wf,
          });
          movedAbandonment += 1;
        } catch (err) {
          console.error('[Cron] Delivery → abandonment failed:', o._id, err);
        }
      } else if (now >= arrived + QUARANTINE_AFTER_DAYS * MS_PER_DAY) {
        const nextKey = stageKeyForWorkflow(wf, 'quarantine');
        try {
          await Order.updateOne(
            { _id: o._id },
            { $set: { area: 'quarantine', state: 'delivery', progressStageKey: nextKey } }
          );
          await recordSystemOrderStageChange({
            orderId: String(o._id),
            orderNo: String(o.no ?? ''),
            orderCode: String(o.code ?? ''),
            beforeStageKey: beforeKey,
            afterStageKey: nextKey,
            workflow: wf,
          });
          movedQuarantine += 1;
        } catch (err) {
          console.error('[Cron] Delivery → quarantine failed:', o._id, err);
        }
      }
    }

    const inQuarantine = await Order.find({
      state: 'delivery',
      area: 'quarantine',
      deliveryArrivedAt: { $exists: true, $ne: null },
    }).lean();

    for (const o of inQuarantine) {
      const arrived = o.deliveryArrivedAt ? new Date(o.deliveryArrivedAt).getTime() : NaN;
      if (!Number.isFinite(arrived)) continue;
      if (now < arrived + ABANDONMENT_AFTER_DAYS * MS_PER_DAY) continue;

      const wf = normalizeWorkflow(o);
      const nextKey = stageKeyForWorkflow(wf, 'abandonment');
      const beforeKey = String(o.progressStageKey ?? '').trim();

      try {
        await Order.updateOne(
          { _id: o._id },
          { $set: { area: 'abandonment', state: 'delivery', progressStageKey: nextKey } }
        );
        await recordSystemOrderStageChange({
          orderId: String(o._id),
          orderNo: String(o.no ?? ''),
          orderCode: String(o.code ?? ''),
          beforeStageKey: beforeKey,
          afterStageKey: nextKey,
          workflow: wf,
        });
        movedAbandonment += 1;
      } catch (err) {
        console.error('[Cron] Quarantine → abandonment failed:', o._id, err);
      }
    }

    const elapsed = Date.now() - start;
    console.log('[Cron] Delivery quarantine / abandonment finished in', elapsed, 'ms', {
      movedQuarantine,
      movedAbandonment,
    });
  } catch (err) {
    console.error('[Cron] Delivery quarantine / abandonment error:', err);
  }
}
