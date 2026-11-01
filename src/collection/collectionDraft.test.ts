/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import type { CollectionConfig, CollectionResult } from '../domain/collections/types';
import { clearCollectionDraft, loadCollectionDraft, saveCollectionDraft } from './collectionDraft';

const config: CollectionConfig = {
  entries: [{
    id: 'kanto',
    label: 'Kanto',
    targetGeneration: 1,
    generator: {
      gameId: 'red', enabledContentPacks: ['red-base'], teamSize: 6, stage: 'all', mode: 'adventure',
      allowedMethods: ['wild'], allowTradeEvolution: false, starterRule: 'allow', legendaryRule: 'exclude'
    },
    allowBonus: true
  }],
  avoidRepeatedSpecies: true,
  avoidRepeatedFamilies: true,
  maxBonusPerTeam: 1
};

const result: CollectionResult = {
  teams: [{
    entryId: 'kanto', label: 'Kanto', targetGeneration: 1, gameId: 'red', team: [], complete: false,
    locked: true, bonusCandidateKeys: []
  }],
  complete: false,
  totalPokemon: 0,
  bonusesUsed: 0,
  duplicateSpecies: 0,
  duplicateFamilies: 0,
  warnings: []
};

beforeEach(() => localStorage.clear());

describe('collection draft', () => {
  it('restores config, results and team locks', () => {
    saveCollectionDraft({ config, result });
    const restored = loadCollectionDraft();
    expect(restored?.config).toEqual(config);
    expect(restored?.result?.teams[0].locked).toBe(true);
  });

  it('clears the current collection draft', () => {
    saveCollectionDraft({ config, result });
    clearCollectionDraft();
    expect(loadCollectionDraft()).toBeNull();
  });
});
