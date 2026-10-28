import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import { buildCandidates, usesRegionalDexFallback } from './buildCandidates';

const pokemon = (id: number, name: string) => ({
  id,
  name,
  types: ['normal'] as const,
  introducedGeneration: 1,
  evolutionFamilyId: `chain-${id}`,
  stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
  specialTags: [],
  isPseudoLegendary: false,
  isFossil: false,
  isStarter: false
});

const config: GeneratorConfig = {
  gameId: 'red',
  enabledContentPacks: ['red-base'],
  teamSize: 1,
  stage: 'all',
  mode: 'random',
  allowedMethods: ['wild'],
  allowTradeEvolution: false,
  starterRule: 'allow',
  legendaryRule: 'allow'
};

function dataset(availability: CompiledDataset['availability'] = []): CompiledDataset {
  return {
    metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28T00:00:00Z' },
    pokemon: [pokemon(1, 'Bulbasaur'), pokemon(2, 'Ivysaur')],
    forms: [],
    generations: [{ id: 'gen-1', number: 1, name: 'Generación I' }],
    gameFamilies: [],
    games: [{ id: 'red', name: 'Pokémon Rojo', generation: 1, familyId: 'rby', dexIds: ['kanto-classic'] }],
    contentPacks: [{ id: 'red-base', gameId: 'red', name: 'Juego base', type: 'base', dexIds: ['kanto-classic'] }],
    regionalDexes: [{ id: 'kanto-classic', name: 'Kanto', region: 'Kanto', entryCount: 1, kind: 'regional', entryStatus: 'imported' }],
    regionalDexEntries: [{ dexId: 'kanto-classic', pokemonId: 1, dexNumber: 1, source: 'pokeapi' }],
    mechanicCatalogs: [],
    availability,
    evolutions: []
  };
}

describe('regional dex fallback', () => {
  it('builds candidates from the enabled regional dex when a game has no curated availability', () => {
    const data = dataset();
    expect(usesRegionalDexFallback(data, config)).toBe(true);
    expect(buildCandidates(data, config).map(candidate => candidate.sourcePokemon.id)).toEqual([1]);
  });

  it('does not leak regional-dex-only Pokémon when curated availability exists', () => {
    const data = dataset([{ pokemonId: 2, gameId: 'red', contentPackId: 'red-base', stage: 'main_story', method: 'wild' }]);
    expect(usesRegionalDexFallback(data, config)).toBe(false);
    expect(buildCandidates(data, config).map(candidate => candidate.sourcePokemon.id)).toEqual([2]);
  });
});
