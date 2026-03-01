export interface Branch {
  id: string;
  branchName: string;
  email: string;
  phone: string;
  address: string;
  state: 'active' | 'inactive';
}
