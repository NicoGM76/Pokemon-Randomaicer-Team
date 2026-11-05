import { describe, expect, it } from 'vitest';
import type { MetaSnapshot } from './types';
import { compareMetaSnapshots } from './history';

const sample = (
  month: string, values: [number, number][], format: MetaSnapshot['format'] = 'singles',
  ladderId = 'gen9ou', cutoff = 1695
): MetaSnapshot => ({
  schemaVersion: 1, status: 'ready', format,
  label: 'Sample', description: 'Testing', droppedSpecies: 0,
  source: {
    organization: 'Smogon / Pokémon Showdown',
    kind: 'ladder', month, ladderId, cutoff, battles: 1500,
    url: 'https://www.smogon.com/stats/' + month + '/chaos/' + ladderId + '-' + cutoff + '.json'
  },
  pokemon: values.map(([pokemonId, usagePercent]) => ({
    pokemonId, usagePercent, moves: [], items: [], abilities: [], teammates: []
  }))
});

describe('V2.4 monthly metagame comparison', () => {
  it('calculates percentage-point trends for shared species only', () => {
    const before = sample('2026-09', [[1, 10.5], [2, 30.5], [3, 5]]);
    const after = sample('2026-10', [[1, 12], [2, 25.25], [4, 5]]);
    const comparison = compareMetaSnapshots(after, before);
    expect(comparison.changes).toEqual([
      { pokemonId: 1, previousUsage: 10.5, currentUsage: 12, changePoints: 1.5,
        previousRank: 1, currentRank: 1 },
      { pokemonId: 2, previousUsage: 30.5, currentUsage: 25.25, changePoints: -5.25,
        previousRank: 2, currentRank: 2 }
    ]);
    expect(comparison.newToSample).toBe(1);
    expect(comparison.noLongerInSample).toBe(1);
    expect(comparison.changes.find(row => row.pokemonId === 4)).toBeUndefined();
    expect(comparison).not.toHaveProperty('winProbability');
  });

  it('rejects mixed formats, regulations, cutoffs, and invalid month order', () => {
    const current = sample('2026-10', [[1, 20]]);
    expect(() => compareMetaSnapshots(current, sample('2026-09', [[1, 10]], 'doubles')))
      .toThrow(/formatos/);
    expect(() => compareMetaSnapshots(current, sample('2026-09', [[1, 10]], 'singles', 'other')))
      .toThrow(/formatos/);
    expect(() => compareMetaSnapshots(current, sample('2026-09', [[1, 10]], 'singles', 'gen9ou', 1500)))
      .toThrow(/formatos/);
    expect(() => compareMetaSnapshots(current, sample('2026-10', [[1, 10]])))
      .toThrow(/anterior/);
    expect(() => compareMetaSnapshots(current, sample('2026-11', [[1, 10]])))
      .toThrow(/anterior/);
  });

  it('supports gaps without claiming an unavailable intermediate month existed', () => {
    const comparison = compareMetaSnapshots(sample('2026-10', [[1, 2]]), sample('2026-07', [[1, 3]]));
    expect(comparison.olderMonth).toBe('2026-07');
    expect(comparison.newerMonth).toBe('2026-10');
    expect(comparison.changes[0].changePoints).toBe(-1);
  });
});
