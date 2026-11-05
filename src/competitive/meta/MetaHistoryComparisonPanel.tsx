import { useEffect, useMemo, useState } from 'react';
import type { Pokemon } from '../../domain/pokemon/types';
import { compareMetaSnapshots, type MetaHistoryComparison } from './history';
import { isMetaSnapshot } from './matchups';
import type { MetaFormat, MetaResponse, MetaSnapshot } from './types';

type HistoryState =
  | { kind: 'loading' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'ready'; comparison: MetaHistoryComparison; source: MetaSnapshot['source'] };

const percent = (value: number) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(value);
const signedPoints = (value: number) => (value > 0 ? '+' : '') + percent(value) + ' pp';

export default function MetaHistoryComparisonPanel({
  format, snapshot, pokemon
}: { format: MetaFormat; snapshot: MetaSnapshot; pokemon: Pokemon[] }) {
  const [state, setState] = useState<HistoryState>({ kind: 'loading' });
  const names = useMemo(() => new Map<number, string>(pokemon.map(entry => [
    entry.id, entry.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  ])), [pokemon]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ kind: 'loading' });
    async function loadPrevious() {
      try {
        const response = await fetch(
          import.meta.env.BASE_URL + 'meta/' + format + '-previous.json',
          { signal: controller.signal, cache: 'no-cache' }
        );
        if (!response.ok) throw new Error('No hay un histórico disponible (HTTP ' + response.status + ').');
        const raw: MetaResponse = await response.json();
        if (!isMetaSnapshot(raw, format)) {
          const message = raw?.status === 'unavailable' && typeof raw.message === 'string'
            ? raw.message : 'No existe una muestra histórica con estructura verificable.';
          throw new Error(message);
        }
        const comparison = compareMetaSnapshots(snapshot, raw);
        if (active) setState({ kind: 'ready', comparison, source: raw.source });
      } catch (error) {
        if (active) setState({
          kind: 'unavailable',
          message: error instanceof Error ? error.message : 'Histórico no disponible.'
        });
      }
    }
    void loadPrevious();
    return () => { active = false; controller.abort(); };
  }, [format, snapshot]);

  if (state.kind === 'loading') {
    return <div className="comp-meta-history" role="status">Buscando un segundo mes verificado…</div>;
  }
  if (state.kind === 'unavailable') {
    return <div className="comp-meta-history" role="status">
      <h3>Comparativa histórica</h3>
      <p>{state.message}</p>
      <p>El análisis del mes actual sigue disponible. No se estimarán diferencias inexistentes.</p>
    </div>;
  }

  const { comparison, source } = state;
  const rises = comparison.changes.filter(row => row.changePoints > 0).slice(0, 5);
  const falls = comparison.changes.filter(row => row.changePoints < 0).slice(-5).reverse();
  const noChange = comparison.changes.length - rises.length - falls.length;
  const renderList = (rows: typeof rises) => rows.length ? (
    <ol>
      {rows.map(row => <li key={row.pokemonId}>
        <span>{names.get(row.pokemonId) ?? '#' + row.pokemonId}</span>
        <strong>{signedPoints(row.changePoints)}</strong>
        <small>{percent(row.previousUsage)}% → {percent(row.currentUsage)}%</small>
      </li>)}
    </ol>
  ) : <p>Sin variaciones de este tipo en la muestra común.</p>;

  return <section className="comp-meta-history" aria-label="Comparativa histórica del metagame">
    <span className="section-kicker">V2.4 · TENDENCIAS VERIFICABLES</span>
    <h3>{comparison.olderMonth} frente a {comparison.newerMonth}</h3>
    <p>Cambio en <strong>puntos porcentuales (pp) de uso ponderado</strong>. No es porcentaje de victorias
      ni un pronóstico. Solo se comparan Pokémon presentes en ambos archivos de la misma escalera y corte.</p>
    <div className="comp-meta-history-grid">
      <div><h4>Mayor aumento de uso</h4>{renderList(rises)}</div>
      <div><h4>Mayor disminución de uso</h4>{renderList(falls)}</div>
    </div>
    <p className="comp-meta-history-note">
      Coincidencias verificadas: {comparison.changes.length}. 
      Nuevos en el top 100 de la muestra: {comparison.newToSample}.
      Fuera del top 100 respecto a la muestra anterior: {comparison.noLongerInSample}.
      {noChange > 0 ? ' Algunas especies no cambiaron o quedaron fuera de los cinco primeros cambios.' : ''}
      La ausencia de una especie NO equivale a 0% de uso.
    </p>
    <a href={source.url} target="_blank" rel="noopener noreferrer">
      Abrir fuente del mes anterior ({source.month})
    </a>
  </section>;
}
