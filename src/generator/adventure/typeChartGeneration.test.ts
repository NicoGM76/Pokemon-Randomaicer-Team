import { describe, expect, it } from 'vitest';
import { getDefensiveProfile } from './getDefensiveProfile';
import { normalizePokemonTypesForGeneration, pokemonTypesForGeneration, typeMultiplierForGeneration } from './typeChart';

describe('historical type charts', () => {
  it('uses only the fifteen original types in generation I', () => {
    const types = pokemonTypesForGeneration(1);
    expect(types).not.toContain('dark');
    expect(types).not.toContain('steel');
    expect(types).not.toContain('fairy');
    expect(types).toHaveLength(15);
  });

  it('keeps Fairy out through generation V and enables it from generation VI', () => {
    expect(pokemonTypesForGeneration(5)).not.toContain('fairy');
    expect(pokemonTypesForGeneration(6)).toContain('fairy');
  });

  it('applies key generation I matchup differences', () => {
    expect(typeMultiplierForGeneration('ghost', 'psychic', 1)).toBe(0);
    expect(typeMultiplierForGeneration('bug', 'poison', 1)).toBe(2);
    expect(typeMultiplierForGeneration('poison', 'bug', 1)).toBe(2);
    expect(typeMultiplierForGeneration('ice', 'fire', 1)).toBe(1);
  });

  it('applies Steel resistance to Ghost and Dark through generation V only', () => {
    expect(typeMultiplierForGeneration('ghost', 'steel', 5)).toBe(.5);
    expect(typeMultiplierForGeneration('dark', 'steel', 5)).toBe(.5);
    expect(typeMultiplierForGeneration('ghost', 'steel', 6)).toBe(1);
    expect(typeMultiplierForGeneration('dark', 'steel', 6)).toBe(1);
  });

  it('normalizes later-added typings for historical scoring', () => {
    expect(normalizePokemonTypesForGeneration(['normal', 'fairy'], 5)).toEqual(['normal']);
    expect(normalizePokemonTypesForGeneration(['electric', 'steel'], 1)).toEqual(['electric']);
    expect(getDefensiveProfile(['psychic', 'fairy'], 5).weaknesses).not.toContain('steel');
  });
});
