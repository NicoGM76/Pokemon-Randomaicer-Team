import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig } from '../../domain/collections/types';
import type { Pokemon } from '../../domain/pokemon/types';
import { generateCollection } from './generateCollection';
import { regenerateCollectionTeam } from './regenerateCollectionTeam';

function mon(id: number, generation: number): Pokemon {
  return {
    id,
    name: `P${id}`,
    types: ['normal'],
    introducedGeneration: generation,
    evolutionFamilyId: `family-${id}`,
    stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
    specialTags: [],
    isPseudoLegendary: false,
    isFossil: false,
    isStarter: false
  };
}

const dataset = {
  metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-10-28' },
  pokemon: [mon(1, 1), mon(2, 1), mon(3, 1), mon(4, 2), mon(5, 2), mon(6, 2), mon(7, 2)],
  forms: [], generations: [], gameFamilies: [], mechanicCatalogs: [], availability: [], availabilityCoverage: [], evolutions: [], regionalDexes: [],
  games: [
    { id: 'red', name: 'Red', generation: 1, familyId: 'rby', dexIds: ['red-dex'] },
    { id: 'gold', name: 'Gold', generation: 2, familyId: 'gsc', dexIds: ['gold-dex'] }
  ],
  contentPacks: [
    { id: 'red-base', gameId: 'red', name: 'Base', type: 'base', dexIds: ['red-dex'] },
    { id: 'gold-base', gameId: 'gold', name: 'Base', type: 'base', dexIds: ['gold-dex'] }
  ],
  regionalDexEntries: [
    { dexId: 'red-dex', pokemonId: 1, dexNumber: 1, source: 'pokeapi' },
    { dexId: 'red-dex', pokemonId: 2, dexNumber: 2, source: 'pokeapi' },
    { dexId: 'red-dex', pokemonId: 3, dexNumber: 3, source: 'pokeapi' },
    { dexId: 'gold-dex', pokemonId: 4, dexNumber: 4, source: 'pokeapi' },
    { dexId: 'gold-dex', pokemonId: 5, dexNumber: 5, source: 'pokeapi' },
    { dexId: 'gold-dex', pokemonId: 6, dexNumber: 6, source: 'pokeapi' },
    { dexId: 'gold-dex', pokemonId: 7, dexNumber: 7, source: 'pokeapi' }
  ]
} as unknown as CompiledDataset;

const generator = (gameId: string, pack: string) => ({
  gameId, enabledContentPacks: [pack], teamSize: 2, stage: 'all' as const, mode: 'random' as const,
  allowedMethods: ['wild' as const], allowTradeEvolution: false, starterRule: 'allow' as const, legendaryRule: 'allow' as const
});

const config: CollectionConfig = {
  entries: [
    { id: 'kanto', label: 'Kanto', targetGeneration: 1, generator: generator('red', 'red-base'), allowBonus: false },
    { id: 'johto', label: 'Johto', targetGeneration: 2, generator: generator('gold', 'gold-base'), allowBonus: false }
  ],
  avoidRepeatedSpecies: true,
  avoidRepeatedFamilies: true,
  maxBonusPerTeam: 1
};

const rng = () => 0.31;

describe('regenerateCollectionTeam', () => {
  it('does nothing when the target team is locked', () => {
    const current = generateCollection(dataset, config, undefined, rng);
    current.teams[0] = { ...current.teams[0], locked: true };
    expect(regenerateCollectionTeam(dataset, config, current, 'kanto', rng)).toBe(current);
  });

  it('preserves other teams and a locked member while rerolling one region', () => {
    const current = generateCollection(dataset, config, undefined, rng);
    const otherBefore = current.teams.find(team => team.entryId === 'kanto')!;
    const johto = current.teams.find(team => team.entryId === 'johto')!;
    johto.team[0] = { ...johto.team[0], locked: true };
    const lockedKey = johto.team[0].candidate.candidateKey;

    const next = regenerateCollectionTeam(dataset, config, current, 'johto', () => 0.77);
    const otherAfter = next.teams.find(team => team.entryId === 'kanto')!;
    const johtoAfter = next.teams.find(team => team.entryId === 'johto')!;

    expect(otherAfter.team.map(slot => slot.candidate.candidateKey)).toEqual(otherBefore.team.map(slot => slot.candidate.candidateKey));
    expect(johtoAfter.team.some(slot => slot.candidate.candidateKey === lockedKey && slot.locked)).toBe(true);

    const allFamilies = next.teams.flatMap(team => team.team.map(slot => slot.candidate.evolutionFamilyId));
    expect(new Set(allFamilies).size).toBe(allFamilies.length);
  });
});
