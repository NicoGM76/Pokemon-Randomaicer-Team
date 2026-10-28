import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import { usesRegionalDexFallback } from './buildCandidates';

const config: GeneratorConfig = {
  gameId: 'platinum',
  enabledContentPacks: ['platinum-base'],
  teamSize: 6,
  stage: 'all',
  mode: 'adventure',
  allowedMethods: ['wild', 'gift', 'evolution'],
  allowTradeEvolution: false,
  starterRule: 'require_one',
  legendaryRule: 'exclude'
};

function dataset(status?: 'partial' | 'complete'): CompiledDataset {
  return {
    metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28T00:00:00Z' },
    pokemon: [],
    forms: [],
    generations: [],
    gameFamilies: [],
    games: [{ id: 'platinum', name: 'Pokémon Platino', generation: 4, familyId: 'dppt', dexIds: ['sinnoh-platinum'] }],
    contentPacks: [{ id: 'platinum-base', gameId: 'platinum', name: 'Juego base', type: 'base', dexIds: ['sinnoh-platinum'] }],
    regionalDexes: [],
    regionalDexEntries: [],
    mechanicCatalogs: [],
    availability: [{ pokemonId: 389, gameId: 'platinum', contentPackId: 'platinum-base', stage: 'main_story', method: 'gift' }],
    evolutions: [],
    availabilityCoverage: status ? [{ gameId: 'platinum', status }] : []
  } as CompiledDataset;
}

describe('availability coverage', () => {
  it('keeps regional dex fallback when availability is only partial', () => {
    expect(usesRegionalDexFallback(dataset('partial'), config)).toBe(true);
  });

  it('uses curated availability only when coverage is explicitly complete', () => {
    expect(usesRegionalDexFallback(dataset('complete'), config)).toBe(false);
  });
});
