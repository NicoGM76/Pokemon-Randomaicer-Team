/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CollectionPage from './CollectionPage';
import { loadCollectionDraft } from './collectionDraft';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Collection UX: trades and clear actions', () => {
  it('allows trade evolutions independently per team and restores preferences after a remount', async () => {
    const view = render(<CollectionPage />);
    const switches = screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' }) as HTMLInputElement[];
    expect(switches).toHaveLength(2);
    expect(switches[0].checked).toBe(false);
    expect(switches[1].checked).toBe(false);

    fireEvent.click(switches[0]);
    expect(switches[0].checked).toBe(true);
    expect(switches[1].checked).toBe(false);
    await waitFor(() => expect(loadCollectionDraft()?.config.entries[0].generator.allowTradeEvolution).toBe(true));

    view.unmount();
    render(<CollectionPage />);
    const restored = screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' }) as HTMLInputElement[];
    expect(restored[0].checked).toBe(true);
    expect(restored[1].checked).toBe(false);
  });

  it('keeps the exchange choice when changing the target generation', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0]);
    const generation = screen.getAllByLabelText('Región / generación objetivo')[0] as HTMLSelectElement;
    fireEvent.change(generation, { target: { value: '3' } });
    expect((screen.getAllByRole('checkbox', { name: 'Permitir evoluciones por intercambio' })[0] as HTMLInputElement).checked).toBe(true);
  });

  it('shows readable accessible pressed states for locking an entire team and a member', () => {
    render(<CollectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar colección' }));
    const teamLock = screen.getAllByRole('button', { name: 'Bloquear equipo' })[0];
    expect(teamLock.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(teamLock);
    const locked = screen.getAllByRole('button', { name: 'Desbloquear equipo' })[0];
    expect(locked.getAttribute('aria-pressed')).toBe('true');
    expect(within(locked).getByText(/Desbloquear equipo/)).toBeTruthy();

    fireEvent.click(locked);
    const firstMemberLock = screen.getAllByRole('button', { name: 'Bloquear Pokémon' })[0];
    expect(firstMemberLock.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(firstMemberLock);
    expect(screen.getAllByRole('button', { name: 'Desbloquear Pokémon' })[0].getAttribute('aria-pressed')).toBe('true');
  });
});
