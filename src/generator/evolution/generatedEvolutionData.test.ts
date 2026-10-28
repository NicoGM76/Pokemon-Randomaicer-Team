import { describe, expect, it } from 'vitest';
import evolutions from '../../data/generated/evolutions.json';
import type { EvolutionStep } from '../../domain/evolution/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import { resolveReachableEvolutions } from './resolveReachableEvolutions';

const config: GeneratorConfig = {
  gameId: 'red',
  enabledContentPacks: ['red-base'],
  teamSize: 6,
  stage: 'all',
  mode: 'random',
  allowedMethods: ['wild', 'gift', 'evolution'],
  allowTradeEvolution: false,
  starterRule: 'allow',
  legendaryRule: 'allow'
};

const steps = evolutions as EvolutionStep[];

describe('generated evolution data coverage', () => {
  it('resolves Bulbasaur to Venusaur', () => {
    expect(resolveReachableEvolutions(1, steps, config).map(result => result.pokemonId)).toContain(3);
  });

  it('resolves Dratini to Dragonite', () => {
    expect(resolveReachableEvolutions(147, steps, config).map(result => result.pokemonId)).toContain(149);
  });

  it('keeps trade evolutions blocked until enabled', () => {
    expect(resolveReachableEvolutions(64, steps, config).map(result => result.pokemonId)).toContain(64);
    expect(resolveReachableEvolutions(64, steps, { ...config, allowTradeEvolution: true }).map(result => result.pokemonId)).toContain(65);
  });
});
