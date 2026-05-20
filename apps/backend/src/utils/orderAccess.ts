/** Matches backend `getAssignableTechnicians` / frontend technician detection. */
export function isTechnicianRole(slug: string, roleName?: string): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  const n = String(roleName ?? '').trim().toLowerCase();
  return s === 'technician' || s.includes('tech') || n.includes('technician') || n.includes('tech');
}

const FULL_ORDER_BOARD_SLUGS = new Set([
  'super_admin',
  'admin',
  'cashier',
  'lead_technician',
  'outsourced',
]);

function nameIndicatesLeadTechnician(roleName: string): boolean {
  const n = roleName.trim().toLowerCase();
  if (!n) return false;
  const hasLead = /\b(lead|lider|líder)\b/.test(n) || n.includes('lead');
  const hasTech = /tecnic|technician|técnico|tecnico/.test(n);
  return hasLead && hasTech;
}

function nameIndicatesOutsourcedTechnician(roleName: string): boolean {
  const n = roleName.trim().toLowerCase();
  if (!n) return false;
  const hasOutsourced =
    /\b(outsourced|terceros|externo|external|subcontrat)\b/.test(n) || n.includes('outsourced');
  const hasTech = /tecnic|technician|técnico|tecnico/.test(n);
  return hasOutsourced && hasTech;
}

/**
 * Lead / outsourced technicians (and admins) may list, view, edit, and move any order.
 * Field technicians are limited to orders assigned to them (`Order.technician`).
 */
export function hasFullOrderBoardAccess(slug: string, roleName?: string): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  const n = String(roleName ?? '').trim();

  if (FULL_ORDER_BOARD_SLUGS.has(s)) return true;
  if (nameIndicatesLeadTechnician(n)) return true;
  if (nameIndicatesOutsourcedTechnician(n)) return true;

  if (s.includes('lead') && (s.includes('tecnic') || s.includes('tech'))) return true;
  if (s.includes('outsourced') || s.includes('terceros') || s.includes('extern')) return true;

  return false;
}

/** True when the user should only access orders where they are the assignee (`technician` field). */
export function isAssigneeOnlyTechnicianAccess(slug: string, roleName?: string): boolean {
  if (hasFullOrderBoardAccess(slug, roleName)) return false;
  return isTechnicianRole(slug, roleName);
}
