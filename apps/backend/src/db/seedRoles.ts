import { Role } from '../models/Role.js';
import { ALL_ASSIGNABLE_PAGES } from '../constants/adminPages.js';

const DEFAULT_ROLES = [
  {
    name: 'Super Administrator',
    slug: 'super_admin',
    description: 'Full access; can create roles and users',
    pages: [] as string[],
  },
  {
    name: 'Administrator',
    slug: 'admin',
    description: 'All operational pages except Users & Roles',
    pages: [...ALL_ASSIGNABLE_PAGES],
  },
  {
    name: 'Cashiers',
    slug: 'cashier',
    description: 'Create orders, physical checkout',
    pages: ['/admin/order'],
  },
  {
    name: 'Lead Technician',
    slug: 'lead_technician',
    description: 'Technical operations, receipts',
    pages: ['/admin/order'],
  },
  {
    name: 'Outsourced Technician',
    slug: 'outsourced',
    description: 'Third-party repairs (charged)',
    pages: ['/admin/order'],
  },
  {
    name: 'Customers',
    slug: 'customer',
    description: 'Track order status only (no order creation)',
    pages: [] as string[],
  },
];

export async function seedRolesIfNeeded(): Promise<void> {
  const count = await Role.countDocuments();
  if (count > 0) return;
  await Role.insertMany(DEFAULT_ROLES);
  console.log(`Seeded ${DEFAULT_ROLES.length} roles`);
}
