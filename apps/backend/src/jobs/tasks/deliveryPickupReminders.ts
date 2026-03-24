import { Order } from '../../models/Order.js';
import { Client } from '../../models/Client.js';
import { sendDeliveryPickupReminderEmail } from '../../services/smtpService.js';

const MS_PER_DAY = 86_400_000;
/** First automated reminder after equipment arrives at delivery area. */
const FIRST_REMINDER_DAYS = 30;
/** Second reminder 60 days after the first (90 days from arrival). */
const SECOND_REMINDER_DAYS = 90;

export async function runDeliveryPickupReminders(): Promise<void> {
  const start = Date.now();
  console.log('[Cron] Delivery pickup reminders started');

  try {
    const now = Date.now();

    const orders = await Order.find({
      state: 'delivery',
      deliveryArrivedAt: { $exists: true, $ne: null },
    }).lean();

    let sent30 = 0;
    let sent90 = 0;

    for (const o of orders) {
      const arrivedRaw = o.deliveryArrivedAt;
      const arrived = arrivedRaw ? new Date(arrivedRaw).getTime() : NaN;
      if (!Number.isFinite(arrived)) continue;

      const client = await Client.findOne({ clientesid: o.clientId }).lean();
      const to = String((client as { email?: string })?.email ?? '').trim();
      if (!to) continue;

      const orderNo = String(o.no ?? '');
      const trackingCode = String(o.code ?? '');
      const customerName = String(o.clientName ?? '');

      const due30 = now >= arrived + FIRST_REMINDER_DAYS * MS_PER_DAY;
      const due90 = now >= arrived + SECOND_REMINDER_DAYS * MS_PER_DAY;

      if (!o.pickupReminder30dSentAt && due30) {
        try {
          await sendDeliveryPickupReminderEmail({
            to,
            orderNo,
            trackingCode,
            customerName,
            phase: '30d',
          });
          await Order.updateOne({ _id: o._id }, { $set: { pickupReminder30dSentAt: new Date() } });
          sent30 += 1;
        } catch (err) {
          console.error('[Cron] Delivery pickup 30d email failed:', o._id, err);
        }
      }

      if (!o.pickupReminder90dSentAt && due90) {
        try {
          await sendDeliveryPickupReminderEmail({
            to,
            orderNo,
            trackingCode,
            customerName,
            phase: '90d',
          });
          await Order.updateOne({ _id: o._id }, { $set: { pickupReminder90dSentAt: new Date() } });
          sent90 += 1;
        } catch (err) {
          console.error('[Cron] Delivery pickup 90d email failed:', o._id, err);
        }
      }
    }

    const elapsed = Date.now() - start;
    console.log('[Cron] Delivery pickup reminders finished in', elapsed, 'ms', { sent30, sent90 });
  } catch (err) {
    console.error('[Cron] Delivery pickup reminders error:', err);
  }
}
