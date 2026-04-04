import cron from 'node-cron';
import { runHourlySync } from './tasks/hourlySync.js';
import { runDeliveryPickupReminders } from './tasks/deliveryPickupReminders.js';
import { runDeliveryQuarantineMoves } from './tasks/deliveryQuarantineMoves.js';

const HOURLY_CRON = '0 * * * *';
/** Daily at 08:00 — pickup reminders + quarantine/abandonment moves for delivery. */
const DAILY_MORNING_CRON = '0 8 * * *';

export async function startScheduler(): Promise<void> {
  cron.schedule(HOURLY_CRON, async () => {
    await runHourlySync();
  }, {
    scheduled: true,
    timezone: process.env.TZ ?? 'UTC',
  });

  cron.schedule(DAILY_MORNING_CRON, async () => {
    await runDeliveryPickupReminders();
    await runDeliveryQuarantineMoves();
  }, {
    scheduled: true,
    timezone: process.env.TZ ?? 'UTC',
  });

  console.log(
    '[Scheduler] Cron jobs registered (hourly: Perseo clients + SpareServer products at :00; daily 08:00: delivery reminders + quarantine/abandonment)'
  );
}
