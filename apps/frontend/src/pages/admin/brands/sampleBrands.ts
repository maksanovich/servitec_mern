import type { Brand } from './types';

const brandNames = [
  '2 CASE',
  'ACER',
  'ADAPTER',
  'ADATA',
  'ADVANCE',
  'ALIENWARE',
  'ALL IN ONE',
  'ALL IN ONE LENOVO',
  'ALTEK PC',
  'AMAZON',
  'AMD',
  'APC',
  'ASUS',
  'BELKIN',
  'BENQ',
  'CANON',
  'COOLER MASTER',
  'CORSAIR',
  'DELL',
  'EPSON',
  'GIGABYTE',
  'HP',
  'INTEL',
  'KINGSTON',
  'LENOVO',
  'LG',
  'LOGITECH',
  'MICROSOFT',
  'MSI',
  'NVIDIA',
  'SAMSUNG',
  'SONY',
  'TOSHIBA',
  'WESTERN DIGITAL',
  'XIAOMI',
  'ZEBRA',
  'GENERIC',
  'OTHER',
];

function seededId(seed: number): string {
  return `BR${String(1000 + (seed % 8999)).padStart(4, '0')}`;
}

const extraNames = [
  'AOPEN', 'BIOSTAR', 'CREATIVE', 'DYNABOOK', 'EVGA', 'FOXCONN', 'G.SKILL',
  'HANNSPREE', 'IIYAMA', 'JBL', 'KENSINGTON', 'LACIE', 'MOTOROLA', 'NEC',
  'OCZ', 'PHILIPS', 'QNAP', 'RAZER', 'SEAGATE', 'THERMALTAKE', 'UBIQUITI',
  'VIEWSONIC', 'WACOM', 'YAMAHA', 'ZOTAC', 'ACME', 'BROTHER', 'CISCO',
];
const allNames = [...brandNames, ...extraNames];

export const sampleBrands: Brand[] = Array.from({ length: 212 }, (_, i) => ({
  id: seededId(2846 + i * 137),
  name: allNames[i % allNames.length] + (i >= allNames.length ? ` ${Math.floor(i / allNames.length)}` : ''),
  state: i % 8 === 0 ? 'inactive' : 'active',
}));
