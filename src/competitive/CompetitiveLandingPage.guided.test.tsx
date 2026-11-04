/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RootApp from '../RootApp';
import { clearProfileCache } from './assist/pokemonProfile';

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
  clearProfileCache();
  vi.unstubAllGlobals();
});

function mockPokemonApi() {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () => String(url).includes('pokemon-species')
      ? { varieties: [{ pokemon: { name: 'pikachu' } }, { pokemon: { name: 'charizard-mega-x' } }] }
      : String(url).includes('charizard-mega-x')
        ? { abilities: [{ ability: { name: 'tough-claws' } }], moves: [] }
        : { abilities: [
            { ability: { name: 'static' } },
            { ability: { name: 'lightning-rod' } }
          ],
          moves: [{ move: { name: 'thunderbolt' }, version_group_details: [
            { version_group: { name: 'scarlet-violet' } }
          ] }]
        }
  })));
}

describe('guided competitive editor', () => {
  it('only offers Pikachu abilities and suggests Restos plus legal mainline moves', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.change(await screen.findByLabelText('Pokémon del espacio seleccionado'), { target: { value: '25' } });
    const ability = await screen.findByRole('combobox', { name: 'Habilidad' });
    await waitFor(() => expect((ability as HTMLSelectElement).options.length).toBeGreaterThan(1));
    expect(screen.getByRole('option', { name: /Static/i })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /Intimidate/i })).toBeNull();

    const item = screen.getByRole('searchbox', { name: 'Objeto equipado' });
    fireEvent.change(item, { target: { value: 'res' } });
    fireEvent.click(screen.getByRole('button', { name: /Elegir Restos/i }));
    expect((item as HTMLInputElement).value).toBe('Restos');

    const move = screen.getByRole('searchbox', { name: 'Movimiento 1' });
    fireEvent.change(move, { target: { value: 'thunder' } });
    fireEvent.click(await screen.findByRole('button', { name: /Elegir Thunderbolt/i }));
    expect((move as HTMLInputElement).value).toBe('Thunderbolt');
  });

  it('keeps mainline EVs + Tera distinct from Champions PC + Mega stone', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    expect(await screen.findByRole('button', { name: 'Saga principal · Escarlata/Púrpura' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '6' } });
    expect(screen.getByText(/EVs/)).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Tipo Tera' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pokémon Champions' }));
    expect(screen.getByText(/PC.*66/)).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Tipo Tera' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'charizard-mega-x' }
    });
    const item = screen.getByRole('searchbox', { name: 'Objeto equipado' }) as HTMLInputElement;
    expect(item.value).toBe('Charizardite X');
    expect(item.disabled).toBe(true);
  });
});
