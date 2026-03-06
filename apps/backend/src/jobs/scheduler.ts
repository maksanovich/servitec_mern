import cron from 'node-cron';
import { runHourlySync } from './tasks/hourlySync.js';

const HOURLY_CRON = '0 * * * *';

export async function startScheduler(): Promise<void> {
  cron.schedule(HOURLY_CRON, async () => {
    await runHourlySync();
  }, {
    scheduled: true,
    timezone: process.env.TZ ?? 'UTC',
  });

  console.log('[Scheduler] Cron jobs registered (hourly at :00)');
}
