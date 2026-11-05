import { describe, expect, it } from 'vitest';
import terms from './generated/pokemonTerms.json';
import {
  canonicalMoveName, pokemonAbilityName, pokemonMoveName, pokemonNatureName
} from './pokemonTerms';

describe('regional Pokémon terminology for global language selector', () => {
  it('includes entire official localized move and nature catalogs', () => {
    expect(Object.keys(terms.moves).length).toBeGreaterThanOrEqual(900);
    expect(Object.keys(terms.abilities).length).toBeGreaterThanOrEqual(300);
    expect(Object.keys(terms.natures)).toHaveLength(25);
  });

  it('distinguishes official Latin American and Spanish-Spain names', () => {
    expect(pokemonMoveName('aura-sphere', 'es-419')).toBe('Aura Esfera');
    expect(pokemonMoveName('Aura Sphere', 'es-ES')).toBe('Esfera Aural');
    expect(pokemonMoveName('Aerial Ace', 'es-419')).toBe('As Aéreo');
    expect(pokemonMoveName('Aerial Ace', 'es-ES')).toBe('Golpe Aéreo');
    expect(pokemonMoveName('brick-break', 'es-419')).toBe('Karatazo');
    expect(pokemonMoveName('brick-break', 'es-ES')).toBe('Demolición');
    expect(pokemonMoveName('Thunderbolt', 'es-419')).toBe('Atactrueno');
    expect(pokemonMoveName('Thunderbolt', 'es-ES')).toBe('Rayo');
  });

  it('converts stored English and either Spanish region to same canonical move', () => {
    for (const alias of ['Aura Sphere', 'aura-sphere', 'Esfera Aural', 'Aura Esfera']) {
      expect(canonicalMoveName(alias)).toBe('Aura Sphere');
    }
    expect(pokemonMoveName('Aura Esfera', 'es-ES')).toBe('Esfera Aural');
    expect(pokemonMoveName('Made Up Move', 'es-419')).toBe('Made Up Move');
  });

  it('localizes abilities, Mega Z ability fallback and natures', () => {
    expect(pokemonAbilityName('Static', 'es-419')).toBe('Electricidad Estática');
    expect(pokemonAbilityName('aura-guard', 'es-419')).toBe('Aura Protectora');
    expect(pokemonAbilityName('Levitate', 'es-ES')).toBe('Levitación');
    expect(pokemonNatureName('Timid', 'es-ES')).toBe('Miedosa');
    expect(pokemonNatureName('Jolly', 'es-419')).toBe('Alegre');
  });
});
