/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CollectionPage from './CollectionPage';
import { loadCollectionDraft } from './collectionDraft';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('Collection global action bar', () => {
  it('applies trade and bonus switches to all teams while keeping individual edits', async () => {
    render(<CollectionPage />);

    const allTrade = screen.getByRole('checkbox', { name: 'Intercambios en todos los equipos' }) as HTMLInputElement;
    fireEvent.click(allTrade);
    expect(allTrade.checked).toBe(true);
    expect(screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })
      .every(checkbox => (checkbox as HTMLInputElement).checked)).toBe(true);

    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0]);
    expect(allTrade.checked).toBe(false);

    const allBonus = screen.getByRole('checkbox', { name: 'Bonus en todos los equipos' }) as HTMLInputElement;
    fireEvent.click(allBonus);
    expect(screen.getAllByRole('checkbox', { name: 'Permitir un Pokémon bonus' })
      .every(checkbox => (checkbox as HTMLInputElement).checked)).toBe(true);
    fireEvent.click(allBonus);
    expect(screen.getAllByRole('checkbox', { name: 'Permitir un Pokémon bonus' })
      .every(checkbox => !(checkbox as HTMLInputElement).checked)).toBe(true);
    await waitFor(() => expect(loadCollectionDraft()?.config.entries.every(entry => !entry.allowBonus)).toBe(true));
  });

  it('locks and unlocks all regions and clears member locks without regenerating', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar colección' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Bloquear Pokémon' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Bloquear todos los equipos' }));
    expect(screen.getAllByRole('button', { name: 'Desbloquear equipo' })
      .every(button => button.getAttribute('aria-pressed') === 'true')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Desbloquear equipos' }));
    expect(screen.getAllByRole('button', { name: 'Bloquear equipo' })
      .every(button => button.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(screen.getAllByRole('button', { name: 'Desbloquear Pokémon' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar bloqueos' }));
    expect(screen.queryByRole('button', { name: 'Desbloquear Pokémon' })).toBeNull();
  });

  it('removes internal family IDs and exposes an individual reroll action', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar colección' }));
    expect(screen.queryByText(/Familia: chain-/)).toBeNull();
    expect(screen.getAllByText(/Origen de la línea:/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Regenerar Pokémon' }).length).toBeGreaterThan(0);
  });

  it('only restores defaults after explicit confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CollectionPage />);
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer colección' }));
    expect((screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0] as HTMLInputElement).checked).toBe(true);
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer colección' }));
    expect((screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0] as HTMLInputElement).checked).toBe(false);
  });
});
