import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearProfileCache, getPokemonProfile, optionNames } from './pokemonProfile';

beforeEach(() => clearProfileCache());

describe('species-restricted PokeAPI assist', () => {
  it('filters abilities for Pikachu and excludes Intimidate', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('/pokemon-species/')
        ? { varieties: [
          { is_default: true, pokemon: { name: 'pikachu', url: '/api/v2/pokemon/25/' } }
        ] }
        : {
          name: 'pikachu', abilities: [
            { ability: { name: 'static' }, is_hidden: false },
            { ability: { name: 'lightning-rod' }, is_hidden: true }
          ],
          moves: [
            { move: { name: 'thunderbolt' }, version_group_details: [{ version_group: { name: 'scarlet-violet' } }] },
            { move: { name: 'old-move' }, version_group_details: [{ version_group: { name: 'red-blue' } }] }
          ]
        }
    }));
    const profile = await getPokemonProfile(25, undefined, fetcher);
    expect(profile.abilities).toEqual(['static','lightning-rod']);
    expect(profile.abilities).not.toContain('intimidate');
    expect(profile.scarletVioletMoves).toEqual(['thunderbolt']);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect((await getPokemonProfile(25, undefined, fetcher)).abilities).toContain('static');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('looks up abilities of selected Mega form instead of reusing base abilities', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('/pokemon-species/')
        ? { varieties: [{ pokemon: { name: 'charizard-mega-x' } }] }
        : url.includes('charizard-mega-x')
          ? { name: 'charizard-mega-x', abilities: [{ ability: { name: 'tough-claws' } }], moves: [] }
          : { name: 'charizard', abilities: [{ ability: { name: 'blaze' } }], moves: [] }
    }));
    const profile = await getPokemonProfile(6, 'charizard-mega-x', fetcher);
    expect(profile.abilities).toEqual(['tough-claws']);
  });

  it('handles unavailable data explicitly and has no invented suggestions', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(getPokemonProfile(25, undefined, fetcher)).rejects.toThrow(/503/);
    expect(optionNames([],'attack')).toEqual([]);
  });
  it('provides curated Aura Guard for Mega Lucario Z even when PokeAPI has no Z variety', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('/pokemon-species/')
        ? { varieties: [{ pokemon: { name: 'lucario' } }, { pokemon: { name: 'lucario-mega' } }] }
        : {
          abilities: [{ ability: { name: 'inner-focus' } }],
          moves: [{ move: { name: 'aura-sphere' },
            version_group_details: [{ version_group: { name: 'scarlet-violet' } }] }]
        }
    }));
    const original = await getPokemonProfile(448, undefined, fetcher);
    expect(original.abilities).toEqual(['inner-focus']);
    // Form-specific data must not be replaced by the cached base species.
    const profile = await getPokemonProfile(448, 'lucario-mega-z', fetcher);
    expect(profile.abilities).toEqual(['aura-guard']);
    expect(profile.scarletVioletMoves).toContain('aura-sphere');
    expect(profile.source).toContain('champions-news.pokemon-home.com');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/pokemon/lucario-mega-z'))).toBe(false);
    expect((await getPokemonProfile(448, 'lucario-mega-z', fetcher)).abilities).toEqual(['aura-guard']);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

});
