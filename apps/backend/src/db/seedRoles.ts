import { Role } from '../models/Role.js';
import { ALL_ASSIGNABLE_PAGES, normalizeAdminPath } from '../constants/adminPages.js';

/** Roles that must keep `/admin/order` so technicians can use the order board API. */
const ORDER_BOARD_ROLE_SLUGS = ['cashier', 'lead_technician', 'outsourced'] as const;

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

/** Ensures order-board roles retain `/admin/order` after manual role edits in the DB. */
export async function ensureOrderBoardRolePages(): Promise<void> {
  for (const slug of ORDER_BOARD_ROLE_SLUGS) {
    const role = await Role.findOne({ slug });
    if (!role) continue;
    const raw = Array.isArray(role.pages) ? role.pages.map((p) => normalizeAdminPath(String(p))) : [];
    if (raw.includes('/admin/order')) continue;
    role.pages = [...new Set([...raw, '/admin/order'])];
    await role.save();
  }
}

export async function seedRolesIfNeeded(): Promise<void> {
  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(DEFAULT_ROLES);
    console.log(`Seeded ${DEFAULT_ROLES.length} roles`);
  }
  await ensureOrderBoardRolePages();
}
