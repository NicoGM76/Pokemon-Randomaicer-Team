import type { GenerationResult, GeneratorConfig, PokemonCandidate, TeamSlot } from '../../domain/teams/types';
import { generateRandomTeam } from '../random/generateRandomTeam';
import { scoreAdventureTeam } from './scoreAdventureTeam';

export function generateAdventureTeam(candidates: PokemonCandidate[], config: GeneratorConfig, lockedSlots: TeamSlot[], rng: () => number = Math.random): GenerationResult {
  const attempts: { result: GenerationResult; score: number }[] = [];
  for (let i=0;i<150;i++) {
    const result = generateRandomTeam(candidates, config, lockedSlots, rng);
    if (result.team.length === 0) continue;
    attempts.push({ result, score: scoreAdventureTeam(result.team.map(s=>s.candidate), config).total });
  }
  if (!attempts.length) return generateRandomTeam(candidates, config, lockedSlots, rng);
  attempts.sort((a,b)=>b.score-a.score);
  const elite = attempts.slice(0, Math.min(10, attempts.length));
  return elite[Math.floor(rng()*elite.length)].result;
}
