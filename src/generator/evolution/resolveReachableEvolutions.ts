import type { EvolutionStep, ReachableEvolution } from '../../domain/evolution/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import { canEvolve } from './canEvolve';

export function resolveReachableEvolutions(
  startPokemonId: number,
  steps: EvolutionStep[],
  config: GeneratorConfig
): ReachableEvolution[] {
  const walk = (currentId: number, path: EvolutionStep[], visited: Set<number>): ReachableEvolution[] => {
    const nextSteps = steps.filter(step =>
      step.fromId === currentId &&
      canEvolve(step, config) &&
      !visited.has(step.toId)
    );

    if (nextSteps.length === 0) {
      return [{ pokemonId: currentId, path }];
    }

    return nextSteps.flatMap(step => {
      const nextVisited = new Set(visited);
      nextVisited.add(step.toId);
      return walk(step.toId, [...path, step], nextVisited);
    });
  };

  return walk(startPokemonId, [], new Set([startPokemonId]));
}
