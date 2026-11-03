/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import MetaInsightsPanel from './MetaInsightsPanel';

const pokemon = [
  { id: 1, name: 'Fire Pet', types: ['fire'] },
  { id: 2, name: 'Grass Pet', types: ['grass'] },
  { id: 3, name: 'Water Pet', types: ['water'] },
  { id: 4, name: 'Ground Pet', types: ['ground'] }
] as Pokemon[];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('V2.2 browser meta panel', () => {
  it('shows real source metadata and explains typed matchups without win probabilities', async () => {
    const fixture = {
      schemaVersion: 1, status: 'ready', format: 'singles',
      label: 'Singles · Gen 9 OU', description: 'OU ladder', droppedSpecies: 0,
      source: {
        organization: 'Smogon / Pokémon Showdown', kind: 'ladder',
        month: '2026-09', ladderId: 'gen9ou', cutoff: 1695, battles: 56789,
        url: 'https://www.smogon.com/stats/2026-09/chaos/gen9ou-1695.json'
      },
      pokemon: [
        { pokemonId: 3, usagePercent: 31.4, moves: ['Surf', 'Ice Beam'],
          items: ['Leftovers'], abilities: ['Water Absorb'], teammates: [2] }
      ]
    };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture });
    vi.stubGlobal('fetch', fetcher);
    render(<MetaInsightsPanel format="singles" pokemon={pokemon} teamIds={[1, 2, 4]} showLearning={true} />);
    expect(await screen.findByText('2026-09')).toBeTruthy();
    expect(screen.getByText('Singles · Gen 9 OU')).toBeTruthy();
    expect(screen.getByText(/56.789 combates/)).toBeTruthy();
    expect(screen.getByText(/31,4% de uso ponderado/)).toBeTruthy();
    expect(screen.getByText('2 / 3')).toBeTruthy();
    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(screen.queryByText(/probabilidad de victoria/i)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toMatch(/meta\/singles\.json/);
  });

  it('shows an honest unavailable state and does not invent values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ schemaVersion: 1, status: 'unavailable', format: 'doubles', message: 'Aún sin snapshot verificado.' })
    }));
    render(<MetaInsightsPanel format="doubles" pokemon={pokemon} teamIds={[]} showLearning={false} />);
    expect(await screen.findByText('Aún sin snapshot verificado.')).toBeTruthy();
    expect(screen.queryByText(/de uso ponderado/)).toBeNull();
  });
});
