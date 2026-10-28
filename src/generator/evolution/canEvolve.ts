import type { EvolutionCondition, EvolutionStep } from '../../domain/evolution/types';
import type { GeneratorConfig } from '../../domain/teams/types';

function checkCondition(condition: EvolutionCondition, config: GeneratorConfig): boolean {
  switch (condition.type) {
    case 'trade':
      return config.allowTradeEvolution;
    case 'game':
      return condition.gameIds.includes(config.gameId);
    case 'level':
    case 'item':
    case 'friendship':
    case 'time':
    case 'gender':
    case 'move_known':
    case 'special':
      return true;
  }
}

export function canEvolve(step: EvolutionStep, config: GeneratorConfig): boolean {
  return step.conditions.every(condition => checkCondition(condition, config));
}
