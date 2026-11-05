import { describe, expect, it } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import type { MetaSnapshot } from './types';
import { analyzeMetaMatchup, isMetaSnapshot } from './matchups';

const mon = (id: number, name: string, types: Pokemon['types']): Pokemon => ({
  id, name, types, introducedGeneration: 9,
  evolutionFamilyId: 'family-' + id,
  stats: { hp: 80, attack: 90, defense: 80, specialAttack: 95, specialDefense: 90, speed: 100 },
  specialTags: [], isPseudoLegendary: false, isFossil: false, isStarter: false
});

const catalog = [
  mon(1, 'Test Fire', ['fire']),
  mon(2, 'Test Grass', ['grass']),
  mon(3, 'Test Water', ['water']),
  mon(4, 'Test Ground', ['ground']),
  mon(5, 'Test Flying', ['flying'])
];

describe('meta matchup explanation', () => {
  it('counts threatening STAB and favorable type pressure without win-rate claims', () => {
    const breakdown = analyzeMetaMatchup([1, 2, 4], 3, catalog);
    expect(breakdown.threatened).toEqual([1,4]);
    expect(breakdown.offensiveAnswers).toEqual([2]);
    expect(breakdown.checkedMembers).toBe(3);
    expect('winProbability' in breakdown).toBe(false);
  });

  it('checks all six Champions doubles members against a metagame opponent using base typings only', () => {
    const champions = [
      mon(448, 'Lucario', ['fighting', 'steel']),
      mon(373, 'Salamence', ['dragon', 'flying']),
      mon(812, 'Rillaboom', ['grass']),
      mon(727, 'Incineroar', ['fire', 'dark']),
      mon(479, 'Rotom Wash', ['electric', 'water']),
      mon(279, 'Pelipper', ['water', 'flying']),
      mon(382, 'Kyogre', ['water'])
    ];
    const result = analyzeMetaMatchup([448, 373, 812, 727, 479, 279], 382, champions);
    expect(result.checkedMembers).toBe(6);
    expect(result.threatened).toContain(727);
    expect(result.offensiveAnswers).toEqual(expect.arrayContaining([812, 479]));
    expect('winProbability' in result).toBe(false);
  });

  it('ignores unknown opponents and unmatched members safely', () => {
    expect(analyzeMetaMatchup([1, 999], 999, catalog).checkedMembers).toBe(0);
    expect(analyzeMetaMatchup([999, 2], 1, catalog).checkedMembers).toBe(1);
  });
});

describe('source snapshot validation', () => {
  const snapshot: MetaSnapshot = {
    schemaVersion: 1, status: 'ready', format: 'singles',
    label: 'Gen 9 OU', description: 'Example',
    droppedSpecies: 3,
    source: {
      organization: 'Smogon / Pokémon Showdown', kind: 'ladder',
      month: '2026-09', ladderId: 'gen9ou', cutoff: 1695,
      battles: 10000,
      url: 'https://www.smogon.com/stats/2026-09/chaos/gen9ou-1695.json'
    },
    pokemon: [
      { pokemonId: 1, usagePercent: 30.5, moves: ['Flamethrower'], items: ['Leftovers'],
        abilities: ['Blaze'], teammates: [2] }
    ]
  };
  it('accepts trusted numeric source shapes and rejects invented or malformed usage', () => {
    expect(isMetaSnapshot(snapshot, 'singles')).toBe(true);
    expect(isMetaSnapshot({ ...snapshot, pokemon: [{ ...snapshot.pokemon[0], usagePercent: 600 }] }, 'singles')).toBe(false);
    expect(isMetaSnapshot({ ...snapshot, format: 'doubles' }, 'singles')).toBe(false);
    expect(isMetaSnapshot({ ...snapshot, source: { ...snapshot.source, kind: 'tournament' } }, 'singles')).toBe(false);
    expect(isMetaSnapshot({ ...snapshot, source: { ...snapshot.source, url: 'javascript:alert(1)' } }, 'singles')).toBe(false);
  });
});
