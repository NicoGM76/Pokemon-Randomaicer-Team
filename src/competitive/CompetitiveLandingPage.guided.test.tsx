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
    expect(screen.getByRole('option', { name: 'Electricidad Estática' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /Intimidate/i })).toBeNull();

    const item = screen.getByRole('searchbox', { name: 'Objeto equipado' });
    fireEvent.change(item, { target: { value: 'res' } });
    fireEvent.click(screen.getByRole('button', { name: /Elegir Restos/i }));
    expect((item as HTMLInputElement).value).toBe('Restos');

    const move = screen.getByRole('searchbox', { name: 'Movimiento 1' });
    fireEvent.change(move, { target: { value: 'thunder' } });
    fireEvent.click(await screen.findByRole('button', { name: /Elegir Atactrueno/i }));
    expect((move as HTMLInputElement).value).toBe('Atactrueno');
    const language = screen.getByRole('combobox', { name: 'Idioma de la página' });
    fireEvent.change(language, { target: { value: 'es-ES' } });
    expect((move as HTMLInputElement).value).toBe('Rayo');
    fireEvent.change(language, { target: { value: 'es-419' } });
    expect((move as HTMLInputElement).value).toBe('Atactrueno');
  });

  it('does not mix OU ladder data with a Champions Singles editor', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pokémon Champions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver metagame y matchups' }));
    expect(screen.getByText(/No hay un snapshot verificado de metagame/)).toBeTruthy();
    expect((fetch as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('removes redundant Champions note and selects Mega-Lucario Z with its stone and ability', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pokémon Champions' }));
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '448' } });

    expect(screen.queryByText('Mecánica de Champions')).toBeNull();
    const form = screen.getByRole('combobox', { name: 'Forma del Pokémon' });
    expect(screen.getByRole('option', { name: /Mega-Lucario Z · Lucarionite Z/ })).toBeTruthy();
    fireEvent.change(form, { target: { value: 'lucario-mega-z' } });

    const heldItem = screen.getByRole('searchbox', { name: 'Objeto equipado' }) as HTMLInputElement;
    expect(heldItem.value).toBe('Lucarionite Z');
    expect(heldItem.disabled).toBe(true);
    const ability = await screen.findByRole('combobox', { name: 'Habilidad' }) as HTMLSelectElement;
    await waitFor(() => expect([...ability.options].some(option => option.textContent?.includes('Aura Protectora'))).toBe(true));
    expect(ability.value).toBe('aura-guard');
  });

  it('keeps mainline EVs + Tera distinct from Champions PC + Mega stone', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    expect(await screen.findByRole('button', { name: 'Saga principal · Escarlata/Púrpura' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '6' } });
    expect(screen.getByRole('heading', { name: /EVs/ })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Tipo Tera' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pokémon Champions' }));
    expect(screen.getByRole('heading', { name: /PC.*66/ })).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Tipo Tera' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'charizard-mega-x' }
    });
    const item = screen.getByRole('searchbox', { name: 'Objeto equipado' }) as HTMLInputElement;
    expect(item.value).toBe('Charizardite X');
    expect(item.disabled).toBe(true);
  });

  it('selects Absol Z and Garchomp Z with locked stones, correct ability and edited typings', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pokémon Champions' }));
    for (const { id, formId, label, stone, ability, type } of [
      { id: 359, formId: 'absol-mega-z', label: 'Mega-Absol Z', stone: 'Absolite Z',
        ability: 'sharpness', type: 'Siniestro / Fantasma' },
      { id: 445, formId: 'garchomp-mega-z', label: 'Mega-Garchomp Z', stone: 'Garchompite Z',
        ability: 'levitate', type: 'Dragón' }
    ]) {
      fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), {
        target: { value: String(id) }
      });
      const form = screen.getByRole('combobox', { name: 'Forma del Pokémon' });
      expect(screen.getByRole('option', { name: label + ' · ' + stone })).toBeTruthy();
      fireEvent.change(form, { target: { value: formId } });
      const item = screen.getByRole('searchbox', { name: 'Objeto equipado' }) as HTMLInputElement;
      expect(item.value).toBe(stone);
      expect(item.disabled).toBe(true);
      const abilities = screen.getByRole('combobox', { name: 'Habilidad' }) as HTMLSelectElement;
      await waitFor(() => expect(abilities.value).toBe(ability));
      expect(screen.getByText(new RegExp(type))).toBeTruthy();
    }
    expect(screen.queryByText('Mecánica de Champions')).toBeNull();
  });

  it('uses regional Spanish for Lucario moves while keeping the selected move across language switches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => String(url).includes('/pokemon-species/')
        ? { varieties: [{ pokemon: { name: 'lucario' } }] }
        : {
          abilities: [{ ability: { name: 'inner-focus' } }],
          moves: ['aura-sphere', 'aerial-ace', 'brick-break'].map(name => ({
            move: { name }, version_group_details: [{ version_group: { name: 'scarlet-violet' } }]
          }))
        }
    })));
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pokémon Champions' }));
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), {
      target: { value: '448' }
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'lucario-mega-z' }
    });
    const move = await screen.findByRole('searchbox', { name: 'Movimiento 1' }) as HTMLInputElement;
    fireEvent.focus(move);
    expect(await screen.findByRole('button', { name: 'Elegir Aura Esfera' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Elegir As Aéreo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Elegir Karatazo' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir Aura Esfera' }));
    expect(move.value).toBe('Aura Esfera');

    const language = screen.getByRole('combobox', { name: 'Idioma de la página' });
    fireEvent.change(language, { target: { value: 'es-ES' } });
    expect(move.value).toBe('Esfera Aural');
    fireEvent.focus(move);
    expect(await screen.findByRole('button', { name: 'Elegir Golpe Aéreo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Elegir Demolición' })).toBeTruthy();
    fireEvent.change(language, { target: { value: 'es-419' } });
    expect(move.value).toBe('Aura Esfera');
  });

});
