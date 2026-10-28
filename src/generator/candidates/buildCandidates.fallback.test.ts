import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { PokemonType } from '../../domain/pokemon/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import { buildCandidates, usesRegionalDexFallback } from './buildCandidates';

const pokemon = (id: number, name: string) => ({
  id,
  name,
  types: ['normal'] as PokemonType[],
  introducedGeneration: id === 979 ? 9 : 1,
  evolutionFamilyId: 'chain-kanto-test',
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

function dataset(
  availability: CompiledDataset['availability'] = [],
  availabilityCoverage: CompiledDataset['availabilityCoverage'] = []
): CompiledDataset {
  return {
    metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28T00:00:00Z' },
    pokemon: [
      pokemon(1, 'Bulbasaur'),
      pokemon(2, 'Ivysaur'),
      pokemon(3, 'Venusaur'),
      pokemon(979, 'Annihilape')
    ],
    forms: [],
    generations: [{ id: 'gen-1', number: 1, name: 'Generación I' }],
    gameFamilies: [],
    games: [{ id: 'red', name: 'Pokémon Rojo', generation: 1, familyId: 'rby', dexIds: ['kanto-classic'] }],
    contentPacks: [{ id: 'red-base', gameId: 'red', name: 'Juego base', type: 'base', dexIds: ['kanto-classic'] }],
    regionalDexes: [{ id: 'kanto-classic', name: 'Kanto', region: 'Kanto', entryCount: 3, kind: 'regional', entryStatus: 'imported' }],
    regionalDexEntries: [
      { dexId: 'kanto-classic', pokemonId: 1, dexNumber: 1, source: 'pokeapi' },
      { dexId: 'kanto-classic', pokemonId: 2, dexNumber: 2, source: 'pokeapi' },
      { dexId: 'kanto-classic', pokemonId: 3, dexNumber: 3, source: 'pokeapi' }
    ],
    mechanicCatalogs: [],
    availability,
    availabilityCoverage,
    evolutions: [
      { fromId: 1, toId: 2, conditions: [{ type: 'level', minLevel: 16 }] },
      { fromId: 2, toId: 3, conditions: [{ type: 'level', minLevel: 32 }] },
      { fromId: 3, toId: 979, conditions: [{ type: 'special', conditionId: 'later-generation-evolution' }] }
    ]
  };
}

describe('regional dex fallback', () => {
  it('builds candidates from the enabled regional dex and stops before later-generation evolutions', () => {
    const data = dataset();
    expect(usesRegionalDexFallback(data, config)).toBe(true);
    expect(buildCandidates(data, config).map(candidate => candidate.resolvedPokemon.id)).toEqual([3]);
  });

  it('keeps using the regional dex when curated availability is only partial', () => {
    const data = dataset(
      [{ pokemonId: 2, gameId: 'red', contentPackId: 'red-base', stage: 'main_story', method: 'wild' }],
      [{ gameId: 'red', status: 'partial' }]
    );
    expect(usesRegionalDexFallback(data, config)).toBe(true);
  });

  it('trusts curated availability only when coverage is explicitly complete', () => {
    const data = dataset(
      [{ pokemonId: 2, gameId: 'red', contentPackId: 'red-base', stage: 'main_story', method: 'wild' }],
      [{ gameId: 'red', status: 'complete' }]
    );
    expect(usesRegionalDexFallback(data, config)).toBe(false);
  });
});
