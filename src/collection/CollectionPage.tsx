import { useEffect, useMemo, useState } from 'react';
import { loadDataset } from '../data/loadDataset';
import type { CollectionConfig, CollectionEntryConfig, CollectionResult } from '../domain/collections/types';
import type { GeneratorConfig } from '../domain/teams/types';
import { generateCollection } from '../generator/collection/generateCollection';
import { regenerateCollectionTeam } from '../generator/collection/regenerateCollectionTeam';
import { regenerateCollectionMember } from '../generator/collection/regenerateCollectionMember';
import { familyOriginGeneration } from '../generator/collection/familyOriginGeneration';
import { loadCollectionDraft, saveCollectionDraft } from './collectionDraft';
import { CollectionActionButton } from './CollectionActionButton';
import { clearAllLocks, setAllBonus, setAllTradeEvolution, setTeamLocks } from './collectionActions';
import './collection.css';

const dataset = loadDataset();

const roman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' };
const typeLabels: Record<string, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};

function basePackFor(gameId: string): string {
  return dataset.contentPacks.find(pack => pack.gameId === gameId && pack.type === 'base')?.id ?? '';
}

function defaultGameForGeneration(generation: number): string {
  return dataset.games.find(game => game.generation === generation)?.id ?? dataset.games[0]?.id ?? '';
}

function makeGenerator(gameId: string, teamSize = 6): GeneratorConfig {
  return {
    gameId,
    enabledContentPacks: [basePackFor(gameId)].filter(Boolean),
    teamSize,
    stage: 'all',
    mode: 'adventure',
    allowedMethods: ['wild', 'gift', 'evolution'],
    allowTradeEvolution: false,
    starterRule: 'allow',
    legendaryRule: 'exclude'
  };
}

function makeEntry(generation: number, id: string): CollectionEntryConfig {
  const gameId = defaultGameForGeneration(generation);
  return {
    id,
    label: `Generación ${roman[generation] ?? generation}`,
    targetGeneration: generation,
    generator: makeGenerator(gameId),
    allowBonus: true
  };
}

function initialConfig(): CollectionConfig {
  return {
    entries: [makeEntry(1, 'collection-1'), makeEntry(2, 'collection-2')],
    avoidRepeatedSpecies: true,
    avoidRepeatedFamilies: true,
    maxBonusPerTeam: 1
  };
}

function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function nextEntryId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `collection-${Date.now()}-${Math.random()}`;
}

