import type { PokemonType } from '../../domain/pokemon/types';
import { pokemonTypes, typeChart } from './typeChart';

export interface DefensiveProfile {
  multipliers: Record<PokemonType, number>;
  immunities: PokemonType[];
  resistances: PokemonType[];
  weaknesses: PokemonType[];
  severeWeaknesses: PokemonType[];
}

export function getDefensiveProfile(defenderTypes: PokemonType[]): DefensiveProfile {
  const multipliers = {} as Record<PokemonType, number>;
  for (const attackType of pokemonTypes) {
    multipliers[attackType] = defenderTypes.reduce((total, defendType) => total * (typeChart[attackType][defendType] ?? 1), 1);
  }
  return {
    multipliers,
    immunities: pokemonTypes.filter(t => multipliers[t] === 0),
    resistances: pokemonTypes.filter(t => multipliers[t] > 0 && multipliers[t] < 1),
    weaknesses: pokemonTypes.filter(t => multipliers[t] > 1),
    severeWeaknesses: pokemonTypes.filter(t => multipliers[t] >= 4)
  };
}
