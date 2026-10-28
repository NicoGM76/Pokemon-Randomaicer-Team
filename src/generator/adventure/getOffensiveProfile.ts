import type { PokemonStats } from '../../domain/pokemon/types';
export type OffensiveProfile = 'physical' | 'special' | 'mixed';
export function getOffensiveProfile(stats: PokemonStats): OffensiveProfile {
  const ratio = stats.attack / Math.max(stats.specialAttack, 1);
  if (ratio >= 1.2) return 'physical';
  if (ratio <= 0.83) return 'special';
  return 'mixed';
}
