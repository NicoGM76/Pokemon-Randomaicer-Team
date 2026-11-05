/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RootApp from '../RootApp';
import { SavedCompetitiveTeamRepository } from './savedCompetitiveTeams';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('V2.1 competitive interactive workspace', () => {
  it('generates Singles, keeps it while visiting Doubles and restores after remount', async () => {
    window.location.hash = '#/competitive';
    const view = render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Generar equipo de ejemplo' }));
    expect(await screen.findByText('6 / 6 Pokémon')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dobles estilo VGC' }));
    expect(screen.getByText('0 / 6 Pokémon')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Singles 6v6' }));
    expect(screen.getByText('6 / 6 Pokémon')).toBeTruthy();

    view.unmount();
    render(<RootApp />);
    expect(await screen.findByText('6 / 6 Pokémon')).toBeTruthy();
  });

  it('does not fetch metagame data until the user opens V2.2', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        schemaVersion: 1, status: 'unavailable', format: 'singles',
        message: 'Aún sin datos en esta instalación.'
      })
    });
    vi.stubGlobal('fetch', fetcher);
    window.location.hash = '#/competitive';
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ver metagame y matchups' }));
    expect(await screen.findByText('Aún sin datos en esta instalación.')).toBeTruthy();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toMatch(/meta\/singles\.json/);
  });

  it('finds Gholdengo by Goldengo and preserves its set after reloading', async () => {
    window.location.hash = '#/competitive';
    const view = render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' }), {
      target: { value: 'Goldengo' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Elegir Gholdengo número 1000' }));
    expect(screen.getByRole('button', { name: 'Editar espacio 1' }).textContent).toContain('Gholdengo');

    fireEvent.change(screen.getByLabelText('Movimiento 1'), { target: { value: 'Make It Rain' } });
    view.unmount();
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar espacio 1' }).textContent).toContain('Gholdengo');
    expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Fiebre Dorada');
  });

  it('edits a manual species and keeps its move after leaving the page', async () => {
    window.location.hash = '#/competitive';
    const view = render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    const pokemonSearch = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(pokemonSearch, { target: { value: '#25' } });
    fireEvent.keyDown(pokemonSearch, { key: 'Enter', code: 'Enter' });
    fireEvent.change(screen.getByLabelText('Movimiento 1'), { target: { value: 'Thunderbolt' } });
    await waitFor(() => expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Atactrueno'));
    view.unmount();
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Atactrueno');
  });
  it('updates roster art and form label for Mega-Salamence, Mega-Lucario Z and Rotom Lavado, including reload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => String(url).includes('/pokemon-species/')
        ? { varieties: [
          { pokemon: { name: 'salamence' } }, { pokemon: { name: 'salamence-mega' } },
          { pokemon: { name: 'lucario' } }, { pokemon: { name: 'rotom' } },
          { pokemon: { name: 'rotom-wash' } }
        ] }
        : { abilities: [{ ability: { name: 'intimidate' } }], moves: [] }
    })));
    window.location.hash = '#/competitive';
    const view = render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pokémon Champions' }));

    function selectSpecies(id: number) {
      const search = screen.getAllByRole('searchbox', {
        name: 'Buscar Pokémon por nombre o número'
      }).at(-1)!;
      fireEvent.change(search, { target: { value: '#' + id } });
      fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });
    }
    function expectCard(slot: number, name: string, artworkId: number) {
      const card = screen.getByRole('button', { name: 'Editar espacio ' + slot });
      expect(card.textContent).toContain(name);
      expect(card.querySelector('img')?.getAttribute('src')).toContain('/' + artworkId + '.png');
    }

    selectSpecies(373);
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'salamence-mega' }
    });
    expectCard(1, 'Mega-Salamence', 10089);

    fireEvent.click(screen.getByRole('button', { name: 'Editar espacio 2' }));
    selectSpecies(448);
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'lucario-mega-z' }
    });
    expectCard(2, 'Mega-Lucario Z', 10310);

    fireEvent.click(screen.getByRole('button', { name: 'Editar espacio 3' }));
    selectSpecies(479);
    expect(await screen.findByRole('option', { name: /Rotom Wash · forma de referencia/ })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'rotom-wash' }
    });
    expectCard(3, 'Rotom Lavado', 10009);
    expectCard(1, 'Mega-Salamence', 10089);

    view.unmount();
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expectCard(1, 'Mega-Salamence', 10089);
    expectCard(2, 'Mega-Lucario Z', 10310);
    expectCard(3, 'Rotom Lavado', 10009);
  });

  it('never duplicates species search controls across all six roster spaces', async () => {
    window.location.hash = '#/competitive';
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();

    function expectOnlyOneSearch() {
      expect(screen.getAllByRole('searchbox', {
        name: 'Buscar Pokémon por nombre o número'
      })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: 'Explorar Pokédex completa' })).toHaveLength(1);
      expect(screen.queryByLabelText('Pokémon del espacio seleccionado')).toBeNull();
    }

    expectOnlyOneSearch();
    for (let slot = 1; slot <= 6; slot++) {
      fireEvent.click(screen.getByRole('button', { name: 'Editar espacio ' + slot }));
      expectOnlyOneSearch();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Explorar Pokédex completa' }));
    expect(screen.getAllByLabelText('Pokémon del espacio seleccionado')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Editar espacio 2' }));
    expectOnlyOneSearch();
    fireEvent.click(screen.getByRole('button', { name: 'Dobles estilo VGC' }));
    expectOnlyOneSearch();
    fireEvent.click(screen.getByRole('button', { name: 'Singles 6v6' }));
    expectOnlyOneSearch();
  });

  it('opens verified V2.2 matchups without losing the competitive editor', async () => {
    const fixture = {
      schemaVersion: 1, status: 'ready', format: 'singles',
      label: 'Singles · Gen 9 OU', description: 'OU ladder', droppedSpecies: 0,
      source: {
        organization: 'Smogon / Pokémon Showdown', kind: 'ladder',
        month: '2026-10', ladderId: 'gen9ou', cutoff: 1695, battles: 56789,
        url: 'https://www.smogon.com/stats/2026-10/chaos/gen9ou-1695.json'
      },
      pokemon: [{ pokemonId: 6, usagePercent: 20.5, moves: ['Flamethrower'],
        items: ['Leftovers'], abilities: ['Blaze'], teammates: [] }]
    };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture });
    vi.stubGlobal('fetch', fetcher);
    window.location.hash = '#/competitive';
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ver metagame y matchups' }));
    expect(await screen.findByText('Singles · Gen 9 OU')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Metagame y matchups' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Pokémon rival para analizar' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Espacio 1' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('saves named Singles and Champions Doubles teams separately, including incomplete valid rosters', async () => {
    window.location.hash = '#/competitive';
    const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('Mi Singles')
      .mockReturnValueOnce('Dobles Champions');
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar equipo' }));
    expect(screen.getByText('Añade al menos un Pokémon antes de guardar el equipo.')).toBeTruthy();
    expect(prompt).not.toHaveBeenCalled();

    const search = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(search, { target: { value: '#25' } });
    fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('button', { name: 'Editar espacio 1' }).textContent).toContain('Pikachu');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar equipo' }));
    expect(screen.getByText(/Equipo competitivo guardado/)).toBeTruthy();
    expect(new SavedCompetitiveTeamRepository().getAll()[0].format).toBe('singles');

    fireEvent.click(screen.getByRole('button', { name: 'Dobles estilo VGC' }));
    const searchDoubles = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(searchDoubles, { target: { value: '#448' } });
    fireEvent.keyDown(searchDoubles, { key: 'Enter', code: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar equipo' }));

    const saved = new SavedCompetitiveTeamRepository().getAll();
    expect(saved).toHaveLength(2);
    expect(saved.map(entry => entry.name)).toEqual(['Mi Singles', 'Dobles Champions']);
    expect(saved.map(entry => entry.format)).toEqual(['singles', 'doubles']);
    expect(saved[0].environment).toBe('mainline');
    expect(saved[1].environment).toBe('champions');
    expect(saved[0].team[0]?.pokemonId).toBe(25);
    expect(saved[1].team[0]?.pokemonId).toBe(448);
    expect(saved[1].team).toHaveLength(6);
    expect(prompt).toHaveBeenCalledTimes(2);
  });

});
