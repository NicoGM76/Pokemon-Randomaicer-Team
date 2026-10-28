import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig } from '../../domain/collections/types';
import type { Pokemon } from '../../domain/pokemon/types';
import { generateCollection } from './generateCollection';

function mon(id: number, generation: number, family = `family-${id}`): Pokemon {
  return {
    id,
    name: `P${id}`,
    types: ['normal'],
    introducedGeneration: generation,
    evolutionFamilyId: family,
    stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
    specialTags: [],
    isPseudoLegendary: false,
    isFossil: false,
    isStarter: false
  };
}

const pokemon = [mon(1, 1, 'a'), mon(2, 1, 'b'), mon(3, 1, 'c'), mon(4, 2, 'd'), mon(5, 2, 'e'), mon(6, 2, 'f'), mon(7, 3, 'g')];

const dataset = {
  metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28' },
  pokemon,
  forms: [],
  generations: [{ id: 'gen-1', number: 1, name: 'I' }, { id: 'gen-2', number: 2, name: 'II' }],
  gameFamilies: [],
  games: [
    { id: 'red', name: 'Red', generation: 1, familyId: 'rby', dexIds: ['dex-red'] },
    { id: 'gold', name: 'Gold', generation: 2, familyId: 'gsc', dexIds: ['dex-gold'] }
  ],
  contentPacks: [
    { id: 'red-base', gameId: 'red', name: 'Base', type: 'base', dexIds: ['dex-red'] },
    { id: 'gold-base', gameId: 'gold', name: 'Base', type: 'base', dexIds: ['dex-gold'] }
  ],
  regionalDexes: [],
  regionalDexEntries: [
    { dexId: 'dex-red', pokemonId: 1, dexNumber: 1, source: 'pokeapi' },
    { dexId: 'dex-red', pokemonId: 2, dexNumber: 2, source: 'pokeapi' },
    { dexId: 'dex-red', pokemonId: 3, dexNumber: 3, source: 'pokeapi' },
    { dexId: 'dex-gold', pokemonId: 1, dexNumber: 1, source: 'pokeapi' },
    { dexId: 'dex-gold', pokemonId: 4, dexNumber: 4, source: 'pokeapi' },
    { dexId: 'dex-gold', pokemonId: 5, dexNumber: 5, source: 'pokeapi' },
    { dexId: 'dex-gold', pokemonId: 6, dexNumber: 6, source: 'pokeapi' }
  ],
  mechanicCatalogs: [],
  availability: [],
  availabilityCoverage: {},
  evolutions: []
} as unknown as CompiledDataset;

const baseGenerator = (gameId: string, pack: string) => ({
  gameId,
  enabledContentPacks: [pack],
  teamSize: 3,
  stage: 'all' as const,
  mode: 'random' as const,
  allowedMethods: ['wild' as const],
  allowTradeEvolution: false,
  starterRule: 'allow' as const,
  legendaryRule: 'allow' as const
});

const config: CollectionConfig = {
  entries: [
    { id: 'kanto', label: 'Kanto', generator: baseGenerator('red', 'red-base'), allowBonus: false },
    { id: 'johto', label: 'Johto', generator: baseGenerator('gold', 'gold-base'), allowBonus: false }
  ],
  avoidRepeatedSpecies: true,
  avoidRepeatedFamilies: true,
  maxBonusPerTeam: 1
};

const fixedRng = () => 0.42;

describe('generateCollection', () => {
  it('coordinates teams without repeating species or evolution families', () => {
    const result = generateCollection(dataset, config, undefined, fixedRng);
    const species = result.teams.flatMap(team => team.team.map(slot => slot.candidate.speciesGroupId));
    const families = result.teams.flatMap(team => team.team.map(slot => slot.candidate.evolutionFamilyId));
    expect(new Set(species).size).toBe(species.length);
    expect(new Set(families).size).toBe(families.length);
    expect(result.totalPokemon).toBe(6);
  });

  it('returns a partial collection instead of relaxing duplicate rules', () => {
    const tiny = { ...config, entries: config.entries.map(entry => ({ ...entry, generator: { ...entry.generator, teamSize: 4 } })) };
    const result = generateCollection(dataset, tiny, undefined, fixedRng);
    expect(result.complete).toBe(false);
    expect(result.duplicateSpecies).toBe(0);
    expect(result.duplicateFamilies).toBe(0);
  });

  it('uses at most one bonus per team when a normal pool cannot complete it', () => {
    const bonusConfig: CollectionConfig = {
      ...config,
      entries: [{ id: 'kanto', label: 'Kanto', generator: { ...baseGenerator('red', 'red-base'), teamSize: 4 }, allowBonus: true }]
    };
    const result = generateCollection(dataset, bonusConfig, undefined, fixedRng);
    expect(result.teams[0].bonusCandidateKeys.length).toBeLessThanOrEqual(1);
    expect(result.teams[0].team.length).toBe(4);
  });
});
