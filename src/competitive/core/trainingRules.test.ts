import { describe, expect, it } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import { championsPointsFromEVs, getTrainingRules, applyFormSelection, pointsFor, megaOptions } from './trainingRules';
import { createManualSet } from './teamBuilder';
import { validateCompetitiveTeam } from './validation';

const pokemon = { id: 6, name: 'Charizard', stats: {
  hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100
}, types: ['fire','flying'] } as Pokemon;

describe('mainline vs Champions training', () => {
  it('uses 510 EVs and 31 IVs in Scarlet/Violet, and 66 PC without editable IVs in Champions', () => {
    expect(getTrainingRules('mainline')).toEqual({ statMax: 252, totalMax: 510, label: 'EVs', usesIVs: true, canTera: true, canMega: false });
    expect(getTrainingRules('champions')).toEqual({ statMax: 32, totalMax: 66, label: 'PC', usesIVs: false, canTera: false, canMega: true });
    const set = createManualSet(pokemon);
    expect(pointsFor(set, 'champions').specialAttack).toBe(32);
    expect(pointsFor(set, 'champions').speed).toBe(32);
    expect(pointsFor(set, 'mainline')).toEqual(set.evs);
    expect(championsPointsFromEVs(set.evs).hp).toBe(1);
  });

  it('preserves original EVs when custom Champions points are edited', () => {
    const set = createManualSet(pokemon);
    const custom = { ...set, championsPoints: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 } };
    expect(pointsFor(custom, 'champions').hp).toBe(2);
    expect(pointsFor(custom, 'mainline').hp).toBe(4);
  });

  it('autoequips correct Mega Stone and blocks other items only in Champions', () => {
    const set = createManualSet(pokemon);
    const mega = applyFormSelection(set, 'charizard-mega-x', 'champions');
    expect(mega.formId).toBe('charizard-mega-x');
    expect(mega.item).toBe('Charizardite X');
    expect(validateCompetitiveTeam('doubles', [mega], 'champions').some(issue => issue.code === 'mega_stone')).toBe(false);
    expect(validateCompetitiveTeam('doubles', [{ ...mega, item: 'Leftovers' }], 'champions')
      .some(issue => issue.code === 'mega_stone')).toBe(true);
    expect(validateCompetitiveTeam('singles', [mega], 'mainline')
      .some(issue => issue.code === 'incompatible_mega')).toBe(true);
  });

  it('validates Champions 32/66 separately from EVs 252/510', () => {
    const set = createManualSet(pokemon);
    const invalid = { ...set, championsPoints: {
      hp: 3, attack: 0, defense: 0, specialAttack: 33, specialDefense: 0, speed: 32
    }};
    const errors = validateCompetitiveTeam('doubles', [invalid], 'champions');
    expect(errors.some(issue => issue.code === 'stat_per_stat')).toBe(true);
    expect(errors.some(issue => issue.code === 'stat_total')).toBe(true);
    expect(validateCompetitiveTeam('singles', [set], 'mainline')
      .some(issue => issue.code === 'ev_total')).toBe(false);
  });
  it('offers both Mega Lucario forms in Champions and assigns the distinct Z stone', () => {
    const lucario = createManualSet({ ...pokemon, id: 448, name: 'Lucario' } as Pokemon);
    const options = megaOptions(448, 'champions');
    expect(options.map(option => option.id)).toEqual(['lucario-mega', 'lucario-mega-z']);
    const megaZ = applyFormSelection(lucario, 'lucario-mega-z', 'champions');
    expect(megaZ.item).toBe('Lucarionite Z');
    expect(megaZ.formId).toBe('lucario-mega-z');
    expect(validateCompetitiveTeam('doubles', [megaZ], 'champions')
      .some(issue => issue.code === 'mega_stone')).toBe(false);
    expect(validateCompetitiveTeam('doubles', [{ ...megaZ, item: 'Lucarionite' }], 'champions')
      .some(issue => issue.code === 'mega_stone')).toBe(true);
    expect(megaOptions(448, 'mainline')).toEqual([]);
  });

});
