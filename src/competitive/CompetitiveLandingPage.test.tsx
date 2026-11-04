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
});
