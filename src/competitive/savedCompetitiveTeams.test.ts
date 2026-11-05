/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyWorkspace, loadCompetitiveDraft, saveCompetitiveDraft } from './competitiveDraft';
import type { CompetitivePokemonSet } from './core/types';
import {
  COMPETITIVE_SAVED_TEAMS_KEY, SavedCompetitiveTeamRepository,
  restoreCompetitiveTeam, type SavedCompetitiveTeam
} from './savedCompetitiveTeams';

const zero = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
const thirtyOne = { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 };

const lucario: CompetitivePokemonSet = {
  pokemonId: 448,
  role: 'special',
  nature: 'Timid',
  ability: 'Aura Guard',
  item: 'Lucarionite Z',
  formId: 'lucario-mega-z',
  locked: true,
  moves: ['Aura Sphere', 'Flash Cannon', 'Dark Pulse', 'Protect'],
  championsPoints: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 },
  evs: { ...zero, specialAttack: 252, speed: 252, hp: 4 },
  ivs: thirtyOne
};

function team(id = 'saved-champions', format: SavedCompetitiveTeam['format'] = 'doubles'): SavedCompetitiveTeam {
  return {
    id, name: 'Dobles doble Mega',
    createdAt: '2026-11-05T13:00:00Z',
    format, environment: 'champions',
    team: [lucario, null, null, null, null, null]
  };
}

beforeEach(() => localStorage.clear());

describe('named competitive saved teams', () => {
  it('stores complete moves, Mega form, item, nature, PC, EV, IV and locked state across reloads', () => {
    const repository = new SavedCompetitiveTeamRepository();
    expect(repository.save(team())).toBe(true);
    const loaded = new SavedCompetitiveTeamRepository().getAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].format).toBe('doubles');
    expect(loaded[0].environment).toBe('champions');
    expect(loaded[0].team[0]).toEqual(lucario);
    expect(loaded[0].team).toHaveLength(6);

    // Named slots have independent snapshots; updating a set doesn't overwrite saved data.
    const updated = { ...team(), name: 'Versión 2' };
    expect(repository.save(updated)).toBe(true);
    expect(repository.getAll()).toHaveLength(1);
    expect(repository.getAll()[0].name).toBe('Versión 2');

    expect(repository.save(team('second', 'singles'))).toBe(true);
    expect(repository.getAll()).toHaveLength(2);
    expect(repository.delete('saved-champions')).toBe(true);
    expect(repository.getAll().map(value => value.id)).toEqual(['second']);
  });

  it('restores the selected competitive format without losing the other format', () => {
    const workspace = createEmptyWorkspace();
    workspace.format = 'singles';
    workspace.selectedSlot = 4;
    workspace.teams.singles[0] = {
      ...lucario, pokemonId: 25, formId: undefined,
      item: 'Light Ball', locked: false
    };
    workspace.environmentByFormat = { singles: 'mainline', doubles: 'mainline' };
    saveCompetitiveDraft(workspace);

    const restored = restoreCompetitiveTeam(team());
    expect(restored.format).toBe('doubles');
    expect(restored.selectedSlot).toBe(0);
    expect(restored.environmentByFormat).toEqual({ singles: 'mainline', doubles: 'champions' });
    expect(restored.teams.doubles[0]).toEqual(lucario);
    expect(restored.teams.singles[0]?.pokemonId).toBe(25);

    const loaded = loadCompetitiveDraft();
    expect(loaded.teams.doubles[0]).toEqual(lucario);
    expect(loaded.teams.singles[0]?.pokemonId).toBe(25);
    expect(loaded.teams.doubles).toHaveLength(6);
  });

  it('rejects malformed saved data and reports local storage failures', () => {
    localStorage.setItem(COMPETITIVE_SAVED_TEAMS_KEY, JSON.stringify([
      team(), { ...team('broken'), team: [null] }, { ...team('bad-name'), name: ' ' }
    ]));
    expect(new SavedCompetitiveTeamRepository().getAll()).toHaveLength(1);
    const noStorage = new SavedCompetitiveTeamRepository({
      getItem: () => null,
      setItem: () => { throw new Error('Storage quota exceeded'); }
    });
    expect(noStorage.save(team())).toBe(false);
    expect(noStorage.delete('any')).toBe(false);
    expect(noStorage.getAll()).toEqual([]);
    expect(restoreCompetitiveTeam({ ...team(), team: [] }, createEmptyWorkspace()).teams.doubles)
      .toHaveLength(6);
  });
});
