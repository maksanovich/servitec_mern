import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { config } from '../config/index.js';
import { seedRolesIfNeeded } from '../db/seedRoles.js';

const DEFAULT_EMAIL = 'admin@servitec.local';
const DEFAULT_PASSWORD = 'superadmin123';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  await seedRolesIfNeeded();
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
