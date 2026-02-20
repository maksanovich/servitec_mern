import { User } from '../models/User.js';

const DEFAULT_EMAIL = 'admin@servitec.local';
const DEFAULT_PASSWORD = 'admin123';

export async function seedAdminIfNeeded(): Promise<void> {
  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) return;
  await User.create({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Admin',
    role: 'admin',
  });
  console.log(`Admin user created: ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
}
