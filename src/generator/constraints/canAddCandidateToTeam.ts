import type { GeneratorConfig, PokemonCandidate } from '../../domain/teams/types';

function isLegendaryOrMythical(candidate: PokemonCandidate): boolean {
  return candidate.resolvedPokemon.specialTags.includes('legendary') ||
    candidate.resolvedPokemon.specialTags.includes('mythical');
}

export function canAddCandidateToTeam(candidate: PokemonCandidate, currentTeam: PokemonCandidate[], config: GeneratorConfig): boolean {
  if (currentTeam.some(item => item.evolutionFamilyId === candidate.evolutionFamilyId)) return false;
  if (currentTeam.some(item => item.speciesGroupId === candidate.speciesGroupId)) return false;

  const maxShared = config.customRules?.maxSharedType;
  if (maxShared !== undefined) {
    for (const type of candidate.resolvedPokemon.types) {
      const count = currentTeam.filter(item => item.resolvedPokemon.types.includes(type)).length;
      if (count + 1 > maxShared) return false;
    }
  }

  if (config.starterRule === 'require_one' && candidate.resolvedPokemon.isStarter) {
    if (currentTeam.some(item => item.resolvedPokemon.isStarter)) return false;
  }
  if (config.legendaryRule === 'require_one' && isLegendaryOrMythical(candidate)) {
    if (currentTeam.some(isLegendaryOrMythical)) return false;
  }

  return true;
}
