import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { config } from '../config/index.js';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  const existing = await User.findOne({ email: 'admin@servitec.local' });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }
  await User.create({
    email: 'admin@servitec.local',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
  });
  console.log('Admin user created: admin@servitec.local / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
