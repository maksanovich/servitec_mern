import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { config } from '../config/index.js';
import { seedRolesIfNeeded } from '../db/seedRoles.js';

const DEFAULT_EMAIL = 'admin@servitec.com';
const DEFAULT_PASSWORD = 'admin1234';
const LEGACY_EMAIL = 'admin@servitec.local';
const LEGACY_SHORT_EMAIL = 'admin@servitec';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  await seedRolesIfNeeded();

  for (const [legacyEmail, label] of [
    [LEGACY_EMAIL, LEGACY_EMAIL],
    [LEGACY_SHORT_EMAIL, LEGACY_SHORT_EMAIL],
  ] as const) {
    const legacy = await User.findOne({ email: legacyEmail });
    if (!legacy) continue;
    const canonical = await User.findOne({ email: DEFAULT_EMAIL });
    if (canonical) {
      await User.deleteOne({ _id: legacy._id });
      console.log(`Removed duplicate legacy admin (${label}); ${DEFAULT_EMAIL} already exists.`);
      process.exit(0);
    }
    legacy.email = DEFAULT_EMAIL;
    legacy.password = DEFAULT_PASSWORD;
    await legacy.save();
    console.log(`Admin user migrated from ${label} to ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
    process.exit(0);
  }

  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }
  const superAdminRole = await Role.findOne({ slug: 'super_admin' });
  if (!superAdminRole) {
    throw new Error('Super Admin role not found.');
  }
  await User.create({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Admin',
    role: superAdminRole._id,
  });
  console.log(`Admin user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
