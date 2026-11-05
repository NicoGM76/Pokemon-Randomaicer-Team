/** @vitest-environment jsdom */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Pokemon } from '../domain/pokemon/types';
import PokemonSpeciesPicker from './PokemonSpeciesPicker';

const catalog = [
  { id: 25, name: 'Pikachu' },
  { id: 122, name: 'Mr. Mime' },
  { id: 1000, name: 'Gholdengo' },
  { id: 983, name: 'Kingambit' },
] as Pokemon[];

function Harness() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <>
      <PokemonSpeciesPicker
        pokemon={catalog} selectedId={selected} selectionKey="singles-0" onSelect={setSelected}
        options={catalog.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      />
      <output data-testid="chosen">#{selected ?? 'empty'}</output>
    </>
  );
}

afterEach(() => cleanup());

describe('hybrid species picker', () => {
  it('searches Goldengo and chooses Gholdengo with a click, preserving native select', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(input, { target: { value: 'Goldengo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Elegir Gholdengo número 1000' }));
    expect(screen.getByTestId('chosen').textContent).toBe('#1000');
    expect(screen.queryByLabelText('Pokémon del espacio seleccionado')).toBeNull();
    expect(screen.getByRole('button', { name: 'Explorar Pokédex completa' })).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('supports dex number + Enter and still supports browsing the full dropdown', () => {
    render(<Harness />);
    const input = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(input, { target: { value: '#1000' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(screen.getByTestId('chosen').textContent).toBe('#1000');
    fireEvent.click(screen.getByRole('button', { name: 'Explorar Pokédex completa' }));
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '25' } });
    expect(screen.getByTestId('chosen').textContent).toBe('#25');
  });

  it('can clear search without modifying the selected Pokémon', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Explorar Pokédex completa' }));
    fireEvent.change(screen.getByLabelText('Pokémon del espacio seleccionado'), { target: { value: '25' } });
    const input = screen.getByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' });
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    expect(screen.getByText('No encontramos Pokémon con ese nombre o número.')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(screen.getByTestId('chosen').textContent).toBe('#25');
  });
  it('only mounts the optional complete list after requesting it', () => {
    render(<Harness />);
    expect(screen.getAllByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' })).toHaveLength(1);
    expect(screen.queryByLabelText('Pokémon del espacio seleccionado')).toBeNull();

    const show = screen.getByRole('button', { name: 'Explorar Pokédex completa' });
    expect(show.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(show);
    const native = screen.getByLabelText('Pokémon del espacio seleccionado') as HTMLSelectElement;
    expect(native.value).toBe('');
    expect(screen.getAllByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Ocultar lista completa' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.change(native, { target: { value: '25' } });
    expect(screen.getByTestId('chosen').textContent).toBe('#25');
    expect(screen.queryByLabelText('Pokémon del espacio seleccionado')).toBeNull();
    expect(screen.getAllByRole('searchbox', { name: 'Buscar Pokémon por nombre o número' })).toHaveLength(1);
  });
});
