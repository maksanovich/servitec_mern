import { User } from '../models/User.js';
import { Role } from '../models/Role.js';

const DEFAULT_EMAIL = 'admin@servitec.local';
const DEFAULT_PASSWORD = 'superadmin123';

export async function seedAdminIfNeeded(): Promise<void> {
  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) return;
  const superAdminRole = await Role.findOne({ slug: 'super_admin' });
  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Run seedRolesIfNeeded first.');
  }
  await User.create({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Admin',
    role: superAdminRole._id,
  });
  console.log(`Admin user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
}
