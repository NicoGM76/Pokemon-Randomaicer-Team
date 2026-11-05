/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pokemon } from '../../domain/pokemon/types';
import type { MetaSnapshot } from './types';
import MetaHistoryComparisonPanel from './MetaHistoryComparisonPanel';

const mons = [{ id: 1, name: 'alpha', types: ['grass'] }, { id: 2, name: 'beta', types: ['fire'] }] as Pokemon[];
const fixture = (month: string, first: number, second: number, cutoff = 1695): MetaSnapshot => ({
  schemaVersion: 1, status: 'ready', format: 'singles', label: 'Singles OU',
  description: 'Ladder', droppedSpecies: 0,
  source: {
    organization: 'Smogon / Pokémon Showdown', kind: 'ladder', month,
    ladderId: 'gen9ou', cutoff, battles: 1234,
    url: 'https://www.smogon.com/stats/' + month + '/chaos/gen9ou-' + cutoff + '.json'
  },
  pokemon: [
    { pokemonId: 1, usagePercent: first, moves: [], abilities: [], items: [], teammates: [] },
    { pokemonId: 2, usagePercent: second, moves: [], abilities: [], items: [], teammates: [] }
  ]
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('V2.4 history panel', () => {
  it('shows sourced trends only when both snapshots match', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true, json: async () => fixture('2026-09', 10, 20)
    });
    vi.stubGlobal('fetch', fetcher);
    render(<MetaHistoryComparisonPanel format="singles"
      snapshot={fixture('2026-10', 15, 14)} pokemon={mons} />);
    expect(await screen.findByText('2026-09 frente a 2026-10')).toBeTruthy();
    expect(screen.getByText('+5 pp')).toBeTruthy();
    expect(screen.getByText('-6 pp')).toBeTruthy();
    expect(screen.getByText(/no equivale a 0% de uso/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Abrir fuente del mes anterior/ })
      .getAttribute('href')).toContain('2026-09');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toMatch(/meta\/singles-previous\.json/);
  });

  it('refuses to compare rating cutoffs that differ', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => fixture('2026-09', 10, 20, 1500)
    }));
    render(<MetaHistoryComparisonPanel format="singles"
      snapshot={fixture('2026-10', 15, 14)} pokemon={mons} />);
    expect(await screen.findByText(/No se pueden comparar formatos/i)).toBeTruthy();
    expect(screen.queryByText('+5 pp')).toBeNull();
  });

  it('shows a safe unavailable message when second month is not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    render(<MetaHistoryComparisonPanel format="singles"
      snapshot={fixture('2026-10', 15, 14)} pokemon={mons} />);
    expect(await screen.findByText(/No hay un histórico disponible/i)).toBeTruthy();
    expect(screen.queryByText('+5 pp')).toBeNull();
  });
});
