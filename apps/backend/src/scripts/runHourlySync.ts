import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { runHourlySync } from '../jobs/tasks/hourlySync.js';

async function main(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  try {
    await runHourlySync();
    console.log('[runHourlySync] Finished OK');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[runHourlySync]', err);
  process.exit(1);
});
