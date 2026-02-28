import type { Product } from './types';

function seededId(seed: number): string {
  return `PRD${String(1000 + (seed % 8999)).padStart(4, '0')}`;
}

/** Sample data matching the Products admin UI (Branch, Product, State). */
export const sampleProducts: Product[] = [
  { id: seededId(1001), branch: 'DIGITALSERVER', product: 'MAINBOARD', state: 'active' },
  { id: seededId(1002), branch: 'DIGITALSERVER', product: 'SSD drive', state: 'active' },
  { id: seededId(1003), branch: 'DIGITALSERVER', product: 'OTHERS', state: 'active' },
  { id: seededId(1004), branch: 'DIGITALSERVER', product: 'LAPTOP', state: 'active' },
  { id: seededId(1005), branch: 'DIGITALSERVER', product: 'PRINTER', state: 'active' },
  { id: seededId(1006), branch: 'DIGITALSERVER', product: 'COMPUTER', state: 'active' },
  { id: seededId(1007), branch: 'DIGITALSERVER', product: 'EQUIPMENT', state: 'active' },
];
