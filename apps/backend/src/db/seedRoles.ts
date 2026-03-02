import { Role } from '../models/Role.js';

const DEFAULT_ROLES = [
  { name: 'Super Administrator', slug: 'super_admin', description: 'Full access, revenue visibility' },
  { name: 'Administrator', slug: 'admin', description: 'Full admin, revenue visibility' },
  { name: 'Cashiers', slug: 'cashier', description: 'Create orders, physical checkout' },
  { name: 'Lead Technician', slug: 'lead_technician', description: 'Technical operations, receipts' },
  { name: 'Outsourced Technician', slug: 'outsourced', description: 'Third-party repairs (charged)' },
  { name: 'Customers', slug: 'customer', description: 'Track order status only (no order creation)' },
];

export async function seedRolesIfNeeded(): Promise<void> {
  const count = await Role.countDocuments();
  if (count > 0) return;
  await Role.insertMany(DEFAULT_ROLES);
  console.log(`Seeded ${DEFAULT_ROLES.length} roles`);
}
