import type { Game } from '../../domain/games/types';
import type { PokemonCandidate, GeneratorConfig } from '../../domain/teams/types';

function hasTag(candidate: PokemonCandidate, tag: string): boolean {
  return candidate.resolvedPokemon.specialTags.includes(tag);
}

export function passesCandidateFilters(candidate: PokemonCandidate, config: GeneratorConfig, game: Game): boolean {
  const rules = config.customRules;
  if (config.starterRule === 'exclude' && candidate.resolvedPokemon.isStarter) return false;
  if (config.legendaryRule === 'exclude' && (hasTag(candidate, 'legendary') || hasTag(candidate, 'mythical'))) return false;
  if (!rules) return true;
  if (rules.monotype && !candidate.resolvedPokemon.types.includes(rules.monotype)) return false;
  if (rules.onlyCurrentGeneration && candidate.resolvedPokemon.introducedGeneration !== game.generation) return false;
  if (rules.onlyRegionalForms && candidate.form?.formType !== 'regional') return false;
  if (rules.mythicalRule === 'exclude' && hasTag(candidate, 'mythical')) return false;
  if (rules.ultraBeastRule === 'exclude' && hasTag(candidate, 'ultra_beast')) return false;
  if (rules.paradoxRule === 'exclude' && hasTag(candidate, 'paradox')) return false;
  if (rules.pseudoLegendaryRule === 'exclude' && candidate.resolvedPokemon.isPseudoLegendary) return false;
  if (rules.fossilRule === 'exclude' && candidate.resolvedPokemon.isFossil) return false;
  return true;
}
