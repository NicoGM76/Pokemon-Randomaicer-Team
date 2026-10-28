import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import { familyOriginGeneration } from './familyOriginGeneration';

const dataset = {
  pokemon: [
    { id: 41, name: 'Zubat', introducedGeneration: 1, evolutionFamilyId: 'zubat' },
    { id: 42, name: 'Golbat', introducedGeneration: 1, evolutionFamilyId: 'zubat' },
    { id: 169, name: 'Crobat', introducedGeneration: 2, evolutionFamilyId: 'zubat' }
  ]
} as unknown as CompiledDataset;

describe('familyOriginGeneration', () => {
  it('uses the oldest generation in an evolution family', () => {
    expect(familyOriginGeneration(dataset, 'zubat')).toBe(1);
  });
});
