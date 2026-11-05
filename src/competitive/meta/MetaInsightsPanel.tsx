import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { Pokemon } from '../../domain/pokemon/types';
import { analyzeMetaMatchup, isMetaSnapshot } from './matchups';
import type { MetaFormat, MetaResponse, MetaSnapshot } from './types';
import './meta.css';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'ready'; snapshot: MetaSnapshot };

const labels = { singles: 'Singles', doubles: 'Dobles' };
const MetaHistoryComparisonPanel = lazy(() => import('./MetaHistoryComparisonPanel'));

const memoryCache = new Map<MetaFormat, MetaSnapshot>();

/** Allows independent browser-test cases without leaked module cache. */
export function clearMetaMemoryCache(): void { memoryCache.clear(); }

function niceName(name: string): string {
  return name.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
function pct(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value) + '%';
}

export default function MetaInsightsPanel({
  format, pokemon, teamIds, showLearning
}: {
  format: MetaFormat;
  pokemon: Pokemon[];
  teamIds: number[];
  showLearning: boolean;
}) {
  const [view, setView] = useState<ViewState>(() => {
    const snapshot = memoryCache.get(format);
    return snapshot ? { kind: 'ready', snapshot } : { kind: 'loading' };
  });
  const [opponentId, setOpponentId] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const lookup = useMemo(() => new Map(pokemon.map(entry => [entry.id, entry])), [pokemon]);

  useEffect(() => {
    const cached = memoryCache.get(format);
    if (cached) {
      setView({ kind: 'ready', snapshot: cached });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setView({ kind: 'loading' });

    async function load() {
      try {
        const url = import.meta.env.BASE_URL + 'meta/' + format + '.json';
        const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const raw: MetaResponse = await response.json();
        if (!isMetaSnapshot(raw, format)) {
          const unavailable = raw?.status === 'unavailable'
            ? raw.message : 'El archivo no cumple la estructura validada.';
          if (active) setView({ kind: 'unavailable', message: unavailable });
          return;
        }
        memoryCache.set(format, raw);
        if (active) setView({ kind: 'ready', snapshot: raw });
      } catch {
        if (active) setView({ kind: 'unavailable', message: 'No se pudieron cargar las estadísticas. Comprueba tu conexión o inténtalo más tarde.' });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [format]);

  if (view.kind === 'loading') {
    return <section className="comp-meta-panel" aria-live="polite"><h2>Metagame y matchups</h2><p>Cargando datos de {labels[format]}…</p></section>;
  }
  if (view.kind === 'unavailable') {
    return <section className="comp-meta-panel" role="status">
      <span className="section-kicker">V2.2 · DATOS EXTERNOS</span>
      <h2>Metagame y matchups</h2>
      <p>{view.message}</p>
      <p>El constructor de equipos sigue disponible sin conexión a estas estadísticas.</p>
      <a href="https://www.smogon.com/stats/" target="_blank" rel="noopener noreferrer">Consultar estadísticas de Smogon</a>
    </section>;
  }

  const snapshot = view.snapshot;
  const eligible = snapshot.pokemon.filter(item => lookup.has(item.pokemonId));
  const selected = eligible.find(item => item.pokemonId === opponentId) ?? eligible[0];
  const target = selected ? lookup.get(selected.pokemonId) : undefined;
  const matchup = selected ? analyzeMetaMatchup(teamIds, selected.pokemonId, pokemon) : undefined;

  function names(ids: number[]): string {
    return ids.map(id => lookup.get(id)?.name).filter((name): name is string => Boolean(name))
      .map(niceName).join(', ');
  }

  return (
    <section className="comp-meta-panel" aria-label="Inteligencia competitiva">
      <div className="comp-meta-header">
        <div>
          <span className="section-kicker">V2.2 · INTELIGENCIA COMPETITIVA</span>
          <h2>Metagame y matchups</h2>
          <p className="comp-subdued">Estadísticas verificadas de la escalera de Pokémon Showdown, no de torneos oficiales.</p>
        </div>
        <div className="comp-meta-period">{snapshot.source.month}<small>{snapshot.source.cutoff}+ rating</small></div>
      </div>

      <div className="comp-meta-provenance">
        <strong>{snapshot.label}</strong>
        <span>{snapshot.source.battles.toLocaleString('es-CO')} combates registrados en la muestra · {snapshot.source.organization}</span>
        <a href={snapshot.source.url} target="_blank" rel="noopener noreferrer">Abrir estadísticas originales</a>
      </div>

      {showLearning && <div className="comp-meta-lesson">
        <strong>¿Qué significa “uso”?</strong> Es la proporción ponderada de equipos en la escalera analizada que incluían ese Pokémon.
        No significa porcentaje de victorias ni probabilidad de ganar contra él.
        Las formas alternativas sin equivalencia exacta se excluyen del catálogo.
      </div>}

      <section className="comp-meta-history-launch">
        <div>
          <span className="section-kicker">V2.4 · HISTÓRICO</span>
          <h3>¿Cómo cambió el metagame?</h3>
          <p>Compara dos meses verificados de la misma regulación y corte de rating.
            No descargamos datos históricos hasta que lo solicites.</p>
        </div>
        <button type="button" className="secondary" aria-expanded={showHistory}
          onClick={() => setShowHistory(value => !value)}>
          {showHistory ? 'Ocultar comparación mensual' : 'Comparar meses de uso'}
        </button>
      </section>
      {showHistory && <Suspense fallback={<p role="status">Preparando comparación…</p>}>
        <MetaHistoryComparisonPanel format={format} snapshot={snapshot} pokemon={pokemon}/>
      </Suspense>}

      <div className="comp-meta-layout">
        <div className="comp-meta-ranking">
          <h3>Más utilizados en {labels[format]}</h3>
          <div className="comp-meta-rank-list">
            {eligible.slice(0, 12).map((entry, index) => (
              <button type="button" key={entry.pokemonId}
                aria-pressed={selected?.pokemonId === entry.pokemonId}
                className={selected?.pokemonId === entry.pokemonId ? 'is-selected' : ''}
                onClick={() => setOpponentId(entry.pokemonId)}>
                <span className="comp-meta-rank-number">{index + 1}</span>
                <span className="comp-meta-rank-name">{niceName(lookup.get(entry.pokemonId)?.name ?? '')}</span>
                <strong>{pct(entry.usagePercent)}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="comp-meta-details">
          <label className="comp-field">Pokémon rival para analizar
            <select aria-label="Pokémon rival para analizar"
              value={selected?.pokemonId ?? ''} onChange={event => setOpponentId(Number(event.target.value))}>
              {eligible.map(entry => <option key={entry.pokemonId} value={entry.pokemonId}>
                {niceName(lookup.get(entry.pokemonId)?.name ?? '')} · {pct(entry.usagePercent)}
              </option>)}
            </select>
          </label>

          {selected && target && matchup && <>
            <div className="comp-meta-opponent">
              <img src={'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + target.id + '.png'}
                loading="lazy" alt="" />
              <div>
                <h3>{niceName(target.name)}</h3>
                <p><strong>{pct(selected.usagePercent)} de uso ponderado</strong></p>
                <small>Tipos: {target.types.map(niceName).join(' / ')}</small>
              </div>
            </div>
            <div className="comp-meta-sample">
              <div><strong>Movimientos destacados</strong><span>{selected.moves.join(' · ') || 'Sin desglose'}</span></div>
              <div><strong>Objetos destacados</strong><span>{selected.items.join(' · ') || 'Sin desglose'}</span></div>
              <div><strong>Habilidades</strong><span>{selected.abilities.join(' · ') || 'Sin desglose'}</span></div>
              <div><strong>Asociación positiva con</strong><span>{names(selected.teammates) || 'Sin datos compatibles'}</span></div>
            </div>
            <h3>Presión de tipos frente a tu equipo</h3>
            {matchup.checkedMembers === 0
              ? <p className="comp-subdued">Añade miembros a tu equipo para comparar los tipos.</p>
              : <div className="comp-meta-matchups">
                  <div><span>Miembros vulnerables a un STAB del rival</span>
                    <strong>{matchup.threatened.length} / {matchup.checkedMembers}</strong>
                    <small>{names(matchup.threatened) || 'Ninguno por tipos base'}</small>
                  </div>
                  <div><span>Miembros con STAB supereficaz sobre el rival</span>
                    <strong>{matchup.offensiveAnswers.length} / {matchup.checkedMembers}</strong>
                    <small>{names(matchup.offensiveAnswers) || 'Ninguno por tipos base'}</small>
                  </div>
                </div>
            }
            <p className="comp-meta-caveat">Comparación elemental: solo tipos base y STAB potencial.
              No evalúa movimientos reales, habilidades, objetos, Teracristalización, estadísticas,
              Velocidad, daño ni resultados de enfrentamientos. Las asociaciones con compañeros son
              desviaciones positivas frente a lo esperado, no tasas de aparición conjunta.</p>
          </>}
        </div>
      </div>
      <div className="comp-meta-official">
        <strong>¿Y los Championships?</strong>
        <p>Los resultados de torneos oficiales son distintos de estas estadísticas de partidas de escalera.
          Para verificar campeones y eventos, consulta el registro oficial.
          Las listas y equipos de torneos todavía no se importan automáticamente.</p>
        <a href="https://www.pokemon.com/uk/play-pokemon/pokemon-events/championship-series-event-results/2026"
          target="_blank" rel="noopener noreferrer">Resultados oficiales de Championships 2026</a>
      </div>
    </section>
  );
}
