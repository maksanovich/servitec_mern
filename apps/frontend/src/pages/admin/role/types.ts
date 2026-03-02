export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  state: 'active' | 'inactive';
}
