import { useMemo, useState, type ReactNode } from 'react';
import type { Pokemon } from '../domain/pokemon/types';
import { searchPokemon } from './searchPokemon';

interface Props {
  pokemon: Pokemon[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  options: ReactNode;
}

function niceName(name: string): string {
  return name.split('-').map(part => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

/**
 * Hybrid picker: a small typeahead for fast selection and the original
 * native dropdown for full browse/touch/keyboard accessibility.
 */
export default function PokemonSpeciesPicker({ pokemon, selectedId, onSelect, options }: Props) {
  const [query, setQuery] = useState('');
  const suggestions = useMemo(() => searchPokemon(pokemon, query), [pokemon, query]);
  const isSearching = query.trim().length > 0;

  function choose(id: number) {
    onSelect(id);
    setQuery('');
  }

  return (
    <div className="comp-species-picker">
      <label className="comp-field">
        Buscar Pokémon por nombre o número
        <input
          type="search"
          value={query}
          autoComplete="off"
          aria-describedby="comp-species-search-help"
          placeholder="Ej. Gholdengo, Goldengo o #1000"
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && suggestions.length > 0) {
              event.preventDefault();
              choose(suggestions[0].id);
            } else if (event.key === 'Escape') {
              setQuery('');
            }
          }}
        />
      </label>
      <p id="comp-species-search-help" className="comp-species-help">
        Escribe y elige una coincidencia, o pulsa Enter para la primera. También puedes explorar la lista completa.
      </p>

      {isSearching && <div className="comp-species-matches">
        <p className="comp-species-match-count" role="status">
          {suggestions.length > 0
            ? 'Coincidencias para «' + query + '»'
            : 'No encontramos Pokémon con ese nombre o número.'}
        </p>
        {suggestions.length > 0 && (
          <ul className="comp-species-suggestions" aria-label="Coincidencias de Pokémon">
            {suggestions.map(entry => (
              <li key={entry.id}>
                <button type="button" onClick={() => choose(entry.id)}
                  aria-label={'Elegir ' + niceName(entry.name) + ' número ' + entry.id}>
                  <span>{niceName(entry.name)}</span>
                  <small>#{entry.id}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>}

      <label className="comp-field comp-species-select">
        Pokémon del espacio seleccionado
        <select value={selectedId ?? ''} onChange={event => choose(Number(event.target.value))}>
          <option value="">Vacío, elige una especie</option>
          {options}
        </select>
      </label>
    </div>
  );
}
