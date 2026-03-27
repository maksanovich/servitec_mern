import type { Product } from './types';

function seededId(seed: number): string {
  return `PRD${String(1000 + (seed % 8999)).padStart(4, '0')}`;
}

/** Sample data matching the Products admin UI (Product, State). */
export const sampleProducts: Product[] = [
  { id: seededId(1001), product: 'MAINBOARD', state: 'active' },
  { id: seededId(1002), product: 'SSD drive', state: 'active' },
  { id: seededId(1003), product: 'OTHERS', state: 'active' },
  { id: seededId(1004), product: 'LAPTOP', state: 'active' },
  { id: seededId(1005), product: 'PRINTER', state: 'active' },
  { id: seededId(1006), product: 'COMPUTER', state: 'active' },
  { id: seededId(1007), product: 'EQUIPMENT', state: 'active' },
];
