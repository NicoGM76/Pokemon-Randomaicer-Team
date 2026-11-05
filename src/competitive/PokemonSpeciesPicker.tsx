import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Pokemon } from '../domain/pokemon/types';
import { searchPokemon } from './searchPokemon';

interface Props {
  pokemon: Pokemon[];
  selectedId: number | null;
  selectionKey: string;
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
export default function PokemonSpeciesPicker({ pokemon, selectedId, selectionKey, onSelect, options }: Props) {
  const [query, setQuery] = useState('');
  const [browseAll, setBrowseAll] = useState(false);
  const suggestions = useMemo(() => searchPokemon(pokemon, query), [pokemon, query]);

  // The picker stays mounted when editing another roster slot. Reset its
  // local query, rather than accumulating stale search UIs during updates.
  useEffect(() => {
    setQuery('');
    setBrowseAll(false);
  }, [selectionKey]);
  const isSearching = query.trim().length > 0;

  function choose(id: number) {
    onSelect(id);
    setQuery('');
    setBrowseAll(false);
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
        Escribe para encontrar un Pokémon y pulsa Enter o elige una coincidencia.
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

      <button type="button" className="comp-species-browse-toggle"
        aria-expanded={browseAll} aria-controls="comp-species-complete-catalog"
        onClick={() => setBrowseAll(open => !open)}>
        {browseAll ? 'Ocultar lista completa' : 'Explorar Pokédex completa'}
      </button>
      {browseAll && <label id="comp-species-complete-catalog" className="comp-field comp-species-select">
        Explorar por número de Pokédex
        <select aria-label="Pokémon del espacio seleccionado"
          value={selectedId ?? ''} onChange={event => choose(Number(event.target.value))}>
          <option value="">Vacío, elige una especie</option>
          {options}
        </select>
      </label>}
    </div>
  );
}
