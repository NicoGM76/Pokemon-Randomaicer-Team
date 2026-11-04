import { describe, expect, it } from 'vitest';
import type { Pokemon } from '../domain/pokemon/types';
import { searchPokemon } from './searchPokemon';

const pokemon = [
  { id: 1000, name: 'Gholdengo' },
  { id: 25, name: 'Pikachu' },
  { id: 122, name: 'Mr. Mime' },
  { id: 29, name: 'Nidoran♀' },
  { id: 983, name: 'Kingambit' },
  { id: 1001, name: 'Wo-Chien' },
] as Pokemon[];

describe('competitive searchable species', () => {
  it('finds the late-dex species by normal name, missing letter and dex number', () => {
    expect(searchPokemon(pokemon, 'Gholdengo')[0]?.id).toBe(1000);
    expect(searchPokemon(pokemon, 'goldengo')[0]?.id).toBe(1000);
    expect(searchPokemon(pokemon, '#1000')[0]?.id).toBe(1000);
    expect(searchPokemon(pokemon, '1000')[0]?.id).toBe(1000);
  });

  it('allows partial names, ignores punctuation and respects limit', () => {
    expect(searchPokemon(pokemon, 'pika')[0]?.id).toBe(25);
    expect(searchPokemon(pokemon, 'mr mime')[0]?.id).toBe(122);
    expect(searchPokemon(pokemon, 'wo chien')[0]?.id).toBe(1001);
    expect(searchPokemon(pokemon, 'i', 2).length).toBeLessThanOrEqual(2);
  });

  it('does not show an unfiltered thousand-item suggestion list', () => {
    expect(searchPokemon(pokemon, '')).toEqual([]);
    expect(searchPokemon(pokemon, '   ')).toEqual([]);
    expect(searchPokemon(pokemon, 'somerandommissingname')).toEqual([]);
  });
});
