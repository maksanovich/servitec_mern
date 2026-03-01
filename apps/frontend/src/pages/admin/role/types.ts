export interface Role {
  id: string;
  role: string;
  description: string;
  state: 'active' | 'inactive';
}
