/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyWorkspace, loadCompetitiveDraft, saveCompetitiveDraft, COMPETITIVE_DRAFT_KEY } from './competitiveDraft';

beforeEach(() => localStorage.clear());

describe('competitive dual-format draft', () => {
  it('persists separate Singles and Doubles teams without losing manual edits', () => {
    const workspace = createEmptyWorkspace();
    workspace.teams.singles[0] = {
      pokemonId: 25, role: 'special', nature: 'Timid',
      ability: 'Static', item: 'Light Ball',
      moves: ['Thunderbolt', '', '', ''],
      evs: { hp: 4, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 },
      ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
      locked: true
    };
    workspace.format = 'doubles';
    saveCompetitiveDraft(workspace);
    const restored = loadCompetitiveDraft();
    expect(restored.format).toBe('doubles');
    expect(restored.teams.singles[0]).toEqual(workspace.teams.singles[0]);
    expect(restored.teams.doubles.every(member => member === null)).toBe(true);
  });

  it('rejects malformed or old drafts and starts safely', () => {
    localStorage.setItem(COMPETITIVE_DRAFT_KEY, '{corrupt');
    expect(loadCompetitiveDraft().teams.singles).toHaveLength(6);
    localStorage.setItem(COMPETITIVE_DRAFT_KEY, JSON.stringify({ version: 999, value: createEmptyWorkspace() }));
    expect(loadCompetitiveDraft().teams.singles.every(slot => slot === null)).toBe(true);
    localStorage.setItem(COMPETITIVE_DRAFT_KEY, JSON.stringify({
      version: 1, value: { ...createEmptyWorkspace(), teams: { singles: ['broken'], doubles: [] } }
    }));
    expect(loadCompetitiveDraft().teams.singles).toHaveLength(6);
    expect(loadCompetitiveDraft().teams.singles[0]).toBeNull();
  });
});
