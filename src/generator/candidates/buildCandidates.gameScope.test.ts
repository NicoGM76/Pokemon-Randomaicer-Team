import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { GeneratorConfig } from '../../domain/teams/types';
import type { Pokemon } from '../../domain/pokemon/types';
import { buildCandidates } from './buildCandidates';

function mon(id: number, name: string, generation: number): Pokemon {
  return {
    id,
    name,
    types: ['fighting'],
    introducedGeneration: generation,
    evolutionFamilyId: 'chain-mankey',
    stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
    specialTags: [],
    isPseudoLegendary: false,
    isFossil: false,
    isStarter: false
  };
}

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

const dataset: CompiledDataset = {
  metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28T00:00:00Z' },
  pokemon: [mon(56, 'Mankey', 1), mon(57, 'Primeape', 1), mon(979, 'Annihilape', 9)],
  forms: [],
  generations: [{ id: 'gen-1', number: 1, name: 'Generación I' }],
  gameFamilies: [],
  games: [{ id: 'red', name: 'Pokémon Rojo', generation: 1, familyId: 'rby', dexIds: ['kanto-classic'] }],
  contentPacks: [{ id: 'red-base', gameId: 'red', name: 'Juego base', type: 'base', dexIds: ['kanto-classic'] }],
  regionalDexes: [{ id: 'kanto-classic', name: 'Kanto', region: 'Kanto', entryCount: 2, kind: 'regional', entryStatus: 'imported' }],
  regionalDexEntries: [
    { dexId: 'kanto-classic', pokemonId: 56, dexNumber: 56, source: 'pokeapi' },
    { dexId: 'kanto-classic', pokemonId: 57, dexNumber: 57, source: 'pokeapi' }
  ],
  mechanicCatalogs: [],
  availability: [],
  evolutions: [
    { fromId: 56, toId: 57, conditions: [{ type: 'level', minLevel: 28 }] },
    { fromId: 57, toId: 979, conditions: [{ type: 'special', conditionId: 'rage-fist' }] }
  ]
};

describe('game-scoped evolution fallback', () => {
  it('stops at the highest evolution that exists in the enabled regional dex', () => {
    const candidates = buildCandidates(dataset, config);
    expect(candidates.some(candidate => candidate.resolvedPokemon.id === 979)).toBe(false);
    expect(candidates.some(candidate => candidate.resolvedPokemon.id === 57)).toBe(true);
  });
});
