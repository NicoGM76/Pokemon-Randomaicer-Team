import type { GenerationResult, GeneratorConfig, PokemonCandidate, TeamSlot } from '../../domain/teams/types';
import { generateRandomTeam } from '../random/generateRandomTeam';

export function regenerateTeam(team: TeamSlot[], candidates: PokemonCandidate[], config: GeneratorConfig): GenerationResult {
  return generateRandomTeam(candidates, config, team.filter(slot => slot.locked));
}
