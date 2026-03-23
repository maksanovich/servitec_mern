export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  pages: string[];
  state: 'active' | 'inactive';
}
