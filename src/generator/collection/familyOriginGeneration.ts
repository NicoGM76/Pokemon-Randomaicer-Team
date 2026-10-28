import type { CompiledDataset } from '../../data/types';

export function familyOriginGeneration(dataset: CompiledDataset, familyId: string): number {
  const generations = dataset.pokemon
    .filter(pokemon => pokemon.evolutionFamilyId === familyId)
    .map(pokemon => pokemon.introducedGeneration);

  if (!generations.length) return Number.POSITIVE_INFINITY;
  return Math.min(...generations);
}
