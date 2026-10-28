import type { CompiledDataset } from '../data/types';
import type { GenerationResult, GeneratorConfig, TeamSlot } from '../domain/teams/types';
import { generateAdventureTeam } from './adventure/generateAdventureTeam';
import { buildCandidates } from './candidates/buildCandidates';
import { generateRandomTeam } from './random/generateRandomTeam';

export function generateTeam(dataset: CompiledDataset, config: GeneratorConfig, currentTeam: TeamSlot[] = []): GenerationResult {
  const candidates = buildCandidates(dataset, config);
  const locked = currentTeam.filter(slot => slot.locked);
  const result = config.mode === 'adventure'
    ? generateAdventureTeam(candidates, config, locked)
    : generateRandomTeam(candidates, config, locked);

  if (!result.complete && !result.warnings.some(w => w.code === 'insufficient_candidates')) {
    result.warnings.push({ code: 'insufficient_candidates', message: `${result.generatedSize}/${result.requestedSize} disponibles con las reglas actuales.` });
  }
  return result;
}
