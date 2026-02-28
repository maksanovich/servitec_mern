export interface Customer {
  id: string;
  /** Optional avatar URL; when missing, noimage.png is used */
  image?: string;
  names: string;
  surnames: string;
  email: string;
  phone: string;
  role: 'Customer' | 'Admin' | 'Technical';
  state: 'active' | 'inactive';
}
