import { describe, expect, it } from 'vitest';
import type { CompiledDataset } from '../../data/types';
import type { Pokemon } from '../../domain/pokemon/types';
import type { CollectionEntryConfig } from '../../domain/collections/types';
import { buildCollectionCandidates } from './collectionCandidates';

function mon(id: number, name: string, introducedGeneration: number, family: string): Pokemon {
  return {
    id, name, introducedGeneration, evolutionFamilyId: family,
    types: ['normal'], stats: { hp: 75, attack: 70, defense: 70, specialAttack: 70, specialDefense: 70, speed: 70 },
    specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false
  };
}

const pokemon = [
  mon(200, 'Misdreavus', 2, 'misdreavus'),
  mon(429, 'Mismagius', 4, 'misdreavus'),
  mon(215, 'Sneasel', 2, 'sneasel'),
  mon(461, 'Weavile', 4, 'sneasel'),
  mon(93, 'Haunter', 1, 'gastly'),
  mon(94, 'Gengar', 1, 'gastly'),
  mon(133, 'Eevee', 1, 'eevee'),
  mon(134, 'Vaporeon', 1, 'eevee'),
  mon(135, 'Jolteon', 1, 'eevee'),
  mon(470, 'Leafeon', 4, 'eevee'),
  mon(42, 'Golbat', 1, 'zubat'),
  mon(169, 'Crobat', 2, 'zubat')
];
const baseIds = [200, 215, 93, 133, 42];
const dataset = {
  metadata: { schemaVersion: 3, datasetVersion: 'fixture', generatedAt: '2026-11-03' },
  pokemon,
  forms: [], generations: [], gameFamilies: [], mechanicCatalogs: [],
  availability: [], availabilityCoverage: [],
  games: [
    { id: 'red', name: 'Red', generation: 1, familyId: 'rby', dexIds: ['red-dex'] },
    { id: 'gold', name: 'Gold', generation: 2, familyId: 'gsc', dexIds: ['johto-dex'] },
    { id: 'heartgold', name: 'HeartGold', generation: 4, familyId: 'hgss', dexIds: ['hgss-dex'] }
  ],
  contentPacks: ['red', 'gold', 'heartgold'].map(id => ({
    id: id + '-base', gameId: id, name: 'Base', type: 'base', dexIds: [id === 'red' ? 'red-dex' : id === 'gold' ? 'johto-dex' : 'hgss-dex']
  })),
  regionalDexes: [],
  regionalDexEntries: [
    ...baseIds.map(id => ({ dexId: 'red-dex', pokemonId: id, dexNumber: id, source: 'pokeapi' })),
    ...baseIds.map(id => ({ dexId: 'johto-dex', pokemonId: id, dexNumber: id, source: 'pokeapi' })),
    ...baseIds.map(id => ({ dexId: 'hgss-dex', pokemonId: id, dexNumber: id, source: 'pokeapi' }))
  ],
  evolutions: [
    { fromId: 200, toId: 429, conditions: [{ type: 'item', itemId: 'dusk-stone' }] },
    { fromId: 215, toId: 461, conditions: [{ type: 'time', value: 'night' }, { type: 'special', conditionId: 'held_item_id:303' }] },
    { fromId: 93, toId: 94, conditions: [{ type: 'trade' }] },
    { fromId: 133, toId: 134, conditions: [{ type: 'item', itemId: 'water-stone' }] },
    { fromId: 133, toId: 135, conditions: [{ type: 'item', itemId: 'thunder-stone' }] },
    { fromId: 133, toId: 470, conditions: [{ type: 'special', conditionId: 'near_special_rock:1' }] },
    { fromId: 42, toId: 169, conditions: [{ type: 'friendship' }] }
  ]
} as unknown as CompiledDataset;

function entry(gameId: string, targetGeneration = 2, allowTradeEvolution = false): CollectionEntryConfig {
  return {
    id: gameId, label: gameId, targetGeneration, allowBonus: false,
    generator: {
      gameId, teamSize: 6, enabledContentPacks: [gameId + '-base'],
      stage: 'all', mode: 'adventure', allowedMethods: ['wild','evolution','gift'],
      allowTradeEvolution, starterRule: 'allow', legendaryRule: 'allow'
    }
  };
}
function candidates(gameId: string, target = 2, allowTrade = false) {
  return buildCollectionCandidates(dataset, entry(gameId, target, allowTrade));
}
function has(gameId: string, id: number, target = 2, trade = false): boolean {
  return candidates(gameId, target, trade).some(item => item.resolvedPokemon.id === id);
}

describe('Collection evolutionary line resolution', () => {
  it('resolves Sneasel and Misdreavus to their Gen IV finals in HeartGold', () => {
    expect(has('heartgold', 461)).toBe(true);
    expect(has('heartgold', 429)).toBe(true);
    expect(has('heartgold', 215)).toBe(false);
    expect(has('heartgold', 200)).toBe(false);
  });

  it('keeps old-game evolutions gated by the game generation, not target family generation', () => {
    expect(has('gold', 215)).toBe(true);
    expect(has('gold', 200)).toBe(true);
    expect(has('gold', 461)).toBe(false);
    expect(has('gold', 429)).toBe(false);
    expect(has('red', 42, 1)).toBe(true);
    expect(has('red', 169, 1)).toBe(false);
    expect(has('heartgold', 169, 1)).toBe(true);
  });

  it('does not evolve Haunter by trade unless explicitly allowed', () => {
    expect(has('heartgold', 93, 1, false)).toBe(true);
    expect(has('heartgold', 94, 1, false)).toBe(false);
    expect(has('heartgold', 93, 1, true)).toBe(false);
    expect(has('heartgold', 94, 1, true)).toBe(true);
  });

  it('preserves valid branched Eevee evolutions within the game', () => {
    const eeveeFamily = candidates('heartgold', 1).filter(item => item.evolutionFamilyId === 'eevee').map(item => item.resolvedPokemon.id);
    expect(eeveeFamily).toEqual(expect.arrayContaining([134,135,470]));
    expect(eeveeFamily).not.toContain(133);
    const older = candidates('red', 1).filter(item => item.evolutionFamilyId === 'eevee').map(item => item.resolvedPokemon.id);
    expect(older).toEqual(expect.arrayContaining([134,135]));
    expect(older).not.toContain(470);
  });
});
