import type { GeneratorConfig, PokemonCandidate } from '../../domain/teams/types';
import type { PokemonType } from '../../domain/pokemon/types';
import { getDefensiveProfile } from './getDefensiveProfile';
import { getOffensiveProfile } from './getOffensiveProfile';
import { pokemonTypes } from './typeChart';

export interface AdventureScore { total:number; typeDiversity:number; sharedWeaknesses:number; offensiveBalance:number; roleDiversity:number; redundancy:number; }

export function scoreAdventureTeam(team: PokemonCandidate[], config: GeneratorConfig): AdventureScore {
  const uniqueTypes = new Set(team.flatMap(c => c.resolvedPokemon.types)).size;
  const typeDiversity = Math.max(-12, Math.min(10, (uniqueTypes - 6) * 2));
  let sharedWeaknesses = 0;
  for (const attackType of pokemonTypes) {
    const profiles = team.map(c => getDefensiveProfile(c.resolvedPokemon.types));
    const weak = profiles.filter(p => p.multipliers[attackType] > 1).length;
    const severe = profiles.filter(p => p.multipliers[attackType] >= 4).length;
    const covers = profiles.filter(p => p.multipliers[attackType] < 1).length;
    const penalty = weak <= 1 ? 0 : weak === 2 ? -2 : weak === 3 ? -7 : weak === 4 ? -15 : weak === 5 ? -25 : -40;
    sharedWeaknesses += penalty - severe * 2 + Math.min(covers, weak) * 1;
  }
  const profiles = team.map(c => getOffensiveProfile(c.resolvedPokemon.stats));
  const physical = profiles.filter(x=>x==='physical').length;
  const special = profiles.filter(x=>x==='special').length;
  const mixed = profiles.filter(x=>x==='mixed').length;
  const offensiveBalance = team.length < 2 ? 0 : (physical === team.length || special === team.length ? -10 : Math.min(10, (Math.min(physical + mixed, special + mixed))*3));
  const roleDiversity = new Set(profiles).size * 2;
  const exempt = config.customRules?.monotype;
  let redundancy = 0;
  for (const type of pokemonTypes) {
    if (type === exempt) continue;
    const count = team.filter(c => c.resolvedPokemon.types.includes(type)).length;
    if (count === 3) redundancy -= 3;
    else if (count === 4) redundancy -= 8;
    else if (count === 5) redundancy -= 15;
    else if (count >= 6) redundancy -= 20;
  }
  return { total: 100 + typeDiversity + sharedWeaknesses + offensiveBalance + roleDiversity + redundancy, typeDiversity, sharedWeaknesses, offensiveBalance, roleDiversity, redundancy };
}
