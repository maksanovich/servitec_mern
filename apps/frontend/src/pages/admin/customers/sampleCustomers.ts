import type { Customer } from './types';

const firstNames = [
  'SPONSORSHIP',
  'DORIS CLAUDIA',
  'CARLOS STEVE',
  'MARIA LOPEZ',
  'JUAN PEREZ',
  'ANA GARCIA',
  'PEDRO SANCHEZ',
  'ROSA MARTINEZ',
  'LUIS FERNANDEZ',
  'CARMEN RODRIGUEZ',
  'JORGE RAMIREZ',
  'SANDRA TORRES',
  'MIGUEL GONZALEZ',
  'PATRICIA LOPEZ',
  'ANTONIO HERNANDEZ',
];

const lastNames = [
  'CARDENAS PARIONA',
  'MIRAVITO PACHECO',
  'TORRES MACIAS',
  'LOPEZ GARCIA',
  'PEREZ SANCHEZ',
  'GARCIA FLORES',
  'SANCHEZ DIAZ',
  'MARTINEZ RUIZ',
  'FERNANDEZ MORALES',
  'RODRIGUEZ VARGAS',
  'RAMIREZ CASTRO',
  'TORRES GOMEZ',
  'GONZALEZ LOPEZ',
  'LOPEZ MARTINEZ',
  'HERNANDEZ SILVA',
];

function seededId(seed: number): string {
  return String(20000000 + (seed % 99999999));
}

function seededPhone(seed: number): string {
  return String(900000000 + (seed % 99999999));
}

export const sampleCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => ({
  id: seededId(28465508 + i * 137),
  names: firstNames[i % firstNames.length],
  surnames: lastNames[i % lastNames.length],
  email: i % 3 === 0 ? `customer${i + 1}@example.com` : '',
  phone: seededPhone(969903033 + i * 31),
  role: i % 10 === 0 ? 'Technical' : i % 20 === 0 ? 'Admin' : 'Customer',
  state: i % 7 === 0 ? 'inactive' : 'active',
}));
