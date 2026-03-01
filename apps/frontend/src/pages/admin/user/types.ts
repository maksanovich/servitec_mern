export interface User {
  id: string;
  image?: string;
  names: string;
  surnames: string;
  email: string;
  phone: string;
  role: string;
  state: 'active' | 'inactive';
}