export default function CollectionPage() {
  const restoredDraft = useMemo(() => loadCollectionDraft(), []);
  const [config, setConfig] = useState<CollectionConfig>(() => restoredDraft?.config ?? initialConfig());
  const [result, setResult] = useState<CollectionResult | null>(() => restoredDraft?.result ?? null);
  const [resultEngineVersion, setResultEngineVersion] = useState<number>(() =>
    restoredDraft?.result ? (restoredDraft.resultEngineVersion ?? 1) : 2);
  const [notice, setNotice] = useState('');
  const generations = useMemo(() => [...new Set(dataset.games.map(game => game.generation))].sort((a, b) => a - b), []);

  useEffect(() => {
    saveCollectionDraft({ config, result, resultEngineVersion });
  }, [config, result, resultEngineVersion]);

  const updateEntry = (id: string, updater: (entry: CollectionEntryConfig) => CollectionEntryConfig) => {
    setConfig(previous => ({
      ...previous,
      entries: previous.entries.map(entry => entry.id === id ? updater(entry) : entry)
    }));
    setResult(null);
  };

  const changeTargetGeneration = (id: string, generation: number) => {
    const gameId = defaultGameForGeneration(generation);
    updateEntry(id, entry => ({
      ...entry,
      label: `Generación ${roman[generation] ?? generation}`,
      targetGeneration: generation,
      generator: {
        ...makeGenerator(gameId, entry.generator.teamSize),
        allowTradeEvolution: entry.generator.allowTradeEvolution
      }
    }));
  };

  const changeGame = (id: string, gameId: string) => {
    updateEntry(id, entry => ({
      ...entry,
      generator: {
        ...entry.generator,
        gameId,
        enabledContentPacks: [basePackFor(gameId)].filter(Boolean)
      }
    }));
  };

  const addEntry = () => {
    if (config.entries.length >= 9) return;
    const used = new Set(config.entries.map(entry => entry.targetGeneration));
    const generation = generations.find(value => !used.has(value)) ?? generations[0] ?? 1;
    setConfig(previous => ({ ...previous, entries: [...previous.entries, makeEntry(generation, nextEntryId())] }));
    setResult(null);
  };

  const removeEntry = (id: string) => {
    if (config.entries.length <= 2) return;
    setConfig(previous => ({ ...previous, entries: previous.entries.filter(entry => entry.id !== id) }));
    setResult(null);
  };

  const allTradeEnabled = config.entries.every(entry => entry.generator.allowTradeEvolution);
  const allBonusEnabled = config.entries.every(entry => entry.allowBonus);

  const changeTradeForAll = (enabled: boolean) => {
    setConfig(previous => setAllTradeEvolution(previous, enabled));
    setResult(null);
    setNotice('Intercambios actualizados en todos los equipos. Genera otra vez para aplicar las reglas.');
  };

  const changeBonusForAll = (enabled: boolean) => {
    setConfig(previous => setAllBonus(previous, enabled));
    setResult(null);
    setNotice('Bonus actualizados en todos los equipos. Genera otra vez para aplicar las reglas.');
  };

  const generateAll = () => {
    setResult(generateCollection(dataset, config, result ?? undefined));
    setResultEngineVersion(2);
    setNotice(result
      ? 'Se respetaron los Pokémon y equipos bloqueados.'
      : 'Colección generada con las reglas elegidas.');
  };

  const regenerateEverything = () => {
    if (!result) return;
    if (!window.confirm('¿Regenerar toda la colección ignorando los bloqueos actuales?')) return;
    setResult(generateCollection(dataset, config));
    setResultEngineVersion(2);
    setNotice('Colección completamente regenerada. Los bloqueos anteriores se descartaron.');
  };

  const resetCollection = () => {
    if (!window.confirm('¿Restablecer la configuración y eliminar el resultado actual de la colección?')) return;
    setConfig(initialConfig());
    setResult(null);
    setResultEngineVersion(2);
    setNotice('Colección restablecida. Puedes comenzar otra vez.');
  };

  const copySummary = async () => {
    if (!result) return;
    const content = result.teams.map(team => {
      const gameName = dataset.games.find(game => game.id === team.gameId)?.name ?? team.gameId;
      const members = team.team.map(slot => slot.candidate.resolvedPokemon.name).join(', ');
      return team.label + ' (' + gameName + '): ' + members;
    }).join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
      setNotice('Resumen copiado al portapapeles.');
    } catch {
      setNotice('No se pudo copiar: revisa los permisos del navegador.');
    }
  };

  const toggleTeamLock = (entryId: string) => {
    setResult(previous => previous ? {
      ...previous,
      teams: previous.teams.map(team => team.entryId === entryId ? { ...team, locked: !team.locked } : team)
    } : previous);
  };

  const toggleMemberLock = (entryId: string, index: number) => {
    setResult(previous => previous ? {
      ...previous,
      teams: previous.teams.map(team => team.entryId === entryId ? {
        ...team,
        team: team.team.map((slot, slotIndex) => slotIndex === index ? { ...slot, locked: !slot.locked } : slot)
      } : team)
    } : previous);
  };

  const rerollTeam = (entryId: string) => {
    if (!result) return;
    setResult(regenerateCollectionTeam(dataset, config, result, entryId));
  };

  const rerollMember = (entryId: string, index: number) => {
    if (!result) return;
    const next = regenerateCollectionMember(dataset, config, result, entryId, index);
    if (next === result) {
      setNotice('No hay otra alternativa compatible para ese espacio sin romper las reglas.');
    } else {
      setResult(next);
      setNotice('Pokémon regenerado; los demás miembros permanecen iguales.');
    }
  };

  return (
    <main className="page collection-page">
      <section className="hero">
        <div className="section-kicker">UNA COLECCIÓN · MUCHAS AVENTURAS</div>
        <h1>Arma todos tus equipos como una sola estrategia.</h1>
        <p className="hero-copy">Elige la generación o región objetivo y el juego que jugarás. El motor reparte las familias entre todos los equipos para evitar repetir siempre a los mismos favoritos.</p>
      </section>

      <section className="config-card collection-rules-card">
        <div className="config-title">
          <div>
            <span className="section-kicker">TUS REGLAS · UNA SOLA COLECCIÓN</span>
            <h2>Reglas globales</h2>
          </div>
          <span className="collection-rule-count">{config.entries.length} regiones configuradas</span>
        </div>
        <div className="collection-global-grid">
          <div className="collection-global-group">
            <h3>Diversidad de equipos</h3>
            <p>Evita repetir siempre los mismos Pokémon en las diferentes regiones.</p>
            <label className="collection-toggle collection-global-toggle">
              <input type="checkbox" checked={config.avoidRepeatedSpecies}
                onChange={event => {
                  setConfig(previous => ({ ...previous, avoidRepeatedSpecies: event.target.checked }));
                  setResult(null);
                }} />
              <span className="collection-toggle__track" aria-hidden="true" />
              <span className="collection-toggle__text">
                <strong>No repetir Pokémon entre equipos</strong>
                <small>Evita especies duplicadas en la colección.</small>
              </span>
            </label>
            <label className="collection-toggle collection-global-toggle">
              <input type="checkbox" checked={config.avoidRepeatedFamilies}
                onChange={event => {
                  setConfig(previous => ({ ...previous, avoidRepeatedFamilies: event.target.checked }));
                  setResult(null);
                }} />
              <span className="collection-toggle__track" aria-hidden="true" />
              <span className="collection-toggle__text">
                <strong>No repetir familias evolutivas</strong>
                <small>Evita distintas evoluciones de una misma línea.</small>
              </span>
            </label>
          </div>
          <div className="collection-global-group">
            <h3>Aplicar a todos</h3>
            <p>Configura los intercambios y Pokémon bonus de todas las regiones a la vez.</p>
            <label className="collection-toggle collection-global-toggle">
              <input type="checkbox" aria-label="Intercambios en todos los equipos"
                checked={allTradeEnabled} onChange={event => changeTradeForAll(event.target.checked)} />
              <span className="collection-toggle__track" aria-hidden="true" />
              <span className="collection-toggle__text">
                <strong>Evoluciones por intercambio</strong>
                <small>{allTradeEnabled ? 'Activadas en todos los equipos.' : 'Pulsa para activarlas en todos los equipos.'}</small>
              </span>
            </label>
            <label className="collection-toggle collection-global-toggle">
              <input type="checkbox" aria-label="Bonus en todos los equipos"
                checked={allBonusEnabled} onChange={event => changeBonusForAll(event.target.checked)} />
              <span className="collection-toggle__track" aria-hidden="true" />
              <span className="collection-toggle__text">
                <strong>Un Pokémon bonus por región</strong>
                <small>{allBonusEnabled ? 'Permitido en todos los equipos.' : 'Pulsa para permitirlo en todos los equipos.'}</small>
              </span>
            </label>
          </div>
        </div>
        <p className="collection-global-hint">
          Las familias cuentan por su generación de origen, pero las evoluciones dependen del juego elegido.
          La disponibilidad exacta de objetos, historia y postgame sigue siendo provisional cuando usamos la Pokédex regional.
          Cambiar reglas requiere generar de nuevo.
        </p>
      </section>

      <section className="collection-quick-actions" aria-label="Acciones generales de colección">
        <div className="collection-toolbar-heading">
          <div>
            <span className="section-kicker">CENTRO DE CONTROL</span>
            <h2>Gestiona toda tu colección</h2>
          </div>
          <small>{result ? result.totalPokemon + ' Pokémon en ' + result.teams.length + ' equipos' : 'Configura tus regiones y genera tu colección'}</small>
        </div>
        <div className="collection-toolbar-actions">
          <CollectionActionButton icon={result ? 'refresh' : 'generate'} tone="primary"
            onClick={generateAll} disabled={Boolean(result && result.teams.every(team => team.locked))}>
            {result ? 'Regenerar desbloqueados' : 'Generar colección'}
          </CollectionActionButton>
          <CollectionActionButton icon="add" disabled={config.entries.length >= 9} onClick={addEntry}>
            Añadir equipo
          </CollectionActionButton>
          {result && <>
            <CollectionActionButton icon="refresh" onClick={regenerateEverything}>Regenerar todo</CollectionActionButton>
            <CollectionActionButton icon="lock" onClick={() => setResult(previous => previous && setTeamLocks(previous, true))}>
              Bloquear todos los equipos
            </CollectionActionButton>
            <CollectionActionButton icon="unlock" onClick={() => setResult(previous => previous && setTeamLocks(previous, false))}>
              Desbloquear equipos
            </CollectionActionButton>
            <CollectionActionButton icon="unlock" onClick={() => setResult(previous => previous && clearAllLocks(previous))}>
              Limpiar bloqueos
            </CollectionActionButton>
            <CollectionActionButton icon="copy" onClick={copySummary}>Copiar resumen</CollectionActionButton>
          </>}
          <CollectionActionButton icon="delete" tone="danger" onClick={resetCollection}>
            Restablecer colección
          </CollectionActionButton>
        </div>
      </section>
      {notice && <div className="collection-status" role="status">{notice}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        {config.entries.map((entry, index) => (
          <section className="config-card collection-entry-card" key={entry.id}>
            <div className="config-title">
              <h2>Equipo {index + 1} · {entry.label}</h2>
              {config.entries.length > 2 && (
                <CollectionActionButton icon="delete" tone="danger" onClick={() => removeEntry(entry.id)}>
                  Eliminar equipo
                </CollectionActionButton>
              )}
            </div>
            <div className="config-content">
              <div className="field-grid">
                <label>Región / generación objetivo
                  <select value={entry.targetGeneration} onChange={event => changeTargetGeneration(entry.id, Number(event.target.value))}>
                    {generations.map(generation => <option value={generation} key={generation}>Generación {roman[generation] ?? generation}</option>)}
                  </select>
                </label>
                <label>Juego que jugarás
                  <select value={entry.generator.gameId} onChange={event => changeGame(entry.id, event.target.value)}>
                    {dataset.games.map(game => <option value={game.id} key={game.id}>{game.name} · Gen {roman[game.generation] ?? game.generation}</option>)}
                  </select>
                </label>
              </div>
              <div className="field-grid">
                <label>Nombre del equipo
                  <input value={entry.label} onChange={event => updateEntry(entry.id, value => ({ ...value, label: event.target.value }))} />
                </label>
                <label>Tamaño
                  <select value={entry.generator.teamSize} onChange={event => updateEntry(entry.id, value => ({ ...value, generator: { ...value.generator, teamSize: Number(event.target.value) } }))}>
                    {[1, 2, 3, 4, 5, 6].map(size => <option value={size} key={size}>{size}</option>)}
                  </select>
                </label>
              </div>
              <div className="collection-options">
                <label className="collection-toggle">
                  <input
                    type="checkbox"
                    aria-label="Permitir evoluciones por intercambio"
                    checked={entry.generator.allowTradeEvolution}
                    onChange={event => updateEntry(entry.id, value => ({
                      ...value,
                      generator: { ...value.generator, allowTradeEvolution: event.target.checked }
                    }))}
                  />
                  <span className="collection-toggle__track" aria-hidden="true" />
                  <span className="collection-toggle__text">
                    <strong>Permitir evoluciones por intercambio</strong>
                    <small>Activa rutas como Haunter → Gengar cuando el juego y los datos las permiten.</small>
                  </span>
                </label>
                <label className="collection-toggle">
                  <input
                    type="checkbox"
                    aria-label="Permitir un Pokémon bonus"
                    checked={entry.allowBonus}
                    onChange={event => updateEntry(entry.id, value => ({ ...value, allowBonus: event.target.checked }))}
                  />
                  <span className="collection-toggle__track" aria-hidden="true" />
                  <span className="collection-toggle__text">
                    <strong>Permitir un Pokémon bonus</strong>
                    <small>Hasta uno fuera de la generación objetivo si necesitas completar el equipo.</small>
                  </span>
                </label>
              </div>
            </div>
          </section>
        ))}
      </div>

      {result && <section className="team-section">
        {resultEngineVersion < 2 && <div className="data-warning collection-legacy-warning" role="note">
          <span>⚠️</span>
          <div>
            <strong>Resultado generado con lógica anterior.</strong>
            <p>Conservamos tu colección guardada. Para aplicar las evoluciones nuevas, pulsa
            «Regenerar desbloqueados». Los miembros bloqueados seguirán igual;
            usa «Regenerar todo» si quieres reconstruir los equipos desde cero.</p>
          </div>
        </div>}
        <div className={result.complete ? 'result-badge success' : 'result-badge warning'}>{result.complete ? 'COLECCIÓN LISTA' : 'COLECCIÓN PARCIAL'}</div>
        <div className="result-heading">
          <div><h1>{result.teams.length} equipos. Una sola colección.</h1><p className="hero-copy">Los bloqueos sobreviven a las regeneraciones y ahora también a una recarga de la página.</p></div>
        </div>

        <div className="summary-card" style={{ marginBottom: 20 }}>
          <h3>Resumen global</h3>
          <p><b>{result.totalPokemon} Pokémon</b><small>{result.teams.length} equipos · {result.bonusesUsed} bonus usados</small></p>
          <p><b>{result.duplicateSpecies} especies repetidas</b><small>{result.duplicateFamilies} familias repetidas</small></p>
        </div>

        {result.warnings.length > 0 && <div className="data-warning" style={{ marginBottom: 18 }}>⚠ <span>{result.warnings.join(' ')}</span></div>}

        <div style={{ display: 'grid', gap: 24 }}>
          {result.teams.map(team => {
            const game = dataset.games.find(item => item.id === team.gameId);
            return <section className="config-card collection-result-card" key={team.entryId}>
              <div className="config-title">
                <div><h2>{team.label}</h2><span>{game?.name ?? team.gameId} · Gen objetivo {roman[team.targetGeneration] ?? team.targetGeneration} · {team.team.length} miembros</span></div>
                <div className="collection-team-actions">
                  <CollectionActionButton
                    icon={team.locked ? 'unlock' : 'lock'}
                    tone={team.locked ? 'lock' : 'secondary'}
                    aria-pressed={team.locked}
                    aria-label={team.locked ? 'Desbloquear equipo' : 'Bloquear equipo'}
                    onClick={() => toggleTeamLock(team.entryId)}
                  >
                    {team.locked ? 'Desbloquear equipo' : 'Bloquear equipo'}
                  </CollectionActionButton>
                  <CollectionActionButton icon="refresh" disabled={team.locked} onClick={() => rerollTeam(team.entryId)}>
                    Regenerar región
                  </CollectionActionButton>
                </div>
              </div>

              <div className="pokemon-grid">
                {team.team.map((slot, index) => {
                  const pokemon = slot.candidate.resolvedPokemon;
                  const isBonus = team.bonusCandidateKeys.includes(slot.candidate.candidateKey);
                  return <article className={slot.locked ? 'pokemon-card locked' : 'pokemon-card'} key={`${slot.candidate.candidateKey}-${index}`}>
                    <div className="card-number">N.º {String(pokemon.id).padStart(4, '0')}<span>{isBonus ? '★ BONUS' : ''}</span></div>
                    <div className="pokemon-art"><img src={spriteUrl(pokemon.id)} alt={pokemon.name} loading="lazy" /></div>
                    <h2>{pokemon.name}</h2>
                    <div className="collection-species-info">
                      <div className="collection-type-pills">
                        {pokemon.types.map(type => <span key={type} className={'collection-type collection-type--' + type}>{typeLabels[type] ?? type}</span>)}
                      </div>
                      <p>Origen de la línea: <strong>Gen {roman[familyOriginGeneration(dataset, slot.candidate.evolutionFamilyId)] ?? familyOriginGeneration(dataset, slot.candidate.evolutionFamilyId)}</strong></p>
                      {slot.candidate.sourcePokemon.id !== pokemon.id &&
                        <p>Evolución desde: <strong>{slot.candidate.sourcePokemon.name}</strong></p>}
                    </div>
                    <div className="card-footer collection-card-footer">
                      <CollectionActionButton
                        icon={slot.locked ? 'unlock' : 'lock'}
                        tone={slot.locked ? 'lock' : 'secondary'}
                        disabled={team.locked}
                        aria-pressed={slot.locked}
                        aria-label={slot.locked ? 'Desbloquear Pokémon' : 'Bloquear Pokémon'}
                        onClick={() => toggleMemberLock(team.entryId, index)}
                      >
                        {slot.locked ? 'Desbloquear' : 'Bloquear Pokémon'}
                      </CollectionActionButton>
                      <CollectionActionButton
                        icon="refresh"
                        disabled={slot.locked || team.locked}
                        aria-label="Regenerar Pokémon"
                        onClick={() => rerollMember(team.entryId, index)}
                      >
                        Regenerar
                      </CollectionActionButton>
                    </div>
                  </article>;
                })}
              </div>
            </section>;
          })}
        </div>
      </section>}
    </main>
  );
}
