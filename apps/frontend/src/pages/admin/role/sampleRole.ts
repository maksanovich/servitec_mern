import type { Role } from './types';

export const sampleRole: Role[] = [
  {
    id: '1',
    role: 'Administrator',
    description: 'access to the entire system',
    state: 'active',
  },
  {
    id: '2',
    role: 'Customer',
    description: '',
    state: 'active',
  },
  {
    id: '3',
    role: 'Technical',
    description: '',
    state: 'active',
  },
  {
    id: '4',
    role: 'SALESPEOPLE',
    description: 'Equipment entry by vendors.',
    state: 'active',
  },
];
