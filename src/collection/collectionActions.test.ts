import { describe, expect, it } from 'vitest';
import type { CollectionConfig, CollectionResult } from '../domain/collections/types';
import type { TeamSlot } from '../domain/teams/types';
import { setAllBonus, setAllTradeEvolution, setTeamLocks, clearAllLocks } from './collectionActions';

const config: CollectionConfig = {
  entries: [1, 2].map(index => ({
    id: String(index), label: 'Team ' + index, targetGeneration: index, allowBonus: index === 2,
    generator: {
      gameId: 'heartgold', enabledContentPacks: ['heartgold-base'], teamSize: 2,
      stage: 'all', mode: 'adventure', allowedMethods: ['wild','gift','evolution'],
      allowTradeEvolution: index === 1, starterRule: 'allow', legendaryRule: 'exclude'
    }
  })),
  avoidRepeatedSpecies: true, avoidRepeatedFamilies: true, maxBonusPerTeam: 1
};
const mockSlot = (id: number, locked: boolean): TeamSlot => ({
  locked,
  candidate: { candidateKey: String(id), evolutionFamilyId: 'family' + id, speciesGroupId: String(id) }
} as TeamSlot);

const result: CollectionResult = {
  teams: [1, 2].map(index => ({
    entryId: String(index), label: 'Team', targetGeneration: index, gameId: 'heartgold',
    locked: index === 2, team: [mockSlot(index, index === 1), mockSlot(index + 10, false)],
    complete: true, bonusCandidateKeys: []
  })),
  complete: true, totalPokemon: 4, bonusesUsed: 0, duplicateSpecies: 0, duplicateFamilies: 0, warnings: []
};

describe('bulk collection preferences and locks', () => {
  it('enables and disables trade evolutions without mutating other fields', () => {
    const on = setAllTradeEvolution(config, true);
    expect(on.entries.every(entry => entry.generator.allowTradeEvolution)).toBe(true);
    expect(on.entries[0].allowBonus).toBe(false);
    expect(config.entries[1].generator.allowTradeEvolution).toBe(false);
    expect(setAllTradeEvolution(on, false).entries.every(entry => !entry.generator.allowTradeEvolution)).toBe(true);
  });

  it('enables and disables bonuses without touching trade preferences', () => {
    const on = setAllBonus(config, true);
    expect(on.entries.every(entry => entry.allowBonus)).toBe(true);
    expect(on.entries[0].generator.allowTradeEvolution).toBe(true);
    expect(setAllBonus(on, false).entries.every(entry => !entry.allowBonus)).toBe(true);
  });

  it('locks/unlocks teams in bulk while leaving member locks unchanged', () => {
    const locked = setTeamLocks(result, true);
    expect(locked.teams.every(team => team.locked)).toBe(true);
    const unlocked = setTeamLocks(locked, false);
    expect(unlocked.teams.every(team => !team.locked)).toBe(true);
    expect(unlocked.teams[0].team[0].locked).toBe(true);
    expect(result.teams[0].locked).toBe(false);
  });

  it('clears all region and member locks in one action, keeping candidates', () => {
    const cleared = clearAllLocks(result);
    expect(cleared.teams.every(team => !team.locked && team.team.every(slot => !slot.locked))).toBe(true);
    expect(cleared.teams[0].team[0].candidate).toBe(result.teams[0].team[0].candidate);
    expect(result.teams[0].team[0].locked).toBe(true);
  });
});
