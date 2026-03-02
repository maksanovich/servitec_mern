/** User as returned by users API (list/detail). Align with api/users.ts User. */
export interface User {
  id: string;
  email: string;
  name: string;
  identification: string;
  phone: string;
  avatar?: string;
  state: 'active' | 'inactive';
  role: { id: string; name: string; slug?: string } | null;
}
