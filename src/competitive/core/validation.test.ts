import { describe, expect, it } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import { createManualSet } from './teamBuilder';
import { validateCompetitiveTeam } from './validation';
import { analyzeCompetitiveTeam } from './analysis';

const pokemon = (id: number, types: Pokemon['types']): Pokemon => ({
  id, name: 'p-' + id, types, introducedGeneration: 9,
  evolutionFamilyId: String(id), specialTags: [], isPseudoLegendary: false,
  isFossil: false, isStarter: false,
  stats: { hp: 80, attack: 90, defense: 80, specialAttack: 110, specialDefense: 90, speed: 100 }
});

const completed = (id: number) => ({
  ...createManualSet(pokemon(id, ['water'])),
  ability: 'Example ability', item: 'Item-' + id,
  moves: ['Move A', 'Move B', 'Move C', 'Move D'] as [string,string,string,string]
});

describe('competitive validation', () => {
  it('rejects out-of-range EVs, total EVs and IVs', () => {
    const invalid = {
      ...completed(1),
      evs: { hp: 252, attack: 252, defense: 252, specialAttack: 0, specialDefense: 0, speed: 0 },
      ivs: { hp: 31, attack: 32, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 }
    };
    const issues = validateCompetitiveTeam('singles', [invalid]);
    expect(issues.some(issue => issue.code === 'ev_per_stat')).toBe(true);
    expect(issues.some(issue => issue.code === 'ev_total')).toBe(true);
    expect(issues.some(issue => issue.code === 'iv_range')).toBe(true);
  });

  it('rejects duplicates of species in both formats and items only in doubles', () => {
    const first = completed(1);
    const duplicate = { ...completed(1), item: first.item };
    expect(validateCompetitiveTeam('singles', [first, duplicate]).some(issue => issue.code === 'duplicate_species')).toBe(true);
    expect(validateCompetitiveTeam('singles', [first, { ...completed(2), item: first.item }]).some(issue => issue.code === 'duplicate_item')).toBe(false);
    expect(validateCompetitiveTeam('doubles', [first, { ...completed(2), item: first.item }]).some(issue => issue.code === 'duplicate_item')).toBe(true);
  });

  it('warns about incomplete moves and slots without pretending legality was verified', () => {
    const issues = validateCompetitiveTeam('singles', [createManualSet(pokemon(1, ['fire'])), null]);
    expect(issues.some(issue => issue.code === 'missing_moves')).toBe(true);
    expect(issues.some(issue => issue.code === 'incomplete_team')).toBe(true);
  });
});

describe('competitive education analysis', () => {
  it('counts shared defensive type weaknesses without invented win probabilities', () => {
    const p1 = pokemon(1, ['fire']);
    const p2 = pokemon(2, ['fire', 'flying']);
    const team = [completed(1), completed(2)];
    const analysis = analyzeCompetitiveTeam(team, [p1, p2]);
    expect(analysis.sharedWeaknesses.some(entry => entry.type === 'water' && entry.count === 2)).toBe(true);
    expect(analysis.roleCounts.special).toBe(2);
    expect('winProbability' in analysis).toBe(false);
  });
});
