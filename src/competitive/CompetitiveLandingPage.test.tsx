/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RootApp from '../RootApp';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  localStorage.clear();
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
