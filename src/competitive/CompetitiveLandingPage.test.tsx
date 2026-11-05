/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RootApp from '../RootApp';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  localStorage.clear();
  vi.unstubAllGlobals();
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
    expect((screen.getByLabelText('Pokémon del espacio seleccionado') as HTMLSelectElement).value).toBe('1000');

    fireEvent.change(screen.getByLabelText('Movimiento 1'), { target: { value: 'Make It Rain' } });
    view.unmount();
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect((screen.getByLabelText('Pokémon del espacio seleccionado') as HTMLSelectElement).value).toBe('1000');
    expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Make It Rain');
  });

  it('edits a manual species and keeps its move after leaving the page', async () => {
    window.location.hash = '#/competitive';
    const view = render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Movimiento 1'), { target: { value: 'Thunderbolt' } });
    await waitFor(() => expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Thunderbolt'));
    view.unmount();
    render(<RootApp />);
    expect(await screen.findByRole('heading', { name: 'Tu laboratorio competitivo' })).toBeTruthy();
    expect((screen.getByLabelText('Movimiento 1') as HTMLInputElement).value).toBe('Thunderbolt');
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

});
