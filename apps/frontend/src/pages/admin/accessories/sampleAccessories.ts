import type { Accessory } from './types';

const branches = ['DIGITALSERVER', 'FREEDOM'];
const artifacts = ['SUITCASE', 'CASE', 'CHARGER', 'NONE'];

function seededId(seed: number): string {
  return `ACC${String(1000 + (seed % 8999)).padStart(4, '0')}`;
}

/** Sample data matching the Accessories admin UI (Branch, Artifact, State). */
export const sampleAccessories: Accessory[] = [
  { id: seededId(1001), branch: 'DIGITALSERVER', artifact: 'SUITCASE', state: 'active' },
  { id: seededId(1002), branch: 'DIGITALSERVER', artifact: 'CASE', state: 'active' },
  { id: seededId(1003), branch: 'DIGITALSERVER', artifact: 'CHARGER', state: 'active' },
  { id: seededId(1004), branch: 'DIGITALSERVER', artifact: 'NONE', state: 'active' },
  { id: seededId(1005), branch: 'FREEDOM', artifact: 'CHARGER', state: 'active' },
  { id: seededId(1006), branch: 'FREEDOM', artifact: 'NONE', state: 'inactive' },
  ...Array.from({ length: 24 }, (_, i) => ({
    id: seededId(2000 + i),
    branch: branches[i % branches.length],
    artifact: artifacts[i % artifacts.length],
    state: i % 5 === 0 ? 'inactive' : 'active',
  })),
];
