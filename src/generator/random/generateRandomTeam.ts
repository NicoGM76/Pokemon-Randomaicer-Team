import type { GenerationResult, GeneratorConfig, PokemonCandidate, TeamSlot } from '../../domain/teams/types';
import { canAddCandidateToTeam } from '../constraints/canAddCandidateToTeam';
import { validateTeam } from '../validation/validateTeam';

function shuffled<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isLegendary(candidate: PokemonCandidate): boolean {
  return candidate.resolvedPokemon.specialTags.includes('legendary');
}

export function generateRandomTeam(
  candidates: PokemonCandidate[],
  config: GeneratorConfig,
  lockedSlots: TeamSlot[],
  rng: () => number = Math.random
): GenerationResult {
  const team: TeamSlot[] = [...lockedSlots];
  const current = () => team.map(slot => slot.candidate);
  const used = new Set(team.map(slot => slot.candidate.candidateKey));

  const tryAdd = (predicate: (candidate: PokemonCandidate) => boolean): boolean => {
    if (team.length >= config.teamSize) return false;
    for (const candidate of shuffled(candidates, rng)) {
      if (used.has(candidate.candidateKey) || !predicate(candidate)) continue;
      if (!canAddCandidateToTeam(candidate, current(), config)) continue;
      team.push({ candidate, locked: false });
      used.add(candidate.candidateKey);
      return true;
    }
    return false;
  };

  if (config.starterRule === 'require_one' && !current().some(c => c.resolvedPokemon.isStarter)) {
    tryAdd(c => c.resolvedPokemon.isStarter);
  }
  if (config.legendaryRule === 'require_one' && !current().some(isLegendary)) {
    tryAdd(isLegendary);
  }

  for (const candidate of shuffled(candidates, rng)) {
    if (team.length >= config.teamSize) break;
    if (used.has(candidate.candidateKey)) continue;
    if (!canAddCandidateToTeam(candidate, current(), config)) continue;
    team.push({ candidate, locked: false });
    used.add(candidate.candidateKey);
  }

  const validation = validateTeam(current(), config);
  return {
    team,
    requestedSize: config.teamSize,
    generatedSize: team.length,
    complete: team.length === config.teamSize && validation.valid,
    validation,
    warnings: []
  };
}
