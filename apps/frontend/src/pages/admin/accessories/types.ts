export interface Accessory {
  id: string;
  branch: string;
  artifact: string;
  state: 'active' | 'inactive';
}
