import type { GeneratorConfig, PokemonCandidate } from '../../domain/teams/types';
import { getDefensiveProfile } from './getDefensiveProfile';
import { getOffensiveProfile } from './getOffensiveProfile';
import { normalizePokemonTypesForGeneration, pokemonTypesForGeneration } from './typeChart';

export interface AdventureScore { total:number; typeDiversity:number; sharedWeaknesses:number; offensiveBalance:number; roleDiversity:number; redundancy:number; }

export function scoreAdventureTeam(team: PokemonCandidate[], config: GeneratorConfig): AdventureScore {
  const generation = config.typeChartGeneration;
  const activeTypes = pokemonTypesForGeneration(generation);
  const normalizedTeamTypes = team.map(candidate => normalizePokemonTypesForGeneration(candidate.resolvedPokemon.types, generation));
  const uniqueTypes = new Set(normalizedTeamTypes.flat()).size;
  const typeDiversity = Math.max(-12, Math.min(10, (uniqueTypes - 6) * 2));
  let sharedWeaknesses = 0;
  const profiles = team.map(candidate => getDefensiveProfile(candidate.resolvedPokemon.types, generation));
  for (const attackType of activeTypes) {
    const weak = profiles.filter(profile => profile.multipliers[attackType] > 1).length;
    const severe = profiles.filter(profile => profile.multipliers[attackType] >= 4).length;
    const covers = profiles.filter(profile => profile.multipliers[attackType] < 1).length;
    const penalty = weak <= 1 ? 0 : weak === 2 ? -2 : weak === 3 ? -7 : weak === 4 ? -15 : weak === 5 ? -25 : -40;
    sharedWeaknesses += penalty - severe * 2 + Math.min(covers, weak);
  }
  const offense = team.map(candidate => getOffensiveProfile(candidate.resolvedPokemon.stats));
  const physical = offense.filter(profile => profile === 'physical').length;
  const special = offense.filter(profile => profile === 'special').length;
  const mixed = offense.filter(profile => profile === 'mixed').length;
  const offensiveBalance = team.length < 2 ? 0 : (physical === team.length || special === team.length ? -10 : Math.min(10, Math.min(physical + mixed, special + mixed) * 3));
  const roleDiversity = new Set(offense).size * 2;
  const exempt = config.customRules?.monotype;
  let redundancy = 0;
  for (const type of activeTypes) {
    if (type === exempt) continue;
    const count = normalizedTeamTypes.filter(types => types.includes(type)).length;
    if (count === 3) redundancy -= 3;
    else if (count === 4) redundancy -= 8;
    else if (count === 5) redundancy -= 15;
    else if (count >= 6) redundancy -= 20;
  }
  return { total: 100 + typeDiversity + sharedWeaknesses + offensiveBalance + roleDiversity + redundancy, typeDiversity, sharedWeaknesses, offensiveBalance, roleDiversity, redundancy };
}
