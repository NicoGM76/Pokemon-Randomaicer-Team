import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { CollectionConfig } from '../../domain/collections/types';
import type { Pokemon } from '../../domain/pokemon/types';
import { generateCollection } from './generateCollection';
import { regenerateCollectionMember } from './regenerateCollectionMember';

function mon(id: number, generation: number): Pokemon {
  return {
    id, name: 'p' + id, types: ['normal'], introducedGeneration: generation,
    evolutionFamilyId: 'family-' + id,
    stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
    specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false
  };
}
const dataset = {
  metadata: { schemaVersion: 3, datasetVersion: 'test', generatedAt: '2026-11-03' },
  pokemon: [...[1,2,3,4].map(id => mon(id, 1)), ...[5,6,7,8].map(id => mon(id, 2))],
  forms: [], generations: [], gameFamilies: [], mechanicCatalogs: [],
  availability: [], availabilityCoverage: [], evolutions: [], regionalDexes: [],
  games: [
    { id: 'red', name: 'Red', generation: 1, familyId: 'rby', dexIds: ['red-dex'] },
    { id: 'gold', name: 'Gold', generation: 2, familyId: 'gsc', dexIds: ['gold-dex'] }
  ],
  contentPacks: [
    { id: 'red-base', gameId: 'red', name: 'Base', type: 'base', dexIds: ['red-dex'] },
    { id: 'gold-base', gameId: 'gold', name: 'Base', type: 'base', dexIds: ['gold-dex'] }
  ],
  regionalDexEntries: [
    ...[1,2,3,4].map(id => ({ dexId: 'red-dex', pokemonId: id, dexNumber: id, source: 'pokeapi' })),
    ...[5,6,7,8].map(id => ({ dexId: 'gold-dex', pokemonId: id, dexNumber: id, source: 'pokeapi' }))
  ]
} as unknown as CompiledDataset;

const config: CollectionConfig = {
  entries: [
    { id: 'one', label: 'Kanto', targetGeneration: 1, allowBonus: false,
      generator: { gameId: 'red', enabledContentPacks: ['red-base'], teamSize: 2,
        stage: 'all', mode: 'random', allowedMethods: ['wild'], allowTradeEvolution: false,
        starterRule: 'allow', legendaryRule: 'allow' } },
    { id: 'two', label: 'Johto', targetGeneration: 2, allowBonus: false,
      generator: { gameId: 'gold', enabledContentPacks: ['gold-base'], teamSize: 2,
        stage: 'all', mode: 'random', allowedMethods: ['wild'], allowTradeEvolution: false,
        starterRule: 'allow', legendaryRule: 'allow' } }
  ],
  avoidRepeatedSpecies: true, avoidRepeatedFamilies: true, maxBonusPerTeam: 1
};

describe('regenerateCollectionMember', () => {
  it('rerolls a single Pokémon without changing its position, other slots or other regions', () => {
    const current = generateCollection(dataset, config, undefined, () => 0.31);
    const before = current.teams[0].team[0].candidate.candidateKey;
    const after = regenerateCollectionMember(dataset, config, current, 'one', 0, () => 0.9);
    expect(after.teams[0].team[0].candidate.candidateKey).not.toBe(before);
    expect(after.teams[0].team.slice(1)).toEqual(current.teams[0].team.slice(1));
    expect(after.teams[1]).toEqual(current.teams[1]);
    expect(after.duplicateFamilies).toBe(0);
    expect(after.duplicateSpecies).toBe(0);
  });

  it('does nothing for a locked region, locked member or invalid index', () => {
    const current = generateCollection(dataset, config, undefined, () => 0.31);
    const regionLocked = {
      ...current, teams: current.teams.map((team,index) => index === 0 ? { ...team, locked: true } : team)
    };
    expect(regenerateCollectionMember(dataset, config, regionLocked, 'one', 0)).toBe(regionLocked);
    const memberLocked = {
      ...current, teams: current.teams.map((team,index) => index === 0 ? {
        ...team, team: team.team.map((slot,i) => i === 0 ? { ...slot, locked: true } : slot)
      } : team)
    };
    expect(regenerateCollectionMember(dataset, config, memberLocked, 'one', 0)).toBe(memberLocked);
    expect(regenerateCollectionMember(dataset, config, current, 'one', 99)).toBe(current);
  });

  it('keeps the collection unchanged when no other eligible species exists', () => {
    const tiny = {
      ...config,
      entries: config.entries.map(entry => ({ ...entry, generator: { ...entry.generator, teamSize: 4 } }))
    };
    const current = generateCollection(dataset, tiny, undefined, () => 0.3);
    expect(regenerateCollectionMember(dataset, tiny, current, 'one', 0)).toBe(current);
  });
});
