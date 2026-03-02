export interface Company {
  id?: string;
  ruc: string;
  companyName: string;
  web?: string;
  email: string;
  phone: string;
  address: string;
  googleMaps?: string;
  companyInformation?: string;
  /** Logo image URL or data URL; optional */
  logo?: string;
  state: 'active' | 'inactive';
}
