import type { Pokemon, PokemonType } from '../../domain/pokemon/types';
import { getDefensiveProfile } from '../../generator/adventure/getDefensiveProfile';
import { pokemonTypes } from '../../generator/adventure/typeChart';
import type { CompetitiveRole, CompetitiveTeam } from './types';
import { MEGA_Z_TYPES } from './trainingRules';

export interface CompetitiveAnalysis {
  roleCounts: Record<CompetitiveRole, number>;
  sharedWeaknesses: { type: PokemonType; count: number }[];
  uniqueTypes: number;
  filledSlots: number;
}

export function analyzeCompetitiveTeam(team: CompetitiveTeam, pokemon: Pokemon[]): CompetitiveAnalysis {
  const lookup = new Map(pokemon.map(entry => [entry.id, entry]));
  const roleCounts: Record<CompetitiveRole, number> = {
    physical: 0, special: 0, wall: 0, support: 0, pivot: 0, speed_control: 0
  };
  const typeCounts = new Set<PokemonType>();
  const weaknessCounts = new Map<PokemonType, number>();
  let filledSlots = 0;

  for (const member of team) {
    if (!member) continue;
    const entry = lookup.get(member.pokemonId);
    if (!entry) continue;
    filledSlots++;
    roleCounts[member.role] = (roleCounts[member.role] ?? 0) + 1;
    const effectiveTypes = member.formId ? MEGA_Z_TYPES[member.formId] ?? entry.types : entry.types;
    for (const type of effectiveTypes) typeCounts.add(type);
    const profile = getDefensiveProfile(effectiveTypes);
    for (const type of pokemonTypes) {
      if (profile.multipliers[type] > 1) {
        weaknessCounts.set(type, (weaknessCounts.get(type) ?? 0) + 1);
      }
    }
  }

  const sharedWeaknesses = [...weaknessCounts]
    .filter(([, count]) => count >= 2)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return { roleCounts, sharedWeaknesses, uniqueTypes: typeCounts.size, filledSlots };
}
