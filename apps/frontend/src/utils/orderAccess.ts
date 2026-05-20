import type { User } from '../api/auth';

/** Matches technician roles in user lists (assignable technicians dropdown). */
export function isTechnicianRoleSlugOrName(slug: string, roleName?: string): boolean {
  const s = String(slug ?? '').trim().toLowerCase();
  const n = String(roleName ?? '').trim().toLowerCase();
  return s === 'technician' || s.includes('tech') || n.includes('technician') || n.includes('tech');
}

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

/** Lead / outsourced technicians can work the full order board (not only assigned orders). */
export function userHasFullOrderBoardAccess(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  const s = String(user.role.slug ?? '').trim().toLowerCase();
  const n = String(user.role.name ?? '').trim();

  if (
    s === 'super_admin' ||
    s === 'admin' ||
    s === 'cashier' ||
    s === 'lead_technician' ||
    s === 'outsourced'
  ) {
    return true;
  }
  if (nameIndicatesLeadTechnician(n)) return true;
  if (nameIndicatesOutsourcedTechnician(n)) return true;
  if (s.includes('lead') && (s.includes('tecnic') || s.includes('tech'))) return true;
  if (s.includes('outsourced') || s.includes('terceros') || s.includes('extern')) return true;

  return false;
}

/** Field technician: only orders assigned to this user. */
export function userIsAssigneeOnlyTechnician(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  if (userHasFullOrderBoardAccess(user)) return false;
  return isTechnicianRoleSlugOrName(user.role.slug, user.role.name);
}
