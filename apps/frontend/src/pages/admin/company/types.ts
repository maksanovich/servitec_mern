export interface Company {
  ruc: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  /** Logo image URL; optional */
  logo?: string;
  state: 'active' | 'inactive';
}
