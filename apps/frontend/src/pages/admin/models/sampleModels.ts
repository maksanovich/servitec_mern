import type { Model } from './types';

const firstRows: [brand: string, model: string][] = [
  ['2 CASE', 'Q-ONE AND ASUS'],
  ['ACER', 'Q5LJ1'],
  ['ACER', 'PREDATOR'],
  ['ACER', 'N15Q1'],
  ['ACER', 'E5-521 SERIES'],
  ['ACER', 'ASPIRE V'],
  ['ACER', 'A515'],
  ['ACER', 'MINI'],
  ['ACER', 'N19C3'],
  ['ACER', 'N17C4'],
];

const morePairs: [brand: string, model: string][] = [
  ['ASUS', 'X555'],
  ['ASUS', 'K55VD'],
  ['DELL', 'INSPIRON 15'],
  ['DELL', 'LATITUDE 3520'],
  ['HP', 'PAVILION 15'],
  ['HP', 'PROBOOK 450'],
  ['LENOVO', 'IDEAPAD 3'],
  ['LENOVO', 'THINKPAD E14'],
  ['MSI', 'GF63'],
  ['MSI', 'MODERN 14'],
];

const extraBrands = [
  'SAMSUNG', 'LG', 'TOSHIBA', 'SONY', 'MICROSOFT', 'INTEL', 'AMD', 'NVIDIA',
  'LOGITECH', 'CANON', 'EPSON', 'BENQ', 'GIGABYTE', 'CORSAIR', 'KINGSTON',
];

const allPairs = [...firstRows, ...morePairs];

function seededId(seed: number): string {
  return `MD${String(10000 + (seed % 89999)).padStart(5, '0')}`;
}

const totalRecords = 1153;
export const sampleModels: Model[] = Array.from({ length: totalRecords }, (_, i) => {
  const pair = allPairs[i % allPairs.length];
  const suffix = i >= allPairs.length ? ` ${Math.floor(i / allPairs.length)}` : '';
  const useExtra = i > 30 && i % 4 === 0;
  return {
    id: seededId(42000 + i * 97),
    brand: useExtra ? extraBrands[i % extraBrands.length] : pair[0],
    model: useExtra ? `MODEL-${i}` : pair[1] + suffix,
    state: i % 8 === 0 ? 'inactive' : 'active',
  };
});
