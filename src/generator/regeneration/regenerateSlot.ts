import type { GeneratorConfig, PokemonCandidate, SlotRegenerationResult, TeamSlot } from '../../domain/teams/types';
import { canAddCandidateToTeam } from '../constraints/canAddCandidateToTeam';
import { validateTeam } from '../validation/validateTeam';

export function regenerateSlot(team: TeamSlot[], slotIndex: number, candidates: PokemonCandidate[], config: GeneratorConfig): SlotRegenerationResult {
  const target = team[slotIndex];
  if (!target || target.locked) return { team, changed: false, reason: 'no_alternative' };
  const others = team.filter((_, index) => index !== slotIndex).map(slot => slot.candidate);

  for (const candidate of candidates) {
    if (candidate.candidateKey === target.candidate.candidateKey) continue;
    if (!canAddCandidateToTeam(candidate, others, config)) continue;
    const next = team.map((slot, index) => index === slotIndex ? { candidate, locked: false } : slot);
    if (!validateTeam(next.map(slot => slot.candidate), config).valid) continue;
    return { team: next, changed: true };
  }
  return { team, changed: false, reason: 'no_alternative' };
}
