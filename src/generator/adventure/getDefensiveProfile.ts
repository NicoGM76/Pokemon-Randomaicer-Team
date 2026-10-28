import type { PokemonType } from '../../domain/pokemon/types';
import { normalizePokemonTypesForGeneration, pokemonTypesForGeneration, typeMultiplierForGeneration } from './typeChart';

export interface DefensiveProfile {
  multipliers: Record<PokemonType, number>;
  immunities: PokemonType[];
  resistances: PokemonType[];
  weaknesses: PokemonType[];
  severeWeaknesses: PokemonType[];
}

export function getDefensiveProfile(defenderTypes: PokemonType[], generation?: number): DefensiveProfile {
  const activeTypes = pokemonTypesForGeneration(generation);
  const normalizedDefenderTypes = normalizePokemonTypesForGeneration(defenderTypes, generation);
  const multipliers = {} as Record<PokemonType, number>;

  for (const attackType of activeTypes) {
    multipliers[attackType] = normalizedDefenderTypes.reduce(
      (total, defendType) => total * typeMultiplierForGeneration(attackType, defendType, generation),
      1
    );
  }
  for (const attackType of pokemonTypesForGeneration()) {
    if (!(attackType in multipliers)) multipliers[attackType] = 1;
  }

  return {
    multipliers,
    immunities: activeTypes.filter(type => multipliers[type] === 0),
    resistances: activeTypes.filter(type => multipliers[type] > 0 && multipliers[type] < 1),
    weaknesses: activeTypes.filter(type => multipliers[type] > 1),
    severeWeaknesses: activeTypes.filter(type => multipliers[type] >= 4)
  };
}
