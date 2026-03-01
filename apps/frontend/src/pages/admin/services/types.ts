export type ServiceSparePartType = 'service' | 'replacement';
export type ServiceSparePartState = 'active' | 'inactive';

export interface ServiceSparePartItem {
  id: string;
  branch: string;
  type: ServiceSparePartType;
  name: string;
  amount: number;
  price: number;
  details: string;
  state: ServiceSparePartState;
}
