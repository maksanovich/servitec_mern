import { User } from '../models/User.js';
import { Role } from '../models/Role.js';

const DEFAULT_EMAIL = 'admin@servitec.com';
const DEFAULT_PASSWORD = 'admin1234';
const LEGACY_EMAIL = 'admin@servitec.local';
/** Previous seed default without domain */
const LEGACY_SHORT_EMAIL = 'admin@servitec';

async function migrateLegacyToCanonical(
  legacyEmail: string,
  logLabel: string
): Promise<boolean> {
  const legacy = await User.findOne({ email: legacyEmail });
  if (!legacy) return false;
  const canonical = await User.findOne({ email: DEFAULT_EMAIL });
  if (canonical) {
    await User.deleteOne({ _id: legacy._id });
    console.log(
      `Removed duplicate legacy admin (${logLabel}); account ${DEFAULT_EMAIL} already exists.`
    );
    return true;
  }
  legacy.email = DEFAULT_EMAIL;
  legacy.password = DEFAULT_PASSWORD;
  await legacy.save();
  console.log(`Admin user migrated from ${logLabel} to ${DEFAULT_EMAIL}`);
  return true;
}

export async function seedAdminIfNeeded(): Promise<void> {
  if (await migrateLegacyToCanonical(LEGACY_EMAIL, LEGACY_EMAIL)) return;
  if (await migrateLegacyToCanonical(LEGACY_SHORT_EMAIL, LEGACY_SHORT_EMAIL)) return;
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
