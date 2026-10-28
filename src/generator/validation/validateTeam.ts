import type { GeneratorConfig, PokemonCandidate, TeamValidationResult, ValidationIssue } from '../../domain/teams/types';

const messageByCode = {
  team_too_small: 'El equipo tiene menos miembros de los solicitados.',
  duplicate_evolution_family: 'El equipo repite una familia evolutiva.',
  duplicate_species_group: 'El equipo repite formas de una misma especie.',
  too_many_shared_types: 'El equipo supera el límite de tipos compartidos.',
  missing_required_starter: 'Falta el Pokémon inicial requerido.',
  too_many_starters: 'El equipo contiene más de un Pokémon inicial.',
  missing_required_legendary: 'Falta el Pokémon legendario o mítico requerido.',
  too_many_legendaries: 'El equipo contiene más de un Pokémon legendario o mítico.'
} as const;

function isLegendaryOrMythical(candidate: PokemonCandidate): boolean {
  return candidate.resolvedPokemon.specialTags.includes('legendary') ||
    candidate.resolvedPokemon.specialTags.includes('mythical');
}

export function validateTeam(team: PokemonCandidate[], config: GeneratorConfig): TeamValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (code: keyof typeof messageByCode) => issues.push({ code, message: messageByCode[code] });

  if (team.length < config.teamSize) add('team_too_small');
  if (new Set(team.map(x => x.evolutionFamilyId)).size !== team.length) add('duplicate_evolution_family');
  if (new Set(team.map(x => x.speciesGroupId)).size !== team.length) add('duplicate_species_group');

  const maxShared = config.customRules?.maxSharedType;
  if (maxShared !== undefined) {
    const counts = new Map<string, number>();
    for (const candidate of team) {
      for (const type of candidate.resolvedPokemon.types) counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    if ([...counts.values()].some(count => count > maxShared)) add('too_many_shared_types');
  }

  const starters = team.filter(x => x.resolvedPokemon.isStarter).length;
  if (config.starterRule === 'require_one') {
    if (starters === 0) add('missing_required_starter');
    if (starters > 1) add('too_many_starters');
  }

  const rareCount = team.filter(isLegendaryOrMythical).length;
  if (config.legendaryRule === 'require_one') {
    if (rareCount === 0) add('missing_required_legendary');
    if (rareCount > 1) add('too_many_legendaries');
  }

  return { valid: issues.length === 0, issues };
}
