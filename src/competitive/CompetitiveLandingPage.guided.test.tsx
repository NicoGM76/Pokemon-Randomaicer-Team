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

function selectSpecies(id: number): void {
  const input = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
  fireEvent.change(input, { target: { value: '#' + id } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
}

describe('guided competitive editor', () => {
  it('only offers Pikachu abilities and suggests Restos plus legal mainline moves', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    selectSpecies(25);
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
    selectSpecies(448);

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
    selectSpecies(6);
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
      selectSpecies(id);
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
    selectSpecies(448);
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
    const emptyMove = screen.getByRole('searchbox', { name: 'Movimiento 2' });
    fireEvent.focus(emptyMove);
    expect(await screen.findByRole('button', { name: 'Elegir Golpe Aéreo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Elegir Demolición' })).toBeTruthy();
    fireEvent.change(language, { target: { value: 'es-419' } });
    expect(move.value).toBe('Aura Esfera');
  });

  it('suggests Mega-Salamence moves in slot six and auto-assigns each unique form ability', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => String(url).includes('/pokemon-species/')
        ? { varieties: [
            { pokemon: { name: 'salamence' } },
            { pokemon: { name: 'salamence-mega' } }
          ] }
        : String(url).endsWith('/pokemon/salamence-mega')
          ? { abilities: [{ ability: { name: 'aerilate' } }],
              moves: [{ move: { name: 'return' },
                version_group_details: [{ version_group: { name: 'omega-ruby-alpha-sapphire' } }] }] }
          : { abilities: [{ ability: { name: 'intimidate' } }],
              moves: [
                { move: { name: 'dragon-claw' },
                  version_group_details: [{ version_group: { name: 'scarlet-violet' } }] },
                { move: { name: 'protect' },
                  version_group_details: [{ version_group: { name: 'scarlet-violet' } }] }
              ] }
    })));
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.click(await screen.findByRole('button', { name: 'Pokémon Champions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar espacio 6' }));
    const search = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(search, { target: { value: '#373' } });
    fireEvent.keyDown(search, { key: 'Enter', code: 'Enter' });

    const ability = await screen.findByRole('combobox', { name: 'Habilidad' }) as HTMLSelectElement;
    await waitFor(() => expect(ability.value).toBe('intimidate'));
    expect(ability.disabled).toBe(true);

    fireEvent.change(screen.getByRole('combobox', { name: 'Forma del Pokémon' }), {
      target: { value: 'salamence-mega' }
    });
    await waitFor(() => expect(ability.value).toBe('aerilate'));
    expect(ability.disabled).toBe(true);
    expect(screen.getByText('Habilidad única asignada automáticamente.')).toBeTruthy();
    expect(screen.getByText(/Esta Mega no tiene movimientos registrados para Escarlata\/Púrpura/)).toBeTruthy();

    const move = screen.getByRole('searchbox', { name: 'Movimiento 1' }) as HTMLInputElement;
    fireEvent.focus(move);
    const option = await screen.findByRole('button', { name: 'Elegir Garra Dragón' });
    expect(screen.getByRole('button', { name: 'Elegir Protección' })).toBeTruthy();
    fireEvent.click(option);
    expect(move.value).toBe('Garra Dragón');

    const slot = screen.getByRole('button', { name: 'Editar espacio 6' });
    expect(slot.textContent).toContain('Mega-Salamence');
    expect(slot.querySelector('img')?.getAttribute('src')).toContain('/10089.png');
    expect(screen.getByRole('heading', { name: 'Espacio 6' })).toBeTruthy();
  });

  it('leaves the ability unselected when the species offers multiple valid abilities', async () => {
    mockPokemonApi();
    window.location.hash = '#/competitive';
    render(<RootApp />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' }), {
      target: { value: '#25' }
    });
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' }), {
      key: 'Enter', code: 'Enter'
    });
    const ability = await screen.findByRole('combobox', { name: 'Habilidad' }) as HTMLSelectElement;
    await waitFor(() => expect(ability.options.length).toBe(3));
    expect(ability.value).toBe('');
    expect(ability.disabled).toBe(false);
    fireEvent.change(ability, { target: { value: 'lightning-rod' } });
    expect(ability.value).toBe('lightning-rod');
    expect(screen.queryByText('Habilidad única asignada automáticamente.')).toBeNull();
  });

});
